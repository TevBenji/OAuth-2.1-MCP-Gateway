import { Context } from 'hono';
export interface AuthorizationServerMetadata {
    issuer: string;
    authorization_endpoint: string;
    token_endpoint: string;
    token_endpoint_auth_methods_supported?: string[];
    token_endpoint_auth_signing_alg_values_supported?: string[];
    introspection_endpoint?: string;
    introspection_endpoint_auth_methods_supported?: string[];
    introspection_endpoint_auth_signing_alg_values_supported?: string[];
    revocation_endpoint?: string;
    revocation_endpoint_auth_methods_supported?: string[];
    revocation_endpoint_auth_signing_alg_values_supported?: string[];
    userinfo_endpoint?: string;
    jwks_uri?: string;
    registration_endpoint?: string;
    scopes_supported?: string[];
    response_types_supported: string[];
    response_modes_supported?: string[];
    grant_types_supported?: string[];
    acr_values_supported?: string[];
    subject_types_supported: string[];
    id_token_signing_alg_values_supported: string[];
    id_token_encryption_alg_values_supported?: string[];
    id_token_encryption_enc_values_supported?: string[];
    userinfo_signing_alg_values_supported?: string[];
    userinfo_encryption_alg_values_supported?: string[];
    userinfo_encryption_enc_values_supported?: string[];
    req_policy_uri?: string;
    op_policy_uri?: string;
    op_tos_uri?: string;
    revocation_uri?: string;
    revocation_auth_methods_supported?: string[];
    revocation_auth_signing_alg_values_supported?: string[];
    introspection_uri?: string;
    introspection_auth_methods_supported?: string[];
    introspection_auth_signing_alg_values_supported?: string[];
    code_challenge_methods_supported?: string[];
    service_documentation?: string;
    claims_parameter_supported?: boolean;
    request_parameter_supported?: boolean;
    request_uri_parameter_supported: boolean;
    require_request_uri_registration?: boolean;
    mtls_endpoint_aliases?: Record<string, string>;
    tls_client_certificate_bound_access_tokens?: boolean;
    sbang_verification_endpoint?: string;
    sbang_verification_endpoint_auth_methods_supported?: string[];
    sbang_verification_endpoint_auth_signing_alg_values_supported?: string[];
}
export interface ProtectedResourceMetadata {
    issuer: string;
    resource_indicators_supported?: boolean;
    resource_server_metadata_endpoint?: string;
    resource_server_configuration_endpoint?: string;
    resource_contexts_supported?: string[];
    scopes_supported?: string[];
    scope_to_claims_mappings_supported?: boolean;
    claims_supported?: string[];
    claim_types_supported?: string[];
    grant_types_supported?: string[];
    response_types_supported?: string[];
    response_modes_supported?: string[];
    token_endpoint: string;
    token_endpoint_auth_methods_supported?: string[];
    token_endpoint_auth_signing_alg_values_supported?: string[];
    dpop_signing_alg_values_supported?: string[];
    authorization_details_types_supported?: string[];
    authorization_details_parameter_supported?: boolean;
    authorization_data_types_supported?: string[];
    authorization_data_headers_supported?: string[];
    authorization_server_discovery_endpoint?: string;
    authorization_server_metadata_endpoint?: string;
    code_challenge_methods_supported?: string[];
    access_token_formats_supported?: string[];
    access_token_format_as_claim?: boolean;
    access_token_lifetime?: number;
    refresh_token_rotation_required?: boolean;
    par_supported?: boolean;
    par_required?: boolean;
    request_uri_parameter_supported?: boolean;
    require_pushed_authorization_requests?: boolean;
    mtls_endpoint_aliases?: Record<string, string>;
    sbang_verification_endpoint?: string;
    sbang_verification_endpoint_auth_methods_supported?: string[];
    sbang_verification_endpoint_auth_signing_alg_values_supported?: string[];
    dpop_supported?: boolean;
    resource_indicators_required?: boolean;
    authorization_code_validity_seconds?: number;
    access_token_validity_seconds?: number;
    refresh_token_validity_seconds?: number;
}
/**
 * RFC 8414 Authorization Server Metadata endpoint
 * Returns metadata about the OAuth 2.1 authorization server
 */
