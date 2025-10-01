/**
 * Just-in-Time (JIT) User Provisioning Service
 *
 * Automatically provisions users from external identity providers.
 */
import { IdPConfig, IdPAuthResponse, FederatedIdentity } from '../../types/idp';
/**
 * User provisioning result
 */
export interface ProvisioningResult {
    user_id: string;
    is_new_user: boolean;
    created_at?: Date;
    updated_at: Date;
    federated_identity: FederatedIdentity;
}
/**
 * JIT Provisioning Service
 */
export declare class JITProvisioningService {
    /**
     * Provision or update user from IdP authentication
     */
    provisionUser(config: IdPConfig, authResponse: Partial<IdPAuthResponse>): Promise<ProvisioningResult>;
    /**
     * Create new user from IdP authentication
     */
    private createUser;
    /**
     * Update existing user from IdP authentication
     */
    private updateUser;
    /**
     * Find federated identity by IdP user ID
     */
    private findFederatedIdentity;
    /**
     * Store federated identity
     */
    private storeFederatedIdentity;
    /**
     * Update federated identity
     */
    private updateFederatedIdentity;
    /**
     * Deactivate user when removed from IdP
     */
    deactivateUser(tenantId: string, userId: string, reason: string): Promise<void>;
    /**
     * Check if user should be deactivated
     */
    checkUserDeactivation(config: IdPConfig, userId: string): Promise<boolean>;
    /**
     * Sync user attributes from IdP
     */
    syncUserAttributes(config: IdPConfig, userId: string, attributes: Record<string, any>): Promise<void>;
    /**
     * Get provisioning statistics
     */
    getProvisioningStats(tenantId: string, idpId: string): Promise<{
        total_users: number;
        new_users_today: number;
        updated_users_today: number;
        failed_provisions_today: number;
    }>;
    /**
     * Validate user eligibility for provisioning
     */
    validateUserEligibility(config: IdPConfig, authResponse: Partial<IdPAuthResponse>): {
        eligible: boolean;
        reason?: string;
    };
    /**
     * Bulk provision users from IdP directory
     */
    bulkProvisionUsers(config: IdPConfig, users: Array<Partial<IdPAuthResponse>>): Promise<{
        successful: number;
        failed: number;
        errors: Array<{
            user: Partial<IdPAuthResponse>;
            error: string;
        }>;
    }>;
}
