import { RiskAssessment } from '../../types/risk';
import { AuditLogEntry } from '../../types/audit';
import { KVNamespace } from '@cloudflare/workers-types';
/**
 * Service for assessing the risk of events.
 */
export declare class RiskService {
    private static instance;
    private kv;
    private constructor();
    static getInstance(kv?: KVNamespace): RiskService;
    /**
     * Reports a failed login attempt for a given IP address.
     *
     * @param ipAddress The IP address that had a failed login.
     * @returns A promise that resolves to the number of failed attempts for that IP.
     */
    reportFailedLogin(ipAddress: string): Promise<number>;
    assessRisk(logEntry: AuditLogEntry): Promise<RiskAssessment>;
    /**
     * Determines the risk level based on a numerical score.
     *
     * @param score The risk score.
     * @returns The calculated risk level.
     */
    private getRiskLevel;
    /**
     * Checks if an IP address is suspicious.
     * In a real implementation, this would check against a threat intelligence feed.
     *
     * @param ipAddress The IP address to check.
     * @returns True if the IP is suspicious, false otherwise.
     */
    private isSuspiciousIp;
    /**
     * Checks if a user agent is unusual.
     * In a real implementation, this would involve more sophisticated checks.
     *
     * @param userAgent The user agent string to check.
     * @returns True if the user agent is unusual, false otherwise.
     */
    private isUnusualUserAgent;
}
