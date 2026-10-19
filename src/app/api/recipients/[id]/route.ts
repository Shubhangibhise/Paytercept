import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const decodedId = decodeURIComponent(id);
    const recipient = await db.getRecipient(decodedId);

    if (!recipient) {
      // Return synthetic default for unknown
      return NextResponse.json({
        success: true,
        recipient: {
          id: `r-${Date.now()}`,
          identifier: decodedId,
          name: "Unknown Recipient",
          verified: false,
          known: false,
          previousTransactionCount: 0,
          riskLevel: "HIGH",
        },
      });
    }

    return NextResponse.json({ success: true, recipient });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch recipient" }, { status: 500 });
  }
}
