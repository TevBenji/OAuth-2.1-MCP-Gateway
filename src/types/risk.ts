'''/**
 * Types for risk assessment and threat detection.
 */

// Defines the risk level of an event.
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

// Represents the result of a risk assessment.
export interface RiskAssessment {
  // The overall risk level calculated for the event.
  level: RiskLevel;
  // The numerical score assigned to the event (e.g., 0-100).
  score: number;
  // A list of factors that contributed to the risk assessment.
  factors: string[];
  // Additional details or context about the risk assessment.
  details: Record<string, any>;
}
'''