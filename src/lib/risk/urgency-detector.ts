import { UrgencyAnalysis } from "@/types";

const URGENCY_TERMS = [
  "urgent",
  "immediately",
  "act now",
  "send now",
  "account blocked",
  "account suspended",
  "kyc expires",
  "verify immediately",
  "last warning",
  "within minutes",
  "don't delay",
  "suspension",
  "blocked today"
];

export function detectUrgency(context: string = "", purpose: string = ""): UrgencyAnalysis {
  const textToAnalyze = `${context} ${purpose}`.toLowerCase();
  
  const matchedTerms = URGENCY_TERMS.filter(term => textToAnalyze.includes(term));
  
  const detected = matchedTerms.length > 0;
  let severity: "LOW" | "MEDIUM" | "HIGH" = "LOW";
  
  if (detected) {
    severity = matchedTerms.length > 1 ? "HIGH" : "MEDIUM";
    
    // Check for high-severity threat terms
    const threatTerms = ["blocked", "suspended", "last warning"];
    if (threatTerms.some(term => textToAnalyze.includes(term))) {
      severity = "HIGH";
    }
  }

  return {
    detected,
    matchedTerms,
    severity,
    evidence: detected ? `Detected urgency keywords: ${matchedTerms.join(", ")}` : "No urgency keywords detected."
  };
}
