import { Recipient, RecipientAnalysis } from "@/types";
import { MOCK_RECIPIENTS } from "@/lib/mock-data";

export function getRecipientData(identifier: string): Recipient {
  // Mock fetching from DB
  const existing = MOCK_RECIPIENTS[identifier];
  if (existing) return existing;

  // If not found, it's a completely new, unverified recipient
  return {
    id: `r-${Date.now()}`,
    identifier,
    name: "Unknown",
    verified: false,
    known: false,
    previousTransactionCount: 0,
    riskLevel: "HIGH"
  };
}

export function analyzeRecipient(identifier: string): RecipientAnalysis {
  const recipient = getRecipientData(identifier);
  
  const signals: string[] = [];
  if (!recipient.known) {
    signals.push("NEW_RECIPIENT");
  }
  if (!recipient.verified) {
    signals.push("UNVERIFIED_RECIPIENT");
  }

  return {
    recipientId: recipient.identifier,
    known: recipient.known,
    verified: recipient.verified,
    previousTransactionCount: recipient.previousTransactionCount,
    riskLevel: recipient.riskLevel,
    signals
  };
}
