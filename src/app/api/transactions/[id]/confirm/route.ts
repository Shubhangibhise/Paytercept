import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tx = await db.getTransaction(id);

    if (!tx) {
      return NextResponse.json({ success: false, error: "Transaction not found" }, { status: 404 });
    }

    const updated = await db.updateTransaction(id, {
      status: "COMPLETED",
      userDecision: "CONFIRMED",
    });

    await db.createAuditLog(id, "USER_CONFIRMED", { timestamp: new Date().toISOString() });
    await db.createAuditLog(id, "SIMULATED_PAYMENT_COMPLETED", { amount: tx.amount, recipient: tx.recipientId });

    return NextResponse.json({ success: true, transaction: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to confirm transaction" }, { status: 500 });
  }
}
