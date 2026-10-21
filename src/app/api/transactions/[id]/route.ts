import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const transaction = await db.getTransaction(id);

    if (!transaction) {
      return NextResponse.json({ success: false, error: "Transaction not found" }, { status: 404 });
    }

    const auditLogs = await db.getAuditLogs(id);

    return NextResponse.json({ success: true, transaction, auditLogs });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { category, approvalNotes, status } = body;

    const tx = await db.getTransaction(id);
    if (!tx) {
      return NextResponse.json({ success: false, error: "Transaction not found" }, { status: 404 });
    }

    const updates: Record<string, any> = {};
    if (category) {
      await db.updateTransactionCategory(id, category);
      updates.category = category;
    }
    if (approvalNotes !== undefined) updates.approvalNotes = approvalNotes;
    if (status !== undefined) updates.status = status;

    const updated = await db.updateTransaction(id, updates);
    return NextResponse.json({ success: true, transaction: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update transaction" }, { status: 500 });
  }
}
