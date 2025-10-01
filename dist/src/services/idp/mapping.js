/**
 * Attribute Mapping and Role Synchronization Service
 *
 * Maps IdP attributes to local user attributes and synchronizes roles.
 */
import { IdPError, IdPErrorCode, } from '../../types/idp';
/**
 * Attribute Mapping Service
 */
export class AttributeMappingService {
    /**
     * Map IdP claims to local user attributes
     */
    mapAttributes(config, claims) {
        try {
            const mapping = config.attribute_mapping;
            const mapped = {
                idp_user_id: this.extractAttribute(claims, mapping.user_id),
                email: this.extractAttribute(claims, mapping.email),
                email_verified: this.extractEmailVerified(claims),
                raw_claims: claims,
            };
            // Optional attributes
            if (mapping.name) {
                mapped.name = this.extractAttribute(claims, mapping.name);
            }
            if (mapping.given_name) {
                mapped.given_name = this.extractAttribute(claims, mapping.given_name);
            }
            if (mapping.family_name) {
                mapped.family_name = this.extractAttribute(claims, mapping.family_name);
            }
            if (mapping.picture) {
                mapped.picture = this.extractAttribute(claims, mapping.picture);
            }
            // Custom attributes
            if (mapping.custom_attributes) {
                for (const [localKey, idpKey] of Object.entries(mapping.custom_attributes)) {
                    const value = this.extractAttribute(claims, idpKey);
                    if (value !== undefined) {
                        if (!mapped.raw_claims) {
                            mapped.raw_claims = {};
                        }
                        mapped.raw_claims[localKey] = value;
                    }
                }
            }
            // Validate required attributes
            if (!mapped.idp_user_id) {
                throw new IdPError(IdPErrorCode.ATTRIBUTE_MAPPING_FAILED, 'Failed to map user_id from IdP claims', { mapping: mapping.user_id, claims });
            }
            if (!mapped.email) {
                throw new IdPError(IdPErrorCode.ATTRIBUTE_MAPPING_FAILED, 'Failed to map email from IdP claims', { mapping: mapping.email, claims });
            }
            return mapped;
        }
        catch (error) {
            if (error instanceof IdPError) {
                throw error;
            }
            throw new IdPError(IdPErrorCode.ATTRIBUTE_MAPPING_FAILED, `Attribute mapping failed: ${error instanceof Error ? error.message : 'Unknown error'}`, { claims });
        }
    }
    /**
     * Extract attribute value from claims using dot notation or array notation
     */
    extractAttribute(claims, path) {
        if (!path) {
            return undefined;
        }
        // Support dot notation (e.g., "user.profile.email")
        const parts = path.split('.');
        let value = claims;
        for (const part of parts) {
            if (value === undefined || value === null) {
                return undefined;
            }
            // Support array indexing (e.g., "emails[0]")
            const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
            if (arrayMatch) {
                const [, key, index] = arrayMatch;
                value = value[key]?.[parseInt(index, 10)];
            }
            else {
                value = value[part];
            }
        }
        return value;
    }
    /**
     * Extract email verification status from claims
     */
    extractEmailVerified(claims) {
        // Common email_verified claim names
        const possibleKeys = ['email_verified', 'emailVerified', 'verified'];
        for (const key of possibleKeys) {
            if (key in claims) {
                const value = claims[key];
                if (typeof value === 'boolean') {
                    return value;
                }
                if (typeof value === 'string') {
                    return value.toLowerCase() === 'true';
                }
            }
        }
        // Default to false if not found
        return false;
    }
    /**
     * Map roles from IdP claims
     */
    mapRoles(config, claims) {
        try {
            const roleMapping = config.role_mapping;
            const idpRoles = this.extractRoles(claims, roleMapping.role_claim);
            const mappedRoles = [];
            for (const idpRole of idpRoles) {
                // Check if there's a mapping for this role
                const mappedRole = roleMapping.mappings[idpRole];
                if (mappedRole) {
                    mappedRoles.push(mappedRole);
                }
                else if (roleMapping.default_role) {
                    // Use default role if no mapping found
                    mappedRoles.push(roleMapping.default_role);
                }
                else {
                    // Pass through unmapped roles
                    mappedRoles.push(idpRole);
                }
            }
            // Remove duplicates
            return [...new Set(mappedRoles)];
        }
        catch (error) {
            throw new IdPError(IdPErrorCode.ROLE_MAPPING_FAILED, `Role mapping failed: ${error instanceof Error ? error.message : 'Unknown error'}`, { claims });
        }
    }
    /**
     * Extract roles from claims
     */
    extractRoles(claims, roleClaim) {
        const value = this.extractAttribute(claims, roleClaim);
        if (!value) {
            return [];
        }
        // Handle both string and array values
        if (Array.isArray(value)) {
            return value.map(String);
        }
        if (typeof value === 'string') {
            // Handle comma-separated roles
            return value.split(',').map((r) => r.trim());
        }
        return [];
    }
    /**
     * Build complete IdP auth response with mapped attributes and roles
     */
    buildAuthResponse(config, claims, userId, isNewUser) {
        const mappedAttributes = this.mapAttributes(config, claims);
        const mappedRoles = this.mapRoles(config, claims);
        return {
            idp_id: config.idp_id,
            tenant_id: config.tenant_id,
            idp_user_id: mappedAttributes.idp_user_id,
            email: mappedAttributes.email,
            email_verified: mappedAttributes.email_verified || false,
            name: mappedAttributes.name,
            given_name: mappedAttributes.given_name,
            family_name: mappedAttributes.family_name,
            picture: mappedAttributes.picture,
            raw_claims: mappedAttributes.raw_claims || claims,
            roles: mappedRoles,
            user_id: userId,
            is_new_user: isNewUser,
            authenticated_at: new Date(),
        };
    }
}
/**
 * Role Synchronization Service
 */
export class RoleSynchronizationService {
    /**
     * Synchronize user roles with IdP roles
     */
    async synchronizeRoles(tenantId, userId, idpRoles, config) {
        // This would interact with your user/role storage
        // For now, return a placeholder implementation
        // In production, this would:
        // 1. Fetch current user roles from database
        // 2. Compare with IdP roles
        // 3. Add new roles
        // 4. Remove roles no longer present in IdP (if enabled)
        // 5. Return the changes
        return {
            added: idpRoles,
            removed: [],
            unchanged: [],
        };
    }
    /**
     * Check if role sync is enabled
     */
    isSyncEnabled(config) {
        return config.provisioning.sync_roles;
    }
    /**
     * Validate roles against allowed roles for tenant
     */
    validateRoles(roles, allowedRoles) {
        return roles.every((role) => allowedRoles.includes(role));
    }
    /**
     * Filter roles based on tenant permissions
     */
    filterRoles(roles, allowedRoles) {
        return roles.filter((role) => allowedRoles.includes(role));
    }
}
