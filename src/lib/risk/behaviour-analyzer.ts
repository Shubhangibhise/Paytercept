import { BehaviourAnalysis, TransactionAnalysis } from "@/types";

export function analyzeBehaviour(
  txAnalysis: TransactionAnalysis
): BehaviourAnalysis {
  
  const anomalies: string[] = [];

  if (txAnalysis.unusualAmount) {
    anomalies.push("Transaction amount significantly deviates from historical baseline.");
  }
  
  if (txAnalysis.unusualTime) {
    anomalies.push("Transaction occurs outside of the user's normal active hours.");
  }

  const anomalyDetected = anomalies.length > 0;

  return {
    anomalyDetected,
    evidence: anomalyDetected ? anomalies.join(" ") : "Transaction matches normal behaviour baseline."
  };
}
