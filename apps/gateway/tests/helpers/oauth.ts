/**
 * Shared OAuth flow helpers: drive the real Hono app through client
 * registration, authorization, and token exchange.
 */
import app from '../../src/index';
import type { Bindings } from '../../src/types/bindings';
import { generateCodeVerifier, createS256CodeChallenge } from '../../src/services/oauth/pkce';

/** Build a form-encoded POST RequestInit. */
export const form = (params: Record<string, string>) => ({
  method: 'POST' as const,
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams(params).toString(),
});

export interface RegisteredClient {
  client_id: string;
  client_secret?: string;
  redirect_uri: string;
}

/** Register an OAuth client through POST /oauth/register. */
export async function registerTestClient(
  env: Bindings,
  overrides: Record<string, unknown> = {}
): Promise<RegisteredClient> {
  const redirectUris = (overrides.redirect_uris as string[]) ?? ['https://client.example.com/callback'];
  const res = await app.request(
    '/oauth/register',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_name: 'Test Client',
        redirect_uris: redirectUris,
        token_endpoint_auth_method: 'none',
        scope: 'mcp:tools:read mcp:resources:read',
        ...overrides,
      }),
    },
    env
  );
  if (res.status !== 201) {
    throw new Error(`Client registration failed (${res.status}): ${await res.text()}`);
  }
  const body = (await res.json()) as { client_id: string; client_secret?: string };
  return { client_id: body.client_id, client_secret: body.client_secret, redirect_uri: redirectUris[0]! };
}

/** Run GET /oauth/authorize and extract the authorization code from the redirect. */
export async function getAuthorizationCode(
  env: Bindings,
  params: {
    client_id: string;
    redirect_uri: string;
    code_challenge: string;
    scope?: string;
    state?: string;
  }
): Promise<string> {
  const query = new URLSearchParams({
    response_type: 'code',
    client_id: params.client_id,
    redirect_uri: params.redirect_uri,
    scope: params.scope ?? 'mcp:tools:read mcp:resources:read',
    state: params.state ?? 'test-state',
    code_challenge: params.code_challenge,
    code_challenge_method: 'S256',
  });
  const res = await app.request(`/oauth/authorize?${query.toString()}`, {}, env);
  if (res.status !== 302) {
    throw new Error(`Authorization failed (${res.status}): ${await res.text()}`);
  }
  const location = new URL(res.headers.get('Location')!);
  const error = location.searchParams.get('error');
  if (error) {
    throw new Error(`Authorization error: ${error}: ${location.searchParams.get('error_description')}`);
  }
  return location.searchParams.get('code')!;
}

export interface TokenSet {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

/** Full authorization-code + PKCE flow; returns the issued tokens. */
export async function completeOAuthFlow(
  env: Bindings,
  options: { scope?: string } = {}
): Promise<TokenSet & { client: RegisteredClient }> {
  const client = await registerTestClient(env);
  const verifier = generateCodeVerifier();
  const challenge = await createS256CodeChallenge(verifier);
  const code = await getAuthorizationCode(env, {
    client_id: client.client_id,
    redirect_uri: client.redirect_uri,
    code_challenge: challenge,
    scope: options.scope,
  });
  const res = await app.request(
    '/oauth/token',
    form({
      grant_type: 'authorization_code',
      code,
      redirect_uri: client.redirect_uri,
      client_id: client.client_id,
      code_verifier: verifier,
    }),
    env
  );
  if (res.status !== 200) {
    throw new Error(`Token exchange failed (${res.status}): ${await res.text()}`);
  }
  const tokens = (await res.json()) as TokenSet;
  return { ...tokens, client };
}
