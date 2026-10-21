import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { reason, approver } = body;

    const tx = await db.getTransaction(id);
    if (!tx) {
      return NextResponse.json({ success: false, error: "Transaction not found" }, { status: 404 });
    }

    const updated = await db.blockTransaction(id, {
      reason,
      approver: approver || "Security Admin",
    });

    return NextResponse.json({ success: true, transaction: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to block transaction" }, { status: 500 });
  }
}
