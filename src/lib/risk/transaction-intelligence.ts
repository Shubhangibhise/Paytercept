import { Transaction, TransactionAnalysis } from "@/types";

const TYPICAL_MAX_AMOUNT = 10000;
const TYPICAL_MIN_AMOUNT = 100;
const NORMAL_START_HOUR = 7;
const NORMAL_END_HOUR = 22;

export function analyzeTransaction(transaction: Partial<Transaction>): TransactionAnalysis {
  const amount = transaction.amount || 0;
  
  // Calculate amount deviation
  let amountDeviation: "LOW" | "MEDIUM" | "HIGH" = "LOW";
  let unusualAmount = false;
  
  if (amount > TYPICAL_MAX_AMOUNT * 5) {
    amountDeviation = "HIGH";
    unusualAmount = true;
  } else if (amount > TYPICAL_MAX_AMOUNT) {
    amountDeviation = "MEDIUM";
    unusualAmount = true;
  } else if (amount < TYPICAL_MIN_AMOUNT) {
    amountDeviation = "LOW";
    unusualAmount = false;
  }

  // Calculate time deviation
  let unusualTime = false;
  if (transaction.timestamp) {
    const date = new Date(transaction.timestamp);
    const hour = date.getHours();
    if (hour < NORMAL_START_HOUR || hour > NORMAL_END_HOUR) {
      unusualTime = true;
    }
  }

  return {
    unusualAmount,
    unusualTime,
    amountDeviation
  };
}
