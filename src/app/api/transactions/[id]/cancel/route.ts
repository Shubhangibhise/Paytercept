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
      status: "CANCELLED",
      userDecision: "CANCELLED",
    });

    await db.createAuditLog(id, "PAYMENT_CANCELLED", { timestamp: new Date().toISOString() });

    return NextResponse.json({ success: true, transaction: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to cancel transaction" }, { status: 500 });
  }
}
