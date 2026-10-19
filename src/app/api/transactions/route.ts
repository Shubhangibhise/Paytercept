import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createTransactionSchema } from "@/types";
import { z } from "zod";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate input using Zod
    const validatedData = createTransactionSchema.parse(body);

    // Create the transaction
    const transaction = await db.createTransaction({
      ...validatedData,
      userId: "u1", // Hardcoded mock user ID
    });

    // Create Audit Logs
    await db.createAuditLog(transaction.id, "TRANSACTION_CREATED", { amount: transaction.amount });
    await db.createAuditLog(transaction.id, "ANALYSIS_REQUESTED", { recipientId: transaction.recipientId });

    // Update status to ANALYZING immediately as simulation of analysis starting
    await db.updateTransactionStatus(transaction.id, "ANALYZING");

    return NextResponse.json({ success: true, transactionId: transaction.id, status: "ANALYZING" }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, errors: (error as any).errors }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const transactions = await db.getTransactions();
    return NextResponse.json({ success: true, transactions });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
