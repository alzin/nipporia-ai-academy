# Production image: the API (Express) also serves the built React app, so the
# site and the API share one origin (academy.nipporia.com) and cookies stay first-party.

# ---------- web ----------
FROM node:24-alpine AS web
WORKDIR /web
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
# Stripe publishable key (pk_...) is public; it is baked into the bundle.
ARG REACT_APP_STRIPE_PUBLIC_KEY=""
ARG REACT_APP_GTM_ID=""
ENV CI=false \
    GENERATE_SOURCEMAP=false \
    REACT_APP_API_URL=/api \
    REACT_APP_STRIPE_PUBLIC_KEY=$REACT_APP_STRIPE_PUBLIC_KEY \
    REACT_APP_GTM_ID=$REACT_APP_GTM_ID
RUN npm run build

# ---------- api ----------
FROM node:24-alpine AS api
WORKDIR /api
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY backend/ ./
RUN npx tsc -p . && npm prune --omit=dev

# ---------- runtime ----------
FROM node:24-alpine
ENV NODE_ENV=production PORT=8080
WORKDIR /app
COPY --from=api /api/package.json ./
COPY --from=api /api/node_modules ./node_modules
COPY --from=api /api/dist ./dist
COPY --from=web /web/build ./public
COPY landing/ ./public/
USER node
EXPOSE 8080
CMD ["node", "dist/index.js"]
