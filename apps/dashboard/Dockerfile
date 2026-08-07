# Dashboard — build from the repo root:
#   docker build -f apps/dashboard/Dockerfile .
FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/dashboard/package.json apps/dashboard/
COPY packages/db/package.json packages/db/
RUN pnpm install --frozen-lockfile --filter "@oauth-mcp-gateway/dashboard..."

COPY packages/db packages/db
COPY apps/dashboard apps/dashboard

# Dummy values so `next build` can evaluate server modules; real values come
# from the runtime environment.
ENV DATABASE_URL=postgres://build:build@localhost:5432/build
ENV BETTER_AUTH_SECRET=build-time-secret-not-used-at-runtime
ARG NEXT_PUBLIC_GATEWAY_URL=http://localhost:8787
ENV NEXT_PUBLIC_GATEWAY_URL=$NEXT_PUBLIC_GATEWAY_URL
RUN pnpm --filter "@oauth-mcp-gateway/dashboard" build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/dashboard/.next/standalone ./
COPY --from=builder /app/apps/dashboard/.next/static ./apps/dashboard/.next/static
COPY --from=builder /app/apps/dashboard/public ./apps/dashboard/public
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
CMD ["node", "apps/dashboard/server.js"]
