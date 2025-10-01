/**
 * Identity Provider (IdP) Federation Types
 *
 * Types for OIDC/SAML federation with external identity providers.
 */
/**
 * Supported IdP types
 */
export var IdPType;
(function (IdPType) {
    IdPType["OIDC"] = "oidc";
    IdPType["SAML"] = "saml";
})(IdPType || (IdPType = {}));
/**
 * Supported IdP providers
 */
export var IdPProvider;
(function (IdPProvider) {
    IdPProvider["AUTH0"] = "auth0";
    IdPProvider["OKTA"] = "okta";
    IdPProvider["MICROSOFT_ENTRA"] = "microsoft_entra";
    IdPProvider["GOOGLE"] = "google";
    IdPProvider["CUSTOM"] = "custom";
})(IdPProvider || (IdPProvider = {}));
/**
 * IdP error codes
 */
export var IdPErrorCode;
(function (IdPErrorCode) {
    IdPErrorCode["INVALID_CONFIGURATION"] = "invalid_configuration";
    IdPErrorCode["IDP_NOT_FOUND"] = "idp_not_found";
    IdPErrorCode["IDP_DISABLED"] = "idp_disabled";
    IdPErrorCode["DISCOVERY_FAILED"] = "discovery_failed";
    IdPErrorCode["TOKEN_EXCHANGE_FAILED"] = "token_exchange_failed";
    IdPErrorCode["USERINFO_FAILED"] = "userinfo_failed";
    IdPErrorCode["INVALID_TOKEN"] = "invalid_token";
    IdPErrorCode["PROVISIONING_FAILED"] = "provisioning_failed";
    IdPErrorCode["ATTRIBUTE_MAPPING_FAILED"] = "attribute_mapping_failed";
    IdPErrorCode["ROLE_MAPPING_FAILED"] = "role_mapping_failed";
    IdPErrorCode["SAML_VALIDATION_FAILED"] = "saml_validation_failed";
    IdPErrorCode["SAML_PARSING_FAILED"] = "saml_parsing_failed";
})(IdPErrorCode || (IdPErrorCode = {}));
/**
 * IdP error
 */
export class IdPError extends Error {
    code;
    details;
    constructor(code, message, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'IdPError';
    }
}
