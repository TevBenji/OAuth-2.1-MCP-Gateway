/**
 * PostgreSQL schema for the OAuth 2.1 MCP Gateway.
 * Single source of truth, shared by the gateway and the dashboard.
 */
import {
  pgTable,
  text,
  boolean,
  integer,
  real,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
  primaryKey,
} from 'drizzle-orm/pg-core';

const uuid = () => crypto.randomUUID();
const createdAt = () => timestamp('created_at', { withTimezone: true }).defaultNow().notNull();
const updatedAt = () =>
  timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date());

export const tenants = pgTable('tenants', {
  tenantId: text('tenant_id').primaryKey().$defaultFn(uuid),
  name: text('name').notNull(),
  domain: text('domain').notNull().unique(),
  description: text('description'),
  complianceTier: text('compliance_tier').notNull().default('standard'),
  status: text('status').$type<'active' | 'suspended' | 'pending'>().notNull().default('active'),
  maxUsers: integer('max_users').notNull().default(100),
  maxMcpServers: integer('max_mcp_servers').notNull().default(10),
  maxOauthClients: integer('max_oauth_clients').notNull().default(50),
  maxRequestsPerMinute: integer('max_requests_per_minute').notNull().default(100),
  maxTokensPerHour: integer('max_tokens_per_hour').notNull().default(1000),
  auditRetentionDays: integer('audit_retention_days').notNull().default(365),
  enableAuditLogging: boolean('enable_audit_logging').notNull().default(true),
  enableSessionManagement: boolean('enable_session_management').notNull().default(true),
  enableRateLimiting: boolean('enable_rate_limiting').notNull().default(true),
  allowCustomScopes: boolean('allow_custom_scopes').notNull().default(false),
  requireMfa: boolean('require_mfa').notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const users = pgTable(
  'users',
  {
    userId: text('user_id').primaryKey().$defaultFn(uuid),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenants.tenantId, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    emailVerified: boolean('email_verified').notNull().default(false),
    name: text('name'),
    picture: text('picture'),
    locale: text('locale'),
    externalId: text('external_id'),
    status: text('status')
      .$type<'active' | 'inactive' | 'suspended' | 'pending_verification'>()
      .notNull()
      .default('active'),
    lastLogin: timestamp('last_login', { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  t => [
    index('idx_users_tenant_id').on(t.tenantId),
    index('idx_users_email').on(t.email),
    // one account per email per tenant
    uniqueIndex('uq_users_tenant_email').on(t.tenantId, t.email),
  ]
);

export const oauthClients = pgTable(
  'oauth_clients',
  {
    // opaque protocol identifier (RFC 7591), issued by the gateway
    clientId: text('client_id').primaryKey(),
    clientSecret: text('client_secret'),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenants.tenantId, { onDelete: 'cascade' }),
    redirectUris: jsonb('redirect_uris').$type<string[]>().notNull().default([]),
    grantTypes: jsonb('grant_types')
      .$type<string[]>()
      .notNull()
      .default(['authorization_code', 'refresh_token']),
    responseTypes: jsonb('response_types').$type<string[]>().notNull().default(['code']),
    scope: text('scope'),
    clientName: text('client_name'),
    clientUri: text('client_uri'),
    logoUri: text('logo_uri'),
    contacts: jsonb('contacts').$type<string[]>(),
    tosUri: text('tos_uri'),
    policyUri: text('policy_uri'),
    tokenEndpointAuthMethod: text('token_endpoint_auth_method')
      .$type<'none' | 'client_secret_post' | 'client_secret_basic'>()
      .notNull()
      .default('client_secret_post'),
    clientType: text('client_type').$type<'public' | 'confidential'>().notNull().default('public'),
    status: text('status').$type<'active' | 'inactive' | 'suspended'>().notNull().default('active'),
    clientIdIssuedAt: timestamp('client_id_issued_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    clientSecretExpiresAt: timestamp('client_secret_expires_at', { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  t => [index('idx_oauth_clients_tenant_id').on(t.tenantId)]
);

export const authorizationCodes = pgTable(
  'authorization_codes',
  {
    // opaque one-time code handed to the client
    code: text('code').primaryKey(),
    clientId: text('client_id')
      .notNull()
      .references(() => oauthClients.clientId, { onDelete: 'cascade' }),
    userId: text('user_id').notNull(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenants.tenantId, { onDelete: 'cascade' }),
    redirectUri: text('redirect_uri').notNull(),
    scope: text('scope'),
    codeChallenge: text('code_challenge'),
    codeChallengeMethod: text('code_challenge_method').$type<'S256'>().notNull().default('S256'),
    // RFC 8707 resource indicator
    resource: text('resource'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  t => [
    index('idx_authorization_codes_client_id').on(t.clientId),
    index('idx_authorization_codes_expires_at').on(t.expiresAt),
  ]
);

export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    tokenId: text('token_id').primaryKey().$defaultFn(uuid),
    // only a hash of the token is stored
    tokenHash: text('token_hash').notNull().unique(),
    // RFC 9700 reuse detection: every token issued at code exchange starts a
    // family; rotation issues children in the same family. Presenting a
    // rotated token is theft evidence and revokes the whole family.
    familyId: text('family_id').notNull().$defaultFn(uuid),
    status: text('status').$type<'active' | 'rotated' | 'revoked'>().notNull().default('active'),
    // token_id of the child this token was rotated into (rotation linkage)
    rotatedTo: text('rotated_to'),
    clientId: text('client_id')
      .notNull()
      .references(() => oauthClients.clientId, { onDelete: 'cascade' }),
    userId: text('user_id').notNull(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenants.tenantId, { onDelete: 'cascade' }),
    scope: text('scope'),
    resource: text('resource'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    lastUsed: timestamp('last_used', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: createdAt(),
  },
  t => [
    index('idx_refresh_tokens_client_id').on(t.clientId),
    index('idx_refresh_tokens_expires_at').on(t.expiresAt),
    index('idx_refresh_tokens_family_id').on(t.familyId),
  ]
);

export const mcpServers = pgTable(
  'mcp_servers',
  {
    serverId: text('server_id').primaryKey().$defaultFn(uuid),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenants.tenantId, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    endpointUrl: text('endpoint_url').notNull(),
    // RFC 8707 resource identifier this server is addressed by
    resourceIdentifier: text('resource_identifier').notNull().unique(),
    requiredScopes: jsonb('required_scopes').$type<string[]>().notNull().default([]),
    healthCheckUrl: text('health_check_url'),
    status: text('status')
      .$type<'active' | 'inactive' | 'maintenance'>()
      .notNull()
      .default('active'),
    timeoutMs: integer('timeout_ms').notNull().default(30000),
    retryAttempts: integer('retry_attempts').notNull().default(3),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  t => [index('idx_mcp_servers_tenant_id').on(t.tenantId)]
);

export const sessions = pgTable(
  'sessions',
  {
    sessionId: text('session_id').primaryKey().$defaultFn(uuid),
    userId: text('user_id').notNull(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenants.tenantId, { onDelete: 'cascade' }),
    deviceId: text('device_id'),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    // arbitrary session payload (replaces the old KV value)
    data: jsonb('data').$type<Record<string, unknown>>(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    lastActivity: timestamp('last_activity', { withTimezone: true }).defaultNow().notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: createdAt(),
  },
  t => [
    index('idx_sessions_user_id').on(t.userId),
    index('idx_sessions_expires_at').on(t.expiresAt),
  ]
);

export const apiKeys = pgTable(
  'api_keys',
  {
    keyId: text('key_id').primaryKey().$defaultFn(uuid),
    // only a hash of the key is stored
    keyHash: text('key_hash').notNull().unique(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenants.tenantId, { onDelete: 'cascade' }),
    keyVersion: integer('key_version').notNull().default(1),
    status: text('status').$type<'active' | 'inactive' | 'revoked'>().notNull().default('active'),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    lastUsed: timestamp('last_used', { withTimezone: true }),
    createdAt: createdAt(),
  },
  t => [index('idx_api_keys_tenant_id').on(t.tenantId)]
);

// One token-bucket row per (key, window); a single upsert per check keeps it
// race-safe across gateway replicas (see rate-limit-storage-pg.ts).
export const rateLimitWindows = pgTable(
  'rate_limit_windows',
  {
    key: text('key').notNull(),
    window: text('window').notNull(),
    count: integer('count').notNull().default(0),
    windowStart: timestamp('window_start', { withTimezone: true }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  t => [
    primaryKey({ columns: [t.key, t.window] }),
    index('idx_rate_limit_windows_expires_at').on(t.expiresAt),
  ]
);

export const rateLimitBlocks = pgTable(
  'rate_limit_blocks',
  {
    key: text('key').primaryKey(),
    blockedAt: timestamp('blocked_at', { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    reason: text('reason').notNull(),
    violationCount: integer('violation_count').notNull().default(1),
  },
  t => [index('idx_rate_limit_blocks_expires_at').on(t.expiresAt)]
);

export const auditLogs = pgTable(
  'audit_logs',
  {
    logId: text('log_id').primaryKey().$defaultFn(uuid),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenants.tenantId, { onDelete: 'cascade' }),
    eventType: text('event_type').notNull(),
    userId: text('user_id'),
    clientId: text('client_id'),
    resourceType: text('resource_type'),
    resourceId: text('resource_id'),
    action: text('action').notNull(),
    outcome: text('outcome').$type<'success' | 'failure' | 'denied'>().notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    complianceTags: jsonb('compliance_tags').$type<string[]>(),
    riskScore: real('risk_score'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    createdAt: createdAt(),
  },
  t => [
    index('idx_audit_logs_tenant_created').on(t.tenantId, t.createdAt),
    index('idx_audit_logs_event_type').on(t.eventType),
  ]
);

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
export type User = typeof users.$inferSelect;
export type OAuthClient = typeof oauthClients.$inferSelect;
export type NewOAuthClient = typeof oauthClients.$inferInsert;
export type AuthorizationCode = typeof authorizationCodes.$inferSelect;
export type NewAuthorizationCode = typeof authorizationCodes.$inferInsert;
export type RefreshToken = typeof refreshTokens.$inferSelect;
export type NewRefreshToken = typeof refreshTokens.$inferInsert;
export type McpServer = typeof mcpServers.$inferSelect;
export type NewMcpServer = typeof mcpServers.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type ApiKey = typeof apiKeys.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
