#!/usr/bin/env bash
# Deploys the production service (academy.nipporia.com) to Cloud Run.
# Usage: deploy/deploy.sh [image-tag]   (without a tag it builds a new image first)
# Runs automatically on every push to main (.github/workflows/deploy.yml); can also be run by hand.
# Secrets live in Secret Manager (academy-*); nothing secret is in this file.
set -euo pipefail
cd "$(dirname "$0")/.."

PROJECT=nipporia-lp-493210
REGION=asia-northeast1
SERVICE=nipporia-academy
SITE=https://academy.nipporia.com
REPO=$REGION-docker.pkg.dev/$PROJECT/cloud-run-source-deploy/$SERVICE
# Public values (safe to commit)
STRIPE_PUBLIC_KEY=pk_live_51OhPFOI6nAuCGeztPW9bq17wk7V0DjEqKSn5lZbtnd3tOgoLKGSZQKgb5AmmyEiS36b6dyuW22iXAmrhx3DVsz6v00qNtSHdRb
GOOGLE_CLIENT_ID=345401791489-8e58icaiqbhtservbo5p0vrm368a5k06.apps.googleusercontent.com

TAG=${1:-}
if [ -z "$TAG" ]; then
  TAG=$(date +%Y%m%d-%H%M%S)
  gcloud builds submit . --project $PROJECT --region $REGION --config deploy/cloudbuild.yaml \
    --service-account "projects/$PROJECT/serviceAccounts/academy-builder@$PROJECT.iam.gserviceaccount.com" \
    --gcs-source-staging-dir "gs://${PROJECT}_cloudbuild/source" \
    --substitutions "_IMAGE=$REPO:$TAG,_STRIPE_PUBLIC_KEY=$STRIPE_PUBLIC_KEY"
fi

# Fails the deploy (instead of silently leaving payments off) if the secret can't be read.
has_version() {
  local out
  out=$(gcloud secrets versions list "$1" --project $PROJECT --filter=state=ENABLED --limit=1 --format='value(name)') \
    || { echo "Cannot read secret $1; stopping." >&2; exit 1; }
  [ -n "$out" ]
}

SECRETS="DATABASE_URL=academy-database-url:latest"
SECRETS+=",JWT_SECRET=academy-jwt-secret:latest,JWT_REFRESH_SECRET=academy-jwt-refresh-secret:latest"
SECRETS+=",AWS_ACCESS_KEY_ID=academy-aws-access-key-id:latest,AWS_SECRET_ACCESS_KEY=academy-aws-secret-access-key:latest"
SECRETS+=",EMAIL_PASS=academy-email-pass:latest"
# Payments switch on once the live Stripe key (and webhook secret) are stored.
if has_version academy-stripe-secret-key; then SECRETS+=",STRIPE_SECRET_KEY=academy-stripe-secret-key:latest"; fi
if has_version academy-stripe-webhook-secret; then SECRETS+=",STRIPE_WEBHOOK_SECRET=academy-stripe-webhook-secret:latest"; fi

ENVS="NODE_ENV=production,API_URL=$SITE/api,FRONTEND_URL=$SITE"
ENVS+=",AWS_REGION=ap-northeast-1,AWS_S3_BUCKET_NAME=nipporia-ai-academy"
ENVS+=",EMAIL_HOST=smtp.office365.com,EMAIL_PORT=587,EMAIL_USER=info@nipporia.com,EMAIL_FROM=info@nipporia.com"
ENVS+=",GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID,FREE_TRIAL_DAYS=0"
# Stripe IDs (not secret, committed) from deploy/stripe-live.env, written by enable-stripe-live.ps1
if [ -f deploy/stripe-live.env ]; then
  while IFS='=' read -r k v; do [ -n "$k" ] && ENVS+=",$k=$v"; done < <(grep -E '^STRIPE_[A-Z_]+=' deploy/stripe-live.env | tr -d '\r')
fi

gcloud run deploy $SERVICE --project $PROJECT --region $REGION --image "$REPO:$TAG" \
  --service-account nipporia-academy-run@$PROJECT.iam.gserviceaccount.com \
  --allow-unauthenticated --port 8080 --cpu 1 --memory 512Mi \
  --min-instances 1 --max-instances 4 --concurrency 80 --timeout 60 \
  --set-env-vars "$ENVS" --set-secrets "$SECRETS"
