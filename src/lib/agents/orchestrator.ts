import { Transaction, OrchestratorResult } from "@/types";
import { analyzeTransaction } from "../risk/transaction-intelligence";
import { analyzeRecipient } from "../risk/recipient-intelligence";
import { detectUrgency } from "../risk/urgency-detector";
import { analyzeScamPatterns } from "../risk/scam-pattern-detector";
import { analyzeBehaviour } from "../risk/behaviour-analyzer";
import { calculateDeterministicRisk } from "../risk/risk-engine";
import { evaluateSafetyPolicy } from "../risk/safety-policy";

export async function orchestrateAnalysis(transaction: Partial<Transaction>): Promise<OrchestratorResult> {
  // 1. Transaction Intelligence
  const txAnalysis = analyzeTransaction(transaction);

  // 2. Recipient Intelligence
  const recipientAnalysis = analyzeRecipient(transaction.recipientId || "");

  // 3. Urgency Detection
  const urgencyAnalysis = detectUrgency(transaction.context, transaction.purpose);

  // 4. Scam Pattern Detection
  const scamAnalysis = analyzeScamPatterns(txAnalysis, recipientAnalysis, urgencyAnalysis, transaction.purpose || "", transaction.context || "");

  // 5. Behaviour Analysis
  const behaviourAnalysis = analyzeBehaviour(txAnalysis);

  // 6. Deterministic Risk Engine
  const deterministicRisk = calculateDeterministicRisk(
    txAnalysis,
    recipientAnalysis,
    urgencyAnalysis,
    scamAnalysis,
    behaviourAnalysis
  );

  // 7. Contextual AI Assessment (Phase 5)
  let aiAssessment;
  try {
    const { runContextualAssessment } = await import("../ai/gemini");
    aiAssessment = await runContextualAssessment(
      {
        transactionAnalysis: txAnalysis,
        recipientAnalysis,
        urgencyAnalysis,
        scamAnalysis,
        behaviourAnalysis,
        deterministicRisk: {
          ...deterministicRisk,
          recommendedAction: "APPROVE", // placeholder
          explanation: ""
        }
      },
      transaction.purpose || "",
      transaction.context || "",
      transaction.amount || 0
    );
  } catch (err) {
    console.error("AI assessment failed, continuing with deterministic fallback.", err);
  }

  // 8. Safety Policy Engine
  const finalDecision = evaluateSafetyPolicy(
    deterministicRisk.riskLevel,
    aiAssessment ? aiAssessment.riskLevel : undefined
  );

  return {
    transactionAnalysis: txAnalysis,
    recipientAnalysis,
    urgencyAnalysis,
    scamAnalysis,
    behaviourAnalysis,
    deterministicRisk: {
      ...deterministicRisk,
      recommendedAction: finalDecision, // Set correctly based on pure deterministic
      explanation: "Analysis completed. Deterministic rules applied."
    },
    aiAssessment: aiAssessment || undefined,
    finalDecision
  };
}
