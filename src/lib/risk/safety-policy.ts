import { Decision, RiskLevel } from "@/types";

export function evaluateSafetyPolicy(deterministicRiskLevel: RiskLevel, aiRiskLevel?: RiskLevel): Decision {
  
  // The deterministic policy is the baseline.
  let baselineDecision: Decision = "APPROVE";
  
  switch(deterministicRiskLevel) {
    case "SAFE":
      baselineDecision = "APPROVE";
      break;
    case "REVIEW":
      baselineDecision = "VERIFY";
      break;
    case "HIGH":
      baselineDecision = "PAUSE";
      break;
    case "CRITICAL":
      baselineDecision = "BLOCK";
      break;
  }

  // If AI is present, it can INCREASE the safety measure, but NEVER DECREASE a CRITICAL or HIGH risk safely without human loop.
  // Actually, per instructions: "The LLM cannot override this policy" and "Do not allow Gemini to downgrade a CRITICAL deterministic risk into APPROVE."
  
  if (aiRiskLevel) {
    // Determine numerical severity
    const severity = { "SAFE": 0, "REVIEW": 1, "HIGH": 2, "CRITICAL": 3 };
    const detSev = severity[deterministicRiskLevel];
    const aiSev = severity[aiRiskLevel];

    // If AI detects higher risk, we trust it to escalate the protection
    if (aiSev > detSev) {
       switch(aiRiskLevel) {
         case "REVIEW": return "VERIFY";
         case "HIGH": return "PAUSE";
         case "CRITICAL": return "BLOCK";
       }
    }
    
    // If AI detects lower risk, we do NOT downgrade HIGH or CRITICAL.
    if (aiSev < detSev && detSev >= 2) {
      return baselineDecision; // Keep the strict block/pause
    }
  }

  return baselineDecision;
}
