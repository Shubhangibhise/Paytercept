import { 
  RiskLevel, 
  RiskSignal, 
  TransactionAnalysis, 
  RecipientAnalysis, 
  ScamPatternAnalysis, 
  BehaviourAnalysis,
  UrgencyAnalysis
} from "@/types";

export function calculateDeterministicRisk(
  txAnalysis: TransactionAnalysis,
  recipientAnalysis: RecipientAnalysis,
  urgencyAnalysis: UrgencyAnalysis,
  scamAnalysis: ScamPatternAnalysis,
  behaviourAnalysis: BehaviourAnalysis
): { riskScore: number, riskLevel: RiskLevel, signals: RiskSignal[] } {
  
  let score = 0;
  const signals: RiskSignal[] = [];

  const addSignal = (type: string, impact: number, severity: RiskSignal['severity'], description: string) => {
    score += impact;
    signals.push({ type, impact, severity, description });
  };

  if (!recipientAnalysis.known) {
    addSignal("NEW_RECIPIENT", 15, "MEDIUM", "Recipient has no prior transaction history with user.");
  }

  if (!recipientAnalysis.verified) {
    addSignal("UNVERIFIED_RECIPIENT", 20, "HIGH", "Recipient identity has not been verified by authoritative sources.");
  }

  if (txAnalysis.unusualAmount) {
    addSignal("UNUSUAL_AMOUNT", 20, "HIGH", "Transaction amount is significantly above the user's normal range.");
  }

  if (txAnalysis.unusualTime) {
    addSignal("UNUSUAL_TIME", 10, "MEDIUM", "Transaction occurs outside normal active hours.");
  }

  if (urgencyAnalysis.detected) {
    addSignal("URGENCY_LANGUAGE", 15, urgencyAnalysis.severity, urgencyAnalysis.evidence);
  }

  if (scamAnalysis.detected) {
    const impact = scamAnalysis.severity === "CRITICAL" ? 30 : 20;
    addSignal("KNOWN_SCAM_PATTERN", impact, scamAnalysis.severity, scamAnalysis.description);
  }

  if (behaviourAnalysis.anomalyDetected && !txAnalysis.unusualAmount && !txAnalysis.unusualTime) {
    // If anomalies were already captured by amount/time, don't double count, else add base anomaly
    addSignal("BEHAVIOUR_ANOMALY", 10, "MEDIUM", behaviourAnalysis.evidence);
  } else if (behaviourAnalysis.anomalyDetected && (txAnalysis.unusualAmount || txAnalysis.unusualTime)) {
    // We already counted amount/time, but we can add a generic anomaly flag without points or low points
    addSignal("BEHAVIOUR_ANOMALY", 5, "LOW", behaviourAnalysis.evidence);
  }

  // Normalize score
  score = Math.max(0, Math.min(100, score));

  let riskLevel: RiskLevel = "SAFE";
  if (score > 75) {
    riskLevel = "CRITICAL";
  } else if (score > 55) {
    riskLevel = "HIGH";
  } else if (score > 30) {
    riskLevel = "REVIEW";
  }

  return { riskScore: score, riskLevel, signals };
}
