/**
 * better-auth server configuration.
 *
 * Email/password auth backed by the shared Postgres database. Sign-up is
 * gated by DASHBOARD_ALLOW_SIGNUP: create the first admin account, then
 * turn it off.
 */
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';
import { headers } from 'next/headers';
import { createDb, authSchema } from '@oauth-mcp-gateway/db';

const { db } = createDb(process.env.DATABASE_URL ?? '');

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg', schema: authSchema }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
    disableSignUp: process.env.DASHBOARD_ALLOW_SIGNUP !== 'true',
  },
  plugins: [nextCookies()],
});

/** Server-side session lookup; returns null when not signed in. */
export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

/** Throws when not signed in — use at the top of server actions. */
export async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  return session;
}
