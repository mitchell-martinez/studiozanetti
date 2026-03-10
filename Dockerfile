# ─────────────────────────────────────────────────────────────────────────────
# Studio Zanetti — multi-stage Docker build
#
# WORDPRESS_URL is intentionally NOT baked in at build time.
# The same image is used for both staging and production; the environment
# variable is injected at runtime via docker-compose env_file.
#
# Pre-rendering falls back to the three static pages (/, /about, /contact)
# when WORDPRESS_URL is absent at build time.  Any pages the admin adds in
# WordPress are served by the SSR catch-all route at runtime.
# ─────────────────────────────────────────────────────────────────────────────

# ─── Stage 1: install all npm dependencies ───────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ─── Stage 2: build the React Router SSR application ─────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ─── Stage 3: lean production runtime ────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

# Run as a non-root user for defence-in-depth
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 zanetti

ENV NODE_ENV=production
ENV PORT=3000

# Production dependencies (strips ~300 MB of devDependencies)
COPY --from=deps    --chown=zanetti:nodejs /app/node_modules ./node_modules
# Built server bundle + pre-rendered static pages
COPY --from=builder --chown=zanetti:nodejs /app/build ./build
# react-router-serve reads name/version from package.json
COPY --from=builder --chown=zanetti:nodejs /app/package.json ./package.json

USER zanetti
EXPOSE 3000

CMD ["node_modules/.bin/react-router-serve", "build/server/index.js"]
