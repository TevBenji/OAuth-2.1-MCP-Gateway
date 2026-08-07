import { describe, it, expect } from 'vitest';
import app from '../../src/index';
import { generateCodeVerifier, createS256CodeChallenge } from '../../src/services/oauth/pkce';
import { makeTestEnv } from '../helpers/env';
import { registerTestClient } from '../helpers/oauth';

/** GET /oauth/authorize with the given query params, returning the redirect URL. */
async function authorize(params: Record<string, string>) {
  const env = makeTestEnv();
  const query = new URLSearchParams(params);
  const res = await app.request(`/oauth/authorize?${query.toString()}`, {}, env);
  expect(res.status).toBe(302);
  return new URL(res.headers.get('Location')!);
}

describe('OAuth 2.1 Authorization Flow Integration', () => {
  it('should complete a full authorization flow with PKCE', async () => {
    const env = makeTestEnv();
    const client = await registerTestClient(env);
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await createS256CodeChallenge(codeVerifier);
    const state = 'test-state-value';

    const redirectUrl = await authorize({
      response_type: 'code',
      client_id: client.client_id,
      redirect_uri: client.redirect_uri,
      scope: 'read write',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    // Verify the redirect URL contains the authorization code and state
    expect(redirectUrl.origin + redirectUrl.pathname).toBe(
      new URL(client.redirect_uri).origin + new URL(client.redirect_uri).pathname
    );
    expect(redirectUrl.searchParams.get('state')).toBe(state);

    const authCode = redirectUrl.searchParams.get('code');
    expect(authCode).toMatch(/^auth_[a-z0-9]+$/);
  });

  it('should reject requests without required PKCE parameters', async () => {
    const redirectUrl = await authorize({
      response_type: 'code',
      client_id: 'test-client-id',
      redirect_uri: 'https://client.example.com/callback',
      scope: 'read write',
      state: 'test-state-value',
      // Missing code_challenge and code_challenge_method
    });

    expect(redirectUrl.searchParams.get('error')).toBe('invalid_request');
    expect(redirectUrl.searchParams.get('error_description')).toContain(
      'code_challenge parameter is required'
    );
  });

  it('should reject requests with invalid code challenge method', async () => {
    const redirectUrl = await authorize({
      response_type: 'code',
      client_id: 'test-client-id',
      redirect_uri: 'https://client.example.com/callback',
      scope: 'read write',
      state: 'test-state-value',
      code_challenge: 'test-challenge',
      code_challenge_method: 'invalid_method',
    });

    expect(redirectUrl.searchParams.get('error')).toBe('invalid_request');
    expect(redirectUrl.searchParams.get('error_description')).toContain(
      'code_challenge_method must be S256'
    );
  });

  it('should reject requests without state parameter', async () => {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await createS256CodeChallenge(codeVerifier);

    const redirectUrl = await authorize({
      response_type: 'code',
      client_id: 'test-client-id',
      redirect_uri: 'https://client.example.com/callback',
      scope: 'read write',
      // Missing state parameter
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    expect(redirectUrl.searchParams.get('error')).toBe('invalid_request');
    expect(redirectUrl.searchParams.get('error_description')).toContain(
      'state parameter is required for CSRF protection'
    );
  });

  it('should reject requests with invalid response type', async () => {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await createS256CodeChallenge(codeVerifier);

    const redirectUrl = await authorize({
      response_type: 'token', // Invalid for authorization code flow
      client_id: 'test-client-id',
      redirect_uri: 'https://client.example.com/callback',
      scope: 'read write',
      state: 'test-state-value',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    expect(redirectUrl.searchParams.get('error')).toBe('unsupported_response_type');
    expect(redirectUrl.searchParams.get('error_description')).toContain('is not supported');
  });
});
