"use client";

import { useEffect, useState, useMemo } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  ShieldX,
  RefreshCw,
  X,
  Clock,
  UserCheck,
  Brain,
  FileText,
  Tag,
  Check,
  Lock,
} from "lucide-react";
import { Transaction, AuditLog } from "@/types";

export default function SecurityHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<string>("All");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Approval controls in Dossier
  const [approvalNotes, setApprovalNotes] = useState("");
  const [use2FA, setUse2FA] = useState(false);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/transactions");
      if (res.ok) {
        const data = await res.json();
        if (data.transactions) setTransactions(data.transactions);
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const openDetails = async (tx: Transaction) => {
    setSelectedTx(tx);
    setLoadingDetails(true);
    setApprovalNotes(tx.approvalNotes || "");
    setUse2FA(!!tx.verifiedWith2FA);
    try {
      const res = await fetch(`/api/transactions/${tx.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.auditLogs) setAuditLogs(data.auditLogs);
      }
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleApproveInDossier = async () => {
    if (!selectedTx) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/transactions/${selectedTx.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: approvalNotes || "Approved from Risk Dossier Panel",
          approver: "Security Officer / You",
          verifiedWith2FA: use2FA,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.transaction) setSelectedTx(data.transaction);
        await fetchTransactions();
        // Refresh audit logs
        const logRes = await fetch(`/api/transactions/${selectedTx.id}`);
        if (logRes.ok) {
          const lData = await logRes.json();
          if (lData.auditLogs) setAuditLogs(lData.auditLogs);
        }
      }
    } catch (err) {
      console.error("Approval failed:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeclineInDossier = async () => {
    if (!selectedTx) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/transactions/${selectedTx.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: approvalNotes || "Declined from Risk Dossier Panel",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.transaction) setSelectedTx(data.transaction);
        await fetchTransactions();
      }
    } catch (err) {
      console.error("Decline failed:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBlockInDossier = async () => {
    if (!selectedTx) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/transactions/${selectedTx.id}/block`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: "Flagged and blocked from Risk Dossier",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.transaction) setSelectedTx(data.transaction);
        await fetchTransactions();
      }
    } catch (err) {
      console.error("Block failed:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCategoryChange = async (cat: string) => {
    if (!selectedTx) return;
    try {
      const res = await fetch(`/api/transactions/${selectedTx.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: cat }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.transaction) setSelectedTx(data.transaction);
        await fetchTransactions();
      }
    } catch (err) {
      console.error("Category update failed:", err);
    }
  };

  const isPendingApproval = (tx: Transaction) => {
    return (
      (tx.status === "VERIFY" ||
        tx.status === "PAUSED" ||
        tx.status === "PENDING" ||
        tx.decision === "VERIFY" ||
        tx.decision === "PAUSE") &&
      tx.status !== "COMPLETED" &&
      tx.status !== "BLOCKED" &&
      tx.status !== "CANCELLED"
    );
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Status filter
      if (filter === "Approvals" && !isPendingApproval(tx)) return false;
      if (filter === "Safe" && tx.riskLevel !== "SAFE" && tx.decision !== "APPROVE") return false;
      if (filter === "Review" && tx.riskLevel !== "REVIEW" && tx.decision !== "VERIFY") return false;
      if (filter === "Paused" && tx.riskLevel !== "HIGH" && tx.decision !== "PAUSE" && tx.status !== "PAUSED") return false;
      if (filter === "Blocked" && tx.riskLevel !== "CRITICAL" && tx.decision !== "BLOCK" && tx.status !== "BLOCKED") return false;

      // Category filter
      if (categoryFilter !== "ALL" && (tx.category || "PERSONAL") !== categoryFilter) return false;

      return true;
    });
  }, [transactions, filter, categoryFilter]);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">Security History &amp; Audit Trail</h1>
          <p className="text-muted-foreground text-sm">
            Categorized ledgers, live audit trails, and interactive approval dossiers for every payment.
          </p>
        </div>
        <button
          onClick={fetchTransactions}
          className="self-start sm:self-auto flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-xs font-medium hover:bg-secondary transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        {/* Filters Toolbar */}
        <div className="p-4 border-b border-border bg-secondary/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
            {["All", "Approvals", "Safe", "Review", "Paused", "Blocked"].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-full border transition-all whitespace-nowrap ${
                  filter === tab
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background/80 text-muted-foreground border-border hover:bg-secondary hover:text-foreground"
                }`}
              >
                {tab === "Approvals" ? "⚠️ Needs Approval" : tab}
              </button>
            ))}
          </div>

          {/* Category Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
              <Tag className="h-3 w-3" /> Category:
            </span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs bg-background border border-border rounded-lg px-2.5 py-1 text-foreground focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              <option value="PERSONAL">Personal</option>
              <option value="VENDOR">Vendor &amp; Bills</option>
              <option value="UTILITIES">Utilities</option>
              <option value="PAYROLL">Payroll</option>
              <option value="EMERGENCY">Emergency</option>
              <option value="SUSPICIOUS">Suspicious</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground font-medium">
                <th className="px-5 py-3.5">Time</th>
                <th className="px-5 py-3.5">Recipient</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Amount</th>
                <th className="px-5 py-3.5">Risk Level</th>
                <th className="px-5 py-3.5">Decision</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground text-sm">
                    No transactions match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const needsApproval = isPendingApproval(tx);

                  return (
                    <tr
                      key={tx.id}
                      onClick={() => openDetails(tx)}
                      className="hover:bg-secondary/40 transition-colors cursor-pointer group"
                    >
                      <td className="px-5 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(tx.timestamp).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {tx.recipientName}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">{tx.recipientId}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border border-border bg-secondary/50 text-foreground">
                          <Tag className="h-2.5 w-2.5 text-muted-foreground" />
                          {tx.category || "PERSONAL"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-foreground">
                        ₹{tx.amount.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            tx.riskLevel === "SAFE"
                              ? "bg-safe/10 text-safe border border-safe/20"
                              : tx.riskLevel === "REVIEW"
                              ? "bg-warning/10 text-warning border border-warning/20"
                              : "bg-destructive/10 text-destructive border border-destructive/20"
                          }`}
                        >
                          {tx.riskScore !== undefined ? `${tx.riskScore}/100 ` : ""}
                          {tx.riskLevel || "PENDING"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {tx.status === "COMPLETED" || tx.decision === "APPROVE" ? (
                            <ShieldCheck className="h-4 w-4 text-safe" />
                          ) : tx.status === "BLOCKED" || tx.decision === "BLOCK" ? (
                            <ShieldX className="h-4 w-4 text-destructive" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-warning" />
                          )}
                          <span className="text-xs font-medium capitalize">
                            {needsApproval ? "Needs Approval" : tx.decision || tx.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="text-xs text-info font-medium hover:underline">
                          View Dossier &rarr;
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Details Dossier Modal */}
      {selectedTx && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="p-6 border-b border-border flex items-start justify-between sticky top-0 bg-card/95 backdrop-blur z-10">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                    {selectedTx.id}
                  </span>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      selectedTx.decision === "APPROVE" || selectedTx.status === "COMPLETED"
                        ? "bg-safe/10 text-safe"
                        : selectedTx.decision === "BLOCK" || selectedTx.status === "BLOCKED"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-warning/10 text-warning"
                    }`}
                  >
                    {isPendingApproval(selectedTx)
                      ? "Awaiting Approval"
                      : selectedTx.decision || selectedTx.status}
                  </span>
                  {selectedTx.verifiedWith2FA && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                      <Lock className="h-3 w-3" /> 2FA Verified
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold mt-1">Transaction Risk Dossier</h2>
                <p className="text-xs text-muted-foreground">
                  Processed on {new Date(selectedTx.timestamp).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 text-sm">
              {/* Overview Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-secondary/30 border border-border">
                <div>
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="text-lg font-bold">₹{selectedTx.amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Risk Score</p>
                  <p className="text-lg font-bold">
                    {selectedTx.riskScore !== undefined ? `${selectedTx.riskScore} / 100` : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Category</p>
                  <select
                    value={selectedTx.category || "PERSONAL"}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="text-xs bg-background border border-border rounded px-1.5 py-0.5 mt-1 font-semibold text-primary"
                  >
                    <option value="PERSONAL">Personal</option>
                    <option value="VENDOR">Vendor &amp; Bills</option>
                    <option value="UTILITIES">Utilities</option>
                    <option value="PAYROLL">Payroll</option>
                    <option value="EMERGENCY">Emergency</option>
                    <option value="SUSPICIOUS">Suspicious</option>
                  </select>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Final Status</p>
                  <p className="text-sm font-semibold capitalize mt-1">
                    {selectedTx.status.replace(/_/g, " ").toLowerCase()}
                  </p>
                </div>
              </div>

              {/* ACTION PANEL (For Pending Approvals or overrides) */}
              <div className="p-4 rounded-xl border border-warning/30 bg-warning/5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-warning flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4" /> Approval Actions &amp; Controls
                  </h3>
                  {selectedTx.approvedBy && (
                    <span className="text-xs text-safe font-semibold">
                      Authorized by: {selectedTx.approvedBy}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-xs text-foreground font-medium">
                    Approval / Override Notes:
                  </label>
                  <input
                    type="text"
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    placeholder="Enter notes (e.g. Phone verified, emergency authorization)..."
                    className="w-full text-xs p-2 bg-background border border-border rounded-lg"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={use2FA}
                    onChange={(e) => setUse2FA(e.target.checked)}
                    className="rounded text-primary focus:ring-primary"
                  />
                  <span className="text-muted-foreground">
                    Simulate Two-Factor Authentication (2FA Verified)
                  </span>
                </label>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleApproveInDossier}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-safe text-white text-xs font-bold rounded-lg hover:bg-safe/90 transition-colors flex items-center gap-1.5"
                  >
                    <Check className="h-3.5 w-3.5" /> Approve &amp; Release Funds
                  </button>
                  <button
                    onClick={handleDeclineInDossier}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-secondary text-foreground text-xs font-medium rounded-lg hover:bg-secondary/80 transition-colors"
                  >
                    Decline Request
                  </button>
                  <button
                    onClick={handleBlockInDossier}
                    disabled={actionLoading}
                    className="px-3 py-2 bg-destructive/10 text-destructive text-xs font-semibold rounded-lg hover:bg-destructive/20 transition-colors"
                  >
                    Block Threat
                  </button>
                </div>
              </div>

              {/* Recipient & Purpose */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <UserCheck className="h-3.5 w-3.5" /> Recipient Intelligence
                </h3>
                <div className="bg-secondary/20 p-4 rounded-xl border border-border space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Recipient Name:</span>
                    <span className="font-medium">{selectedTx.recipientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">UPI Identifier:</span>
                    <span className="font-mono text-xs">{selectedTx.recipientId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Declared Purpose:</span>
                    <span className="font-medium">{selectedTx.purpose}</span>
                  </div>
                  {selectedTx.context && (
                    <div className="pt-2 border-t border-border/50">
                      <span className="text-xs text-muted-foreground block mb-1">
                        Message Context / Pretext:
                      </span>
                      <p className="text-xs bg-background/50 p-2.5 rounded-lg border border-border/50 text-foreground italic">
                        &ldquo;{selectedTx.context}&rdquo;
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Signals Breakdown */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" /> Deterministic Security Signals
                </h3>
                {selectedTx.signals && selectedTx.signals.length > 0 ? (
                  <div className="space-y-2">
                    {selectedTx.signals.map((sig, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-secondary/30 border border-border/80 flex items-start justify-between gap-3"
                      >
                        <div>
                          <p className="font-semibold text-xs text-foreground">
                            {sig.type.replace(/_/g, " ")}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{sig.description}</p>
                        </div>
                        <span className="text-xs font-mono font-bold text-destructive">
                          +{sig.impact}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground bg-secondary/20 p-3 rounded-lg border border-border">
                    No adverse security signals detected for this transaction.
                  </p>
                )}
              </div>

              {/* Gemini AI Contextual Reasoning */}
              {selectedTx.agentAssessment && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-info flex items-center gap-1.5">
                    <Brain className="h-3.5 w-3.5" /> Gemini Contextual Reasoning
                  </h3>
                  <div className="bg-info/5 border border-info/20 p-4 rounded-xl space-y-2">
                    <p className="text-xs text-foreground leading-relaxed">
                      {selectedTx.agentAssessment.explanation}
                    </p>
                    {selectedTx.agentAssessment.recommendedVerification?.length > 0 && (
                      <div className="pt-2 border-t border-info/10">
                        <span className="text-xs font-semibold text-info block mb-1">
                          Recommended Verifications:
                        </span>
                        <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5">
                          {selectedTx.agentAssessment.recommendedVerification.map((rec, i) => (
                            <li key={i}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Audit Timeline */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> Immutable Audit Trail
                </h3>
                {loadingDetails ? (
                  <p className="text-xs text-muted-foreground">Loading audit log...</p>
                ) : auditLogs.length > 0 ? (
                  <div className="space-y-2">
                    {auditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/20 border border-border text-xs"
                      >
                        <div>
                          <span className="font-mono font-semibold text-primary">{log.event}</span>
                          {log.metadata?.notes && (
                            <span className="text-muted-foreground block text-[11px] mt-0.5">
                              Note: {log.metadata.notes}
                            </span>
                          )}
                          {log.metadata?.reason && (
                            <span className="text-destructive block text-[11px] mt-0.5">
                              Reason: {log.metadata.reason}
                            </span>
                          )}
                        </div>
                        <span className="text-muted-foreground font-mono text-[11px] whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Initial audit events registered for this transaction.
                  </p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border flex justify-end bg-secondary/20">
              <button
                onClick={() => setSelectedTx(null)}
                className="px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
