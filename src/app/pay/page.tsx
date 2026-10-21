"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ShieldX,
  XCircle,
  HelpCircle,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

function PayFormContent() {
  const searchParams = useSearchParams();
  const demoParam = searchParams.get("demo");

  const [amount, setAmount] = useState("");
  const [recipientId, setRecipientId] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [context, setContext] = useState("");
  const [category, setCategory] = useState("PERSONAL");

  const [step, setStep] = useState<"FORM" | "ANALYZING" | "RESULT" | "CONFIRMED" | "CANCELLED">(
    "FORM"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWhy, setShowWhy] = useState(false);

  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // Pre-fill demo scenarios if query param is set
  useEffect(() => {
    if (demoParam === "normal") {
      setAmount("750");
      setRecipientId("known_verified@upi");
      setRecipientName("Amit Sharma");
      setPurpose("Dinner with team");
      setContext("");
      setCategory("PERSONAL");
    } else if (demoParam === "new") {
      setAmount("2500");
      setRecipientId("new_user@upi");
      setRecipientName("Rahul Kumar");
      setPurpose("Book purchase");
      setContext("");
      setCategory("VENDOR");
    } else if (demoParam === "suspicious") {
      setAmount("25000");
      setRecipientId("vendor_rush@upi");
      setRecipientName("Quick Delivery");
      setPurpose("Order Deposit");
      setContext("Please send urgently, discount offer expires in 10 minutes");
      setCategory("VENDOR");
    } else if (demoParam === "attack") {
      setAmount("95000");
      setRecipientId("kyc_support@upi");
      setRecipientName("Security Desk");
      setPurpose("KYC Update");
      setContext("Your account will be blocked today. Send the money immediately for KYC verification.");
      setCategory("SUSPICIOUS");
    }
  }, [demoParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        amount: parseFloat(amount),
        recipientId,
        recipientName,
        purpose,
        context: context || undefined,
        category: category || undefined,
      };

      // 1. Create transaction in DB
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.errors && data.errors.length > 0) throw new Error(data.errors[0].message);
        throw new Error(data.error || "Failed to submit transaction");
      }

      setTransactionId(data.transactionId);
      setStep("ANALYZING");

      // 2. Run analysis
      startAnalysis(data.transactionId);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      setIsSubmitting(false);
    }
  };

  const startAnalysis = async (id: string) => {
    try {
      // Allow visual animation of security checks
      await new Promise((r) => setTimeout(r, 1800));

      const res = await fetch("/api/risk/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: id }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      setAnalysisResult(data.result);
      await new Promise((r) => setTimeout(r, 1200));
      setStep("RESULT");
    } catch (err: any) {
      setError("Analysis failed. Please try again.");
      setStep("FORM");
      setIsSubmitting(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!transactionId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/transactions/${transactionId}/confirm`, {
        method: "POST",
      });
      if (res.ok) {
        setStep("CONFIRMED");
      } else {
        throw new Error("Confirmation failed");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOverrideApprove = async () => {
    if (!transactionId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/transactions/${transactionId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: "Approved via manual override on Pay screen",
          approver: "User (Direct Authorization)",
          verifiedWith2FA: true,
        }),
      });
      if (res.ok) {
        setStep("CONFIRMED");
      } else {
        throw new Error("Approval failed");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelPayment = async () => {
    if (!transactionId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/transactions/${transactionId}/cancel`, {
        method: "POST",
      });
      if (res.ok) {
        setStep("CANCELLED");
      } else {
        throw new Error("Cancellation failed");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  // STEP: Analyzing
  if (step === "ANALYZING") {
    return (
      <div className="max-w-md mx-auto mt-8">
        <div className="bg-card border border-border rounded-2xl shadow-sm p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-1">PAYTERCEPT SECURITY ANALYSIS</h2>
            <p className="text-xs text-muted-foreground">Contextual security assessment in progress</p>
          </div>

          <div className="space-y-4 pt-4">
            <AnalysisStep delay={0.2} text="Transaction baseline checked" />
            <AnalysisStep delay={0.6} text="Recipient intelligence verified" />
            <AnalysisStep delay={1.0} text="Scam pattern heuristics evaluated" />
            <AnalysisStep delay={1.4} text="Deterministic risk score calculated" />
            <AnalysisStep delay={1.8} text="Gemini contextual reasoning applied" />
            <AnalysisStep delay={2.2} text="Deterministic safety policy enforced" />
          </div>
        </div>
      </div>
    );
  }

  // STEP: Final Confirmed (Approved payment completed)
  if (step === "CONFIRMED") {
    return (
      <div className="max-w-md mx-auto mt-8">
        <div className="bg-card border border-border rounded-2xl shadow-sm p-8 text-center space-y-5">
          <div className="inline-flex items-center justify-center p-4 bg-safe/10 text-safe rounded-full">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-bold">Simulated Payment Completed</h2>
          <p className="text-sm text-muted-foreground">
            Transaction was safely verified, approved by Paytercept, and confirmed by user.
          </p>
          <div className="p-3 bg-secondary/30 rounded-xl border border-border text-xs text-muted-foreground font-mono">
            Transaction ID: {transactionId}
          </div>
          <div className="pt-4 flex flex-col gap-2">
            <Link
              href="/history"
              className="w-full py-3 px-4 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors text-sm"
            >
              View in Security History
            </Link>
            <Link
              href="/"
              className="w-full py-2.5 px-4 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // STEP: Cancelled
  if (step === "CANCELLED") {
    return (
      <div className="max-w-md mx-auto mt-8">
        <div className="bg-card border border-border rounded-2xl shadow-sm p-8 text-center space-y-5">
          <div className="inline-flex items-center justify-center p-4 bg-destructive/10 text-destructive rounded-full">
            <XCircle className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-bold">Payment Cancelled</h2>
          <p className="text-sm text-muted-foreground">
            The transaction was stopped. No funds were transferred.
          </p>
          <div className="p-3 bg-secondary/30 rounded-xl border border-border text-xs text-muted-foreground font-mono">
            Audit status: PAYMENT_CANCELLED
          </div>
          <div className="pt-4 flex flex-col gap-2">
            <Link
              href="/history"
              className="w-full py-3 px-4 bg-secondary text-secondary-foreground font-semibold rounded-lg hover:bg-secondary/90 transition-colors text-sm"
            >
              Check Audit Log
            </Link>
            <Link
              href="/"
              className="w-full py-2.5 px-4 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // STEP: Risk Result
  if (step === "RESULT" && analysisResult) {
    const { deterministicRisk, finalDecision, recipientAnalysis, aiAssessment } = analysisResult;

    return (
      <div className="max-w-md mx-auto mt-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden"
        >
          {/* Header Banner */}
          <div
            className={`p-6 text-center border-b border-border ${
              finalDecision === "APPROVE"
                ? "bg-safe/10 border-safe/20"
                : finalDecision === "BLOCK"
                ? "bg-destructive/10 border-destructive/20"
                : "bg-warning/10 border-warning/20"
            }`}
          >
            <div className="inline-flex items-center justify-center p-2 rounded-full mb-2">
              {finalDecision === "APPROVE" ? (
                <ShieldCheck className="h-8 w-8 text-safe" />
              ) : finalDecision === "BLOCK" ? (
                <ShieldX className="h-8 w-8 text-destructive" />
              ) : (
                <AlertTriangle className="h-8 w-8 text-warning" />
              )}
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              {finalDecision === "APPROVE"
                ? "PAYMENT APPROVED"
                : finalDecision === "BLOCK"
                ? "PAYMENT BLOCKED"
                : finalDecision === "PAUSE"
                ? "PAYMENT PAUSED"
                : "VERIFICATION REQUIRED"}
            </h2>
            <p className="text-xs font-semibold mt-1 uppercase tracking-wider text-muted-foreground">
              {finalDecision === "BLOCK"
                ? "MONEY HAS NOT BEEN TRANSFERRED"
                : finalDecision === "APPROVE"
                ? "Transaction verified within safe limits"
                : "Additional verification recommended"}
            </p>
          </div>

          <div className="p-6 space-y-6 text-sm">
            {/* Risk Score Pill */}
            <div className="flex justify-between items-center bg-secondary/40 p-4 rounded-xl border border-border">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Risk Score</p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl font-bold">{deterministicRisk.riskScore}</span>
                  <span className="text-xs text-muted-foreground font-semibold">/ 100</span>
                </div>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider ${
                  deterministicRisk.riskLevel === "SAFE"
                    ? "bg-safe/20 text-safe border border-safe/30"
                    : deterministicRisk.riskLevel === "REVIEW"
                    ? "bg-warning/20 text-warning border border-warning/30"
                    : "bg-destructive/20 text-destructive border border-destructive/30"
                }`}
              >
                {deterministicRisk.riskLevel}
              </div>
            </div>

            {/* Recipient Intelligence */}
            <div className="bg-secondary/20 p-4 rounded-xl border border-border space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Recipient Intelligence
              </h3>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Recipient ID:</span>
                  <span className="font-mono font-medium">{recipientAnalysis.recipientId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Verification:</span>
                  <span
                    className={`font-semibold ${
                      recipientAnalysis.verified ? "text-safe" : "text-warning"
                    }`}
                  >
                    {recipientAnalysis.verified ? "VERIFIED" : "UNVERIFIED"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Relationship:</span>
                  <span className="font-medium">
                    {recipientAnalysis.known ? "KNOWN RECIPIENT" : "NEW RECIPIENT"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Past Transactions:</span>
                  <span className="font-medium">{recipientAnalysis.previousTransactionCount}</span>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground italic pt-1">
                Demo verification baseline data
              </p>
            </div>

            {/* Signals Detected / Explainability */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Signals Detected
                </h3>
                <button
                  type="button"
                  onClick={() => setShowWhy(!showWhy)}
                  className="text-xs text-info hover:underline flex items-center gap-1 font-medium"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  {showWhy ? "Hide why" : "View why"}
                </button>
              </div>

              {deterministicRisk.signals.length === 0 ? (
                <div className="flex items-center gap-2 p-3 bg-secondary/20 rounded-lg border border-border text-xs text-safe font-medium">
                  <CheckCircle2 className="h-4 w-4" /> Recipient verified &bull; Normal amount &bull; No scam patterns
                </div>
              ) : (
                <div className="space-y-2">
                  {deterministicRisk.signals.map((sig: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-secondary/30 p-3 rounded-lg border border-border flex items-start justify-between gap-3 text-xs"
                    >
                      <div>
                        <p className="font-semibold text-foreground">
                          {sig.type.replace(/_/g, " ")}
                        </p>
                        <p className="text-muted-foreground mt-0.5">{sig.description}</p>
                      </div>
                      <span className="font-mono font-bold text-destructive">+{sig.impact}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* "Why did Paytercept stop this?" Detailed Explainability Panel */}
            {showWhy && (
              <div className="p-4 rounded-xl bg-secondary/40 border border-border space-y-2 text-xs">
                <p className="font-semibold text-foreground">Explainable Guardian Breakdown</p>
                <p className="text-muted-foreground leading-relaxed">
                  Paytercept evaluated transaction amount, recipient trust level, urgency vocabulary, and
                  social-engineering patterns through our deterministic security policy engine.
                </p>
              </div>
            )}

            {/* Gemini Contextual Assessment */}
            {aiAssessment && (
              <div className="bg-info/5 p-4 rounded-xl border border-info/20 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-info uppercase tracking-wider">
                    Gemini Contextual Reasoning
                  </h3>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    Confidence: {(aiAssessment.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-xs text-foreground leading-relaxed">
                  {aiAssessment.explanation}
                </p>
                {aiAssessment.recommendedVerification?.length > 0 && (
                  <div className="pt-2 border-t border-info/10 text-xs">
                    <span className="font-semibold text-info block mb-1">
                      Recommended Human Checks:
                    </span>
                    <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                      {aiAssessment.recommendedVerification.map((rec: string, idx: number) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="pt-4 border-t border-border flex flex-col gap-2.5">
              {finalDecision === "APPROVE" ? (
                <button
                  onClick={handleConfirmPayment}
                  disabled={actionLoading}
                  className="w-full py-3 px-4 bg-primary text-primary-foreground text-center font-semibold rounded-lg hover:bg-primary/90 transition-colors text-sm flex items-center justify-center gap-2"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  CONFIRM SIMULATED PAYMENT
                </button>
              ) : finalDecision === "BLOCK" ? (
                <>
                  <Link
                    href="/history"
                    className="w-full py-3 px-4 bg-secondary text-secondary-foreground text-center font-semibold rounded-lg hover:bg-secondary/90 transition-colors text-sm"
                  >
                    INSPECT IN SECURITY HISTORY
                  </Link>
                  <button
                    onClick={handleCancelPayment}
                    disabled={actionLoading}
                    className="w-full py-3 px-4 bg-destructive/10 text-destructive text-center font-semibold rounded-lg hover:bg-destructive/20 transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    DISMISS / CANCEL PAYMENT
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleOverrideApprove}
                    disabled={actionLoading}
                    className="w-full py-3 px-4 bg-safe text-white text-center font-semibold rounded-lg hover:bg-safe/90 transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    APPROVE &amp; AUTHORIZE PAYMENT (OVERRIDE)
                  </button>
                  <Link
                    href="/approvals"
                    className="w-full py-2.5 px-4 bg-warning/10 text-warning border border-warning/30 text-center font-semibold rounded-lg hover:bg-warning/20 transition-colors text-xs"
                  >
                    SEND TO APPROVALS QUEUE
                  </Link>
                  <button
                    onClick={handleCancelPayment}
                    disabled={actionLoading}
                    className="w-full py-2 px-4 bg-destructive/10 text-destructive text-center font-semibold rounded-lg hover:bg-destructive/20 transition-colors text-xs flex items-center justify-center gap-2"
                  >
                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    CANCEL PAYMENT (RECOMMENDED)
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // STEP: FORM
  return (
    <div className="max-w-md mx-auto mt-8">
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-secondary/50 p-6 border-b border-border text-center">
          <div className="inline-flex items-center justify-center p-3 bg-info/10 text-info rounded-full mb-4">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold mb-1">Simulated Payment Environment</h1>
          <p className="text-xs text-muted-foreground">
            Test real-time scam interception. All operations are simulated.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="amount" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Amount (₹)
            </label>
            <input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 750 or 95000"
              className="w-full bg-input border border-border rounded-lg px-4 py-3 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-info transition-shadow"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="recipientId" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Recipient UPI / Account
            </label>
            <input
              id="recipientId"
              type="text"
              value={recipientId}
              onChange={(e) => setRecipientId(e.target.value)}
              placeholder="e.g. known_verified@upi or kyc_desk@upi"
              className="w-full bg-input border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-info transition-shadow font-mono"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="recipientName" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Recipient Name
            </label>
            <input
              id="recipientName"
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="e.g. Amit Sharma or Security Desk"
              className="w-full bg-input border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-info transition-shadow"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="purpose" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Purpose
            </label>
            <input
              id="purpose"
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Dinner or KYC Verification"
              className="w-full bg-input border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-info transition-shadow"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="category" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Payment Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-input border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-info transition-shadow text-foreground"
              disabled={isSubmitting}
            >
              <option value="PERSONAL">Personal Transfer</option>
              <option value="VENDOR">Vendor &amp; Bills</option>
              <option value="UTILITIES">Utilities</option>
              <option value="PAYROLL">Payroll / Salary</option>
              <option value="EMERGENCY">Emergency</option>
              <option value="SUSPICIOUS">Suspicious Pretext</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="context" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Optional Message / Pretext Context
            </label>
            <textarea
              id="context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="e.g. 'Your account will be blocked today. Send immediately for KYC.'"
              className="w-full bg-input border border-border rounded-lg px-4 py-2 text-xs min-h-[70px] focus:outline-none focus:ring-2 focus:ring-info transition-shadow resize-none"
              disabled={isSubmitting}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 mt-4 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> RUNNING GUARDIAN ANALYSIS...
              </>
            ) : (
              <>
                CONTINUE TO ANALYSIS <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

function AnalysisStep({ delay, text }: { delay: number; text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.35 }}
      className="flex items-center gap-3 text-xs font-medium"
    >
      <CheckCircle2 className="h-4 w-4 text-safe shrink-0" />
      <span>{text}</span>
    </motion.div>
  );
}

export default function PayScreen() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-sm text-muted-foreground">Loading payment portal...</div>}>
      <PayFormContent />
    </Suspense>
  );
}
