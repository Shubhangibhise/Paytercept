import { z } from "zod";

export type RiskLevel = "SAFE" | "REVIEW" | "HIGH" | "CRITICAL";

export type Decision = "APPROVE" | "VERIFY" | "PAUSE" | "BLOCK";

export type TransactionStatus = "PENDING" | "ANALYZING" | "APPROVED" | "VERIFY" | "PAUSED" | "BLOCKED" | "CANCELLED" | "COMPLETED";

export interface RiskSignal {
  type: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  impact: number;
  description: string;
}

export interface AgentAssessment {
  riskScore: number;
  riskLevel: RiskLevel;
  recommendedAction: string;
  confidence: number;
  signals: RiskSignal[];
  explanation: string;
  recommendedVerification: string[];
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  recipientId: string;
  recipientName: string;
  purpose: string;
  context?: string;
  timestamp: string;
  riskScore?: number;
  riskLevel?: RiskLevel;
  decision?: Decision;
  status: TransactionStatus;
  signals?: RiskSignal[];
  agentAssessment?: AgentAssessment;
  userDecision?: string;
}

export interface Recipient {
  id: string;
  identifier: string; // e.g., UPI ID
  name: string;
  verified: boolean;
  known: boolean;
  previousTransactionCount: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
}

export interface AuditLog {
  id: string;
  transactionId: string;
  event: string;
  timestamp: string;
  metadata?: any;
}

export interface TransactionAnalysis {
  unusualAmount: boolean;
  unusualTime: boolean;
  amountDeviation: "LOW" | "MEDIUM" | "HIGH";
}

export interface RecipientAnalysis {
  recipientId: string;
  known: boolean;
  verified: boolean;
  previousTransactionCount: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  signals: string[];
}

export interface UrgencyAnalysis {
  detected: boolean;
  matchedTerms: string[];
  severity: "LOW" | "MEDIUM" | "HIGH";
  evidence: string;
}

export interface ScamPatternAnalysis {
  patternType: string;
  detected: boolean;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
  evidence: string;
}

export interface BehaviourAnalysis {
  anomalyDetected: boolean;
  evidence: string;
}

export interface OrchestratorResult {
  transactionAnalysis: TransactionAnalysis;
  recipientAnalysis: RecipientAnalysis;
  urgencyAnalysis: UrgencyAnalysis;
  scamAnalysis: ScamPatternAnalysis;
  behaviourAnalysis: BehaviourAnalysis;
  deterministicRisk: {
    riskScore: number;
    riskLevel: RiskLevel;
    signals: RiskSignal[];
    recommendedAction: Decision;
    explanation: string;
  };
  aiAssessment?: AgentAssessment;
  finalDecision: Decision;
}

// Zod schemas for API validation
export const createTransactionSchema = z.object({
  amount: z.number().positive("Amount must be greater than zero"),
  recipientId: z.string().min(1, "Recipient ID is required"),
  recipientName: z.string().min(1, "Recipient Name is required"),
  purpose: z.string().min(1, "Purpose is required"),
  context: z.string().optional(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
