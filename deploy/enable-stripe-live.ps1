# Turns on live payments for academy.nipporia.com. Run once, from this repo, in PowerShell:
#   1. Copy the live secret key (sk_live_...) from Stripe > Developers > API keys.
#   2. powershell -ExecutionPolicy Bypass -File deploy\enable-stripe-live.ps1
# The key goes from your clipboard straight into Secret Manager; it is never printed.
# Then it creates the live prices, the customer portal and the webhook (setupStripeLive.ts),
# stores the webhook signing secret, and updates the Cloud Run service.
$ErrorActionPreference = 'Stop'
$Project = 'nipporia-lp-493210'
$Region = 'asia-northeast1'
$Service = 'nipporia-academy'
$Root = Split-Path -Parent $PSScriptRoot

$key = (Get-Clipboard | Out-String).Trim()
if (-not ($key.StartsWith('sk_live_') -or $key.StartsWith('rk_live_'))) {
  throw 'The clipboard does not hold a live Stripe secret key (sk_live_...). Copy it first.'
}

$tmp = Join-Path $env:TEMP ("nipporia-" + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $tmp | Out-Null
try {
  $keyFile = Join-Path $tmp 'k'
  [IO.File]::WriteAllText($keyFile, $key)
  gcloud secrets versions add academy-stripe-secret-key --project $Project --data-file=$keyFile | Out-Null
  Write-Host 'Stored the live key in Secret Manager (academy-stripe-secret-key).'

  $hookFile = Join-Path $tmp 'w'
  Push-Location (Join-Path $Root 'backend')
  try {
    $env:STRIPE_SECRET_KEY = $key
    $env:SITE_URL = 'https://academy.nipporia.com'
    $json = npx ts-node --transpile-only src/scripts/setupStripeLive.ts --webhook-secret-file $hookFile
    if ($LASTEXITCODE -ne 0) { throw 'setupStripeLive failed' }
  } finally {
    Remove-Item Env:STRIPE_SECRET_KEY -ErrorAction SilentlyContinue
    Pop-Location
  }
  $ids = ($json | Out-String) | ConvertFrom-Json
  Write-Host ($json | Out-String)

  if (Test-Path $hookFile) {
    gcloud secrets versions add academy-stripe-webhook-secret --project $Project --data-file=$hookFile | Out-Null
    Write-Host 'Stored the webhook signing secret (academy-stripe-webhook-secret).'
  }

  $envFile = Join-Path $PSScriptRoot 'stripe-live.env'
  @(
    "STRIPE_MONTHLY_PRICE_ID=$($ids.STRIPE_MONTHLY_PRICE_ID)",
    "STRIPE_YEARLY_PRICE_ID=$($ids.STRIPE_YEARLY_PRICE_ID)",
    "STRIPE_PORTAL_CONFIGURATION_ID=$($ids.STRIPE_PORTAL_CONFIGURATION_ID)"
  ) | Set-Content -Encoding ascii $envFile

  gcloud run services update $Service --project $Project --region $Region `
    --update-env-vars "STRIPE_MONTHLY_PRICE_ID=$($ids.STRIPE_MONTHLY_PRICE_ID),STRIPE_YEARLY_PRICE_ID=$($ids.STRIPE_YEARLY_PRICE_ID),STRIPE_PORTAL_CONFIGURATION_ID=$($ids.STRIPE_PORTAL_CONFIGURATION_ID)" `
    --update-secrets "STRIPE_SECRET_KEY=academy-stripe-secret-key:latest,STRIPE_WEBHOOK_SECRET=academy-stripe-webhook-secret:latest"
  Write-Host 'Live payments are on.'
} finally {
  Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
  Set-Clipboard -Value ' '
}
