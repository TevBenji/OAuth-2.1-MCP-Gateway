/**
 * Identity Provider (IdP) Federation Types
 *
 * Types for OIDC/SAML federation with external identity providers.
 */
/**
 * Supported IdP types
 */
export declare enum IdPType {
    OIDC = "oidc",
    SAML = "saml"
}
/**
 * Supported IdP providers
 */
export declare enum IdPProvider {
    AUTH0 = "auth0",
    OKTA = "okta",
    MICROSOFT_ENTRA = "microsoft_entra",
    GOOGLE = "google",
    CUSTOM = "custom"
}
/**
 * IdP configuration
 */
export interface IdPConfig {
    idp_id: string;
    tenant_id: string;
    provider: IdPProvider;
    type: IdPType;
    name: string;
    enabled: boolean;
    oidc_config?: OIDCConfig;
    saml_config?: SAMLConfig;
    attribute_mapping: AttributeMapping;
    role_mapping: RoleMapping;
    provisioning: ProvisioningConfig;
    created_at: Date;
    updated_at: Date;
}
/**
 * OIDC configuration
 */
export interface OIDCConfig {
    issuer: string;
    client_id: string;
    client_secret: string;
    authorization_endpoint?: string;
    token_endpoint?: string;
    userinfo_endpoint?: string;
    jwks_uri?: string;
    scopes: string[];
    response_type: 'code' | 'id_token' | 'code id_token';
    response_mode?: 'query' | 'fragment' | 'form_post';
}
/**
 * SAML configuration
 */
export interface SAMLConfig {
    entity_id: string;
    sso_url: string;
    slo_url?: string;
    certificate: string;
    signature_algorithm: 'sha256' | 'sha384' | 'sha512';
    digest_algorithm: 'sha256' | 'sha384' | 'sha512';
    name_id_format: string;
    want_assertions_signed: boolean;
    want_response_signed: boolean;
}
/**
 * User attribute mapping configuration
 */
export interface AttributeMapping {
    user_id: string;
    email: string;
    name?: string;
    given_name?: string;
    family_name?: string;
    picture?: string;
    custom_attributes?: Record<string, string>;
}
/**
 * Role mapping configuration
 */
export interface RoleMapping {
    role_claim: string;
    mappings: Record<string, string>;
    default_role?: string;
}
/**
 * Just-in-time provisioning configuration
 */
export interface ProvisioningConfig {
    enabled: boolean;
    create_users: boolean;
    update_users: boolean;
    deactivate_on_remove: boolean;
    sync_roles: boolean;
}
/**
 * Federated user identity
 */
export interface FederatedIdentity {
    identity_id: string;
    tenant_id: string;
    user_id: string;
    idp_id: string;
    idp_user_id: string;
    provider: IdPProvider;
    email: string;
    name?: string;
    picture?: string;
    first_login_at: Date;
    last_login_at: Date;
    login_count: number;
    created_at: Date;
    updated_at: Date;
}
/**
 * IdP authentication request
 */
export interface IdPAuthRequest {
    idp_id: string;
    tenant_id: string;
    redirect_uri: string;
    state: string;
    nonce?: string;
    scope?: string[];
    code_challenge?: string;
    code_challenge_method?: 'S256' | 'plain';
}
/**
 * IdP authentication response
 */
export interface IdPAuthResponse {
    idp_id: string;
    tenant_id: string;
    idp_user_id: string;
    email: string;
    email_verified: boolean;
    name?: string;
    given_name?: string;
    family_name?: string;
    picture?: string;
    raw_claims: Record<string, any>;
    roles: string[];
    user_id: string;
    is_new_user: boolean;
    authenticated_at: Date;
}
/**
 * IdP discovery metadata (OIDC)
 */
export interface OIDCDiscoveryMetadata {
    issuer: string;
    authorization_endpoint: string;
    token_endpoint: string;
    userinfo_endpoint?: string;
    jwks_uri: string;
    scopes_supported: string[];
    response_types_supported: string[];
    response_modes_supported?: string[];
    grant_types_supported: string[];
    subject_types_supported: string[];
    id_token_signing_alg_values_supported: string[];
    token_endpoint_auth_methods_supported: string[];
}
/**
 * IdP error codes
 */
export declare enum IdPErrorCode {
    INVALID_CONFIGURATION = "invalid_configuration",
    IDP_NOT_FOUND = "idp_not_found",
    IDP_DISABLED = "idp_disabled",
    DISCOVERY_FAILED = "discovery_failed",
    TOKEN_EXCHANGE_FAILED = "token_exchange_failed",
    USERINFO_FAILED = "userinfo_failed",
    INVALID_TOKEN = "invalid_token",
    PROVISIONING_FAILED = "provisioning_failed",
    ATTRIBUTE_MAPPING_FAILED = "attribute_mapping_failed",
    ROLE_MAPPING_FAILED = "role_mapping_failed",
    SAML_VALIDATION_FAILED = "saml_validation_failed",
    SAML_PARSING_FAILED = "saml_parsing_failed"
}
/**
 * IdP error
 */
export declare class IdPError extends Error {
    code: IdPErrorCode;
    details?: Record<string, any> | undefined;
    constructor(code: IdPErrorCode, message: string, details?: Record<string, any> | undefined);
}
/**
 * IdP statistics
 */
export interface IdPStats {
    idp_id: string;
    tenant_id: string;
    total_logins: number;
    successful_logins: number;
    failed_logins: number;
    new_users_provisioned: number;
    last_login_at?: Date;
    updated_at: Date;
}
