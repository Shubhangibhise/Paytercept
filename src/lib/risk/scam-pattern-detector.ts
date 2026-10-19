import { ScamPatternAnalysis, TransactionAnalysis, RecipientAnalysis, UrgencyAnalysis } from "@/types";

export function analyzeScamPatterns(
  txAnalysis: TransactionAnalysis,
  recipientAnalysis: RecipientAnalysis,
  urgencyAnalysis: UrgencyAnalysis,
  purpose: string,
  context: string
): ScamPatternAnalysis {
  
  const text = `${purpose} ${context}`.toLowerCase();
  
  // Pattern 1: KYC/Account Suspension Pressure
  const isKycThreat = text.includes("kyc") || text.includes("account");
  if (isKycThreat && urgencyAnalysis.severity === "HIGH") {
    return {
      patternType: "KYC_ACCOUNT_SUSPENSION",
      detected: true,
      severity: "CRITICAL",
      description: "The message creates urgency by threatening account consequences.",
      evidence: "Account/KYC threat language detected."
    };
  }

  // Pattern 2: Unknown Recipient + Large Amount
  if (!recipientAnalysis.known && txAnalysis.unusualAmount) {
    return {
      patternType: "UNKNOWN_LARGE_AMOUNT",
      detected: true,
      severity: "HIGH",
      description: "Sending a large sum of money to a completely unknown recipient.",
      evidence: "Recipient is unknown and amount is significantly above normal."
    };
  }

  // Pattern 3: General Urgent Payment
  if (urgencyAnalysis.detected && !recipientAnalysis.known) {
    return {
      patternType: "URGENT_UNKNOWN_PAYMENT",
      detected: true,
      severity: "HIGH",
      description: "Pressure applied to pay someone you do not know.",
      evidence: "Urgency language combined with unknown recipient."
    };
  }

  return {
    patternType: "NONE",
    detected: false,
    severity: "LOW",
    description: "No known scam patterns detected.",
    evidence: "Normal parameters."
  };
}