export declare const getAuthorizationServerMetadata: (c: Context) => Promise<Response & import("hono").TypedResponse<{
    issuer: string;
    authorization_endpoint: string;
    token_endpoint: string;
    token_endpoint_auth_methods_supported?: string[] | undefined;
    token_endpoint_auth_signing_alg_values_supported?: string[] | undefined;
    introspection_endpoint?: string | undefined;
    introspection_endpoint_auth_methods_supported?: string[] | undefined;
    introspection_endpoint_auth_signing_alg_values_supported?: string[] | undefined;
    revocation_endpoint?: string | undefined;
    revocation_endpoint_auth_methods_supported?: string[] | undefined;
    revocation_endpoint_auth_signing_alg_values_supported?: string[] | undefined;
    userinfo_endpoint?: string | undefined;
    jwks_uri?: string | undefined;
    registration_endpoint?: string | undefined;
    scopes_supported?: string[] | undefined;
    response_types_supported: string[];
    response_modes_supported?: string[] | undefined;
    grant_types_supported?: string[] | undefined;
    acr_values_supported?: string[] | undefined;
    subject_types_supported: string[];
    id_token_signing_alg_values_supported: string[];
    id_token_encryption_alg_values_supported?: string[] | undefined;
    id_token_encryption_enc_values_supported?: string[] | undefined;
    userinfo_signing_alg_values_supported?: string[] | undefined;
    userinfo_encryption_alg_values_supported?: string[] | undefined;
    userinfo_encryption_enc_values_supported?: string[] | undefined;
    req_policy_uri?: string | undefined;
    op_policy_uri?: string | undefined;
    op_tos_uri?: string | undefined;
    revocation_uri?: string | undefined;
    revocation_auth_methods_supported?: string[] | undefined;
    revocation_auth_signing_alg_values_supported?: string[] | undefined;
    introspection_uri?: string | undefined;
    introspection_auth_methods_supported?: string[] | undefined;
    introspection_auth_signing_alg_values_supported?: string[] | undefined;
    code_challenge_methods_supported?: string[] | undefined;
    service_documentation?: string | undefined;
    claims_parameter_supported?: boolean | undefined;
    request_parameter_supported?: boolean | undefined;
    request_uri_parameter_supported: boolean;
    require_request_uri_registration?: boolean | undefined;
    mtls_endpoint_aliases?: {
        [x: string]: string;
    } | undefined;
    tls_client_certificate_bound_access_tokens?: boolean | undefined;
    sbang_verification_endpoint?: string | undefined;
    sbang_verification_endpoint_auth_methods_supported?: string[] | undefined;
    sbang_verification_endpoint_auth_signing_alg_values_supported?: string[] | undefined;
}>>;
/**
 * RFC 9728 Protected Resource Metadata endpoint
 * Returns metadata about the protected resources
 */
export declare const getProtectedResourceMetadata: (c: Context) => Promise<Response & import("hono").TypedResponse<{
    issuer: string;
    resource_indicators_supported?: boolean | undefined;
    resource_server_metadata_endpoint?: string | undefined;
    resource_server_configuration_endpoint?: string | undefined;
    resource_contexts_supported?: string[] | undefined;
    scopes_supported?: string[] | undefined;
    scope_to_claims_mappings_supported?: boolean | undefined;
    claims_supported?: string[] | undefined;
    claim_types_supported?: string[] | undefined;
    grant_types_supported?: string[] | undefined;
    response_types_supported?: string[] | undefined;
    response_modes_supported?: string[] | undefined;
    token_endpoint: string;
    token_endpoint_auth_methods_supported?: string[] | undefined;
    token_endpoint_auth_signing_alg_values_supported?: string[] | undefined;
    dpop_signing_alg_values_supported?: string[] | undefined;
    authorization_details_types_supported?: string[] | undefined;
    authorization_details_parameter_supported?: boolean | undefined;
    authorization_data_types_supported?: string[] | undefined;
    authorization_data_headers_supported?: string[] | undefined;
    authorization_server_discovery_endpoint?: string | undefined;
    authorization_server_metadata_endpoint?: string | undefined;
    code_challenge_methods_supported?: string[] | undefined;
    access_token_formats_supported?: string[] | undefined;
    access_token_format_as_claim?: boolean | undefined;
    access_token_lifetime?: number | undefined;
    refresh_token_rotation_required?: boolean | undefined;
    par_supported?: boolean | undefined;
    par_required?: boolean | undefined;
    request_uri_parameter_supported?: boolean | undefined;
    require_pushed_authorization_requests?: boolean | undefined;
    mtls_endpoint_aliases?: {
        [x: string]: string;
    } | undefined;
    sbang_verification_endpoint?: string | undefined;
    sbang_verification_endpoint_auth_methods_supported?: string[] | undefined;
    sbang_verification_endpoint_auth_signing_alg_values_supported?: string[] | undefined;
    dpop_supported?: boolean | undefined;
    resource_indicators_required?: boolean | undefined;
    authorization_code_validity_seconds?: number | undefined;
    access_token_validity_seconds?: number | undefined;
    refresh_token_validity_seconds?: number | undefined;
}>>;
/**
 * CORS preflight handler for discovery endpoints
 */
export declare const discoveryPreflight: (c: Context) => Promise<Response>;
