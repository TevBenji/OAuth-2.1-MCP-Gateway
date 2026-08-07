# OAuth 2.1 MCP Gateway
FROM node:22-alpine
WORKDIR /app

RUN corepack enable

# Install dependencies (layer-cached until a manifest changes)
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/gateway/package.json apps/gateway/
COPY packages/db/package.json packages/db/
RUN pnpm install --frozen-lockfile --filter "@oauth-mcp-gateway/gateway..."

COPY packages/db packages/db
COPY apps/gateway apps/gateway

ENV NODE_ENV=production
EXPOSE 8787

# Migrations run automatically at boot (see apps/gateway/src/server.ts)
CMD ["pnpm", "--filter", "@oauth-mcp-gateway/gateway", "start"]
