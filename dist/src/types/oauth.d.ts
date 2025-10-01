/**
 * OAuth 2.1 Type Definitions
 *
 * Complete type definitions for OAuth 2.1 protocol implementation
 * including PKCE, Resource Indicators (RFC 8707), and Dynamic Client Registration.
 */
import { z } from 'zod';
export declare const AuthorizeRequestSchema: z.ZodObject<{
    client_id: z.ZodString;
    redirect_uri: z.ZodString;
    response_type: z.ZodLiteral<"code">;
    scope: z.ZodOptional<z.ZodString>;
    state: z.ZodString;
    code_challenge: z.ZodString;
    code_challenge_method: z.ZodLiteral<"S256">;
    resource: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    client_id: string;
    redirect_uri: string;
    response_type: "code";
    state: string;
    code_challenge: string;
    code_challenge_method: "S256";
    scope?: string | undefined;
    resource?: string | undefined;
}, {
    client_id: string;
    redirect_uri: string;
    response_type: "code";
    state: string;
    code_challenge: string;
    code_challenge_method: "S256";
    scope?: string | undefined;
    resource?: string | undefined;
}>;
export type AuthorizeRequest = z.infer<typeof AuthorizeRequestSchema>;
export interface AuthorizeResponse {
    code: string;
    state: string;
}
export declare const TokenRequestSchema: z.ZodObject<{
    grant_type: z.ZodEnum<["authorization_code", "refresh_token"]>;
    code: z.ZodOptional<z.ZodString>;
    redirect_uri: z.ZodOptional<z.ZodString>;
    client_id: z.ZodString;
    code_verifier: z.ZodOptional<z.ZodString>;
    resource: z.ZodOptional<z.ZodString>;
    refresh_token: z.ZodOptional<z.ZodString>;
    scope: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    client_id: string;
    grant_type: "authorization_code" | "refresh_token";
    redirect_uri?: string | undefined;
    code?: string | undefined;
    scope?: string | undefined;
    resource?: string | undefined;
    refresh_token?: string | undefined;
    code_verifier?: string | undefined;
}, {
    client_id: string;
    grant_type: "authorization_code" | "refresh_token";
    redirect_uri?: string | undefined;
    code?: string | undefined;
    scope?: string | undefined;
    resource?: string | undefined;
    refresh_token?: string | undefined;
    code_verifier?: string | undefined;
}>;
export type TokenRequest = z.infer<typeof TokenRequestSchema>;
export interface TokenResponse {
    access_token: string;
    token_type: 'Bearer';
    expires_in: number;
    refresh_token?: string;
    scope?: string;
    resource?: string;
}
export interface TokenPayload {
    iss: string;
    sub: string;
    aud: string;
    exp: number;
    iat: number;
    jti: string;
    scope: string;
    client_id: string;
    tenant_id: string;
    session_id: string;
    device_id?: string;
    auth_time: number;
    risk_score?: number;
}
export interface PKCEChallenge {
    code_verifier: string;
    code_challenge: string;
    code_challenge_method: 'S256';
}
export declare const ClientRegistrationRequestSchema: z.ZodObject<{
    redirect_uris: z.ZodArray<z.ZodString, "many">;
    client_name: z.ZodOptional<z.ZodString>;
    client_uri: z.ZodOptional<z.ZodString>;
    logo_uri: z.ZodOptional<z.ZodString>;
    scope: z.ZodOptional<z.ZodString>;
    contacts: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    tos_uri: z.ZodOptional<z.ZodString>;
    policy_uri: z.ZodOptional<z.ZodString>;
    token_endpoint_auth_method: z.ZodOptional<z.ZodEnum<["none", "client_secret_post", "client_secret_basic"]>>;
    grant_types: z.ZodOptional<z.ZodArray<z.ZodEnum<["authorization_code", "refresh_token"]>, "many">>;
    response_types: z.ZodOptional<z.ZodArray<z.ZodLiteral<"code">, "many">>;
}, "strip", z.ZodTypeAny, {
    redirect_uris: string[];
    scope?: string | undefined;
    client_name?: string | undefined;
    client_uri?: string | undefined;
    logo_uri?: string | undefined;
    contacts?: string[] | undefined;
    tos_uri?: string | undefined;
    policy_uri?: string | undefined;
    token_endpoint_auth_method?: "none" | "client_secret_post" | "client_secret_basic" | undefined;
    grant_types?: ("authorization_code" | "refresh_token")[] | undefined;
    response_types?: "code"[] | undefined;
}, {
    redirect_uris: string[];
    scope?: string | undefined;
    client_name?: string | undefined;
    client_uri?: string | undefined;
    logo_uri?: string | undefined;
    contacts?: string[] | undefined;
    tos_uri?: string | undefined;
    policy_uri?: string | undefined;
    token_endpoint_auth_method?: "none" | "client_secret_post" | "client_secret_basic" | undefined;
    grant_types?: ("authorization_code" | "refresh_token")[] | undefined;
    response_types?: "code"[] | undefined;
}>;
export type ClientRegistrationRequest = z.infer<typeof ClientRegistrationRequestSchema>;
export interface ClientRegistrationResponse {
    client_id: string;
    client_secret?: string;
    client_id_issued_at: number;
    client_secret_expires_at?: number;
    redirect_uris: string[];
    grant_types: string[];
    response_types: string[];
    client_name?: string;
    client_uri?: string;
    logo_uri?: string;
    scope?: string;
    contacts?: string[];
    tos_uri?: string;
    policy_uri?: string;
    token_endpoint_auth_method: string;
}
export interface OAuthError {
    error: 'invalid_request' | 'invalid_client' | 'invalid_grant' | 'unauthorized_client' | 'unsupported_grant_type' | 'invalid_scope' | 'invalid_target' | 'access_denied';
    error_description?: string;
    error_uri?: string;
    state?: string;
}
export interface AuthorizationServerMetadata {
    issuer: string;
    authorization_endpoint: string;
    token_endpoint: string;
    registration_endpoint?: string;
    scopes_supported?: string[];
    response_types_supported: string[];
    grant_types_supported?: string[];
    token_endpoint_auth_methods_supported?: string[];
    code_challenge_methods_supported: string[];
    resource_parameter_supported?: boolean;
}
export interface ProtectedResourceMetadata {
    resource: string;
    authorization_servers: string[];
    scopes_supported?: string[];
    bearer_methods_supported?: string[];
    resource_documentation?: string;
}
