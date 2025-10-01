/**
 * Service for assessing the risk of events.
 */
export class RiskService {
    static instance;
    kv;
    constructor(kv) {
        this.kv = kv;
    }
    static getInstance(kv) {
        if (!RiskService.instance) {
            RiskService.instance = new RiskService(kv);
        }
        return RiskService.instance;
    }
    /**
     * Reports a failed login attempt for a given IP address.
     *
     * @param ipAddress The IP address that had a failed login.
     * @returns A promise that resolves to the number of failed attempts for that IP.
     */
    async reportFailedLogin(ipAddress) {
        if (!this.kv) {
            return 0;
        }
        const key = `failed_login:${ipAddress}`;
        const currentFailures = (await this.kv.get(key, { type: 'text' })) || '0';
        const newFailures = parseInt(currentFailures, 10) + 1;
        // Store the new failure count with a 15-minute expiration
        await this.kv.put(key, newFailures.toString(), { expirationTtl: 900 });
        return newFailures;
    }
    async assessRisk(logEntry) {
        let score = 0;
        const factors = [];
        const details = {};
        // Example risk factor: failed login
        if (logEntry.event === 'auth.login.failed' && logEntry.ipAddress) {
            const failureCount = await this.reportFailedLogin(logEntry.ipAddress);
            score += 20;
            factors.push(`Failed login attempt (${failureCount} failures)`);
            details.failedLoginCount = failureCount;
        }
        // Example risk factor: suspicious IP address (e.g., from a known bad IP list)
        if (logEntry.ipAddress && (await this.isSuspiciousIp(logEntry.ipAddress))) {
            score += 50;
            factors.push('Request from suspicious IP address');
            details.ipAddress = logEntry.ipAddress;
        }
        // Example risk factor: unusual user agent
        if (logEntry.userAgent && this.isUnusualUserAgent(logEntry.userAgent)) {
            score += 10;
            factors.push('Request from unusual user agent');
            details.userAgent = logEntry.userAgent;
        }
        const level = this.getRiskLevel(score);
        return {
            level,
            score,
            factors,
            details,
        };
    }
    /**
     * Determines the risk level based on a numerical score.
     *
     * @param score The risk score.
     * @returns The calculated risk level.
     */
    getRiskLevel(score) {
        if (score >= 80) {
            return 'critical';
        }
        if (score >= 60) {
            return 'high';
        }
        if (score >= 30) {
            return 'medium';
        }
        return 'low';
    }
    /**
     * Checks if an IP address is suspicious.
     * In a real implementation, this would check against a threat intelligence feed.
     *
     * @param ipAddress The IP address to check.
     * @returns True if the IP is suspicious, false otherwise.
     */
    async isSuspiciousIp(ipAddress) {
        if (!this.kv) {
            return false;
        }
        const key = `failed_login:${ipAddress}`;
        const currentFailures = (await this.kv.get(key, { type: 'text' })) || '0';
        const failureCount = parseInt(currentFailures, 10);
        // Consider an IP suspicious if it has 5 or more failed logins in the last 15 minutes
        return failureCount >= 5;
    }
    /**
     * Checks if a user agent is unusual.
     * In a real implementation, this would involve more sophisticated checks.
     *
     * @param userAgent The user agent string to check.
     * @returns True if the user agent is unusual, false otherwise.
     */
    isUnusualUserAgent(userAgent) {
        // Example: flag a specific user agent for demonstration
        return userAgent.includes('curl');
    }
}
