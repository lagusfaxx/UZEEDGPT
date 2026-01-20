# syntax=docker/dockerfile:1

FROM node:20-bookworm-slim AS deps
WORKDIR /app
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

COPY pnpm-workspace.yaml package.json tsconfig.base.json pnpm-lock.yaml ./
COPY packages/shared/package.json packages/shared/tsconfig.json ./packages/shared/
COPY apps/web/package.json apps/web/tsconfig.json apps/web/next.config.mjs ./apps/web/

RUN pnpm install --frozen-lockfile

FROM node:20-bookworm-slim AS build
WORKDIR /app
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

COPY --from=deps /pnpm /pnpm
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm --filter @uzeed/shared build
RUN pnpm --filter @uzeed/web build

FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Standalone server
COPY --from=build /app/apps/web/.next/standalone ./

# Next static assets MUST be at ./.next/static relative to server root
COPY --from=build /app/apps/web/.next/static ./.next/static

# Public MUST be at ./public relative to server root
COPY --from=build /app/apps/web/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
