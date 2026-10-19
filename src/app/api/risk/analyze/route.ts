import { NextRequest, NextResponse } from "next/server";
import { orchestrateAnalysis } from "@/lib/agents/orchestrator";
import { db } from "@/lib/db";
import { z } from "zod";

const analyzeRequestSchema = z.object({
  transactionId: z.string().min(1, "Transaction ID is required")
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { transactionId } = analyzeRequestSchema.parse(body);

    const transaction = await db.getTransaction(transactionId);
    if (!transaction) {
      return NextResponse.json({ success: false, error: "Transaction not found" }, { status: 404 });
    }

    await db.createAuditLog(transactionId, "TRANSACTION_ANALYZED", { message: "Starting Paytercept orchestration." });

    // Run the orchestrator
    const result = await orchestrateAnalysis(transaction);

    const status = result.finalDecision === "APPROVE" ? "COMPLETED" :
              result.finalDecision === "BLOCK" ? "BLOCKED" :
              result.finalDecision === "PAUSE" ? "PAUSED" : "VERIFY";

    const updatedTx = await db.updateTransaction(transactionId, {
      riskScore: result.deterministicRisk.riskScore,
      riskLevel: result.deterministicRisk.riskLevel,
      decision: result.finalDecision,
      signals: result.deterministicRisk.signals,
      agentAssessment: result.aiAssessment,
      status: status as any
    });

    await db.createAuditLog(transactionId, "RISK_CALCULATED", { score: result.deterministicRisk.riskScore });

    return NextResponse.json({ success: true, result, updatedStatus: status, transaction: updatedTx });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, errors: (error as any).errors }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
