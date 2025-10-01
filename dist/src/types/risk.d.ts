/**
 * Types for risk assessment and threat detection.
 */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export interface RiskAssessment {
    level: RiskLevel;
    score: number;
    factors: string[];
    details: Record<string, any>;
}
