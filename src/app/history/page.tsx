"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import { Transaction, AuditLog } from "@/types";

export default function SecurityHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<string>("All");
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

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

  const filteredTransactions = transactions.filter((tx) => {
    if (filter === "All") return true;
    if (filter === "Safe") return tx.riskLevel === "SAFE" || tx.decision === "APPROVE";
    if (filter === "Review") return tx.riskLevel === "REVIEW" || tx.decision === "VERIFY";
    if (filter === "Paused") return tx.riskLevel === "HIGH" || tx.decision === "PAUSE" || tx.status === "PAUSED";
    if (filter === "Blocked") return tx.riskLevel === "CRITICAL" || tx.decision === "BLOCK" || tx.status === "BLOCKED";
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">Security History</h1>
          <p className="text-muted-foreground text-sm">
            Live audit logs and deep-dive risk dossiers for every analyzed transaction.
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
        {/* Filters */}
        <div className="p-4 border-b border-border bg-secondary/30 flex gap-2 overflow-x-auto">
          {["All", "Safe", "Review", "Paused", "Blocked"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-1.5 text-xs font-medium rounded-full border transition-all ${
                filter === tab
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background/80 text-muted-foreground border-border hover:bg-secondary hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground font-medium">
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4">Recipient</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Risk Level</th>
                <th className="px-6 py-4">Decision</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground text-sm">
                    No transactions match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    onClick={() => openDetails(tx)}
                    className="hover:bg-secondary/40 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(tx.timestamp).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {tx.recipientName}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">{tx.recipientId}</p>
                    </td>
                    <td className="px-6 py-4 font-semibold text-foreground">
                      ₹{tx.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
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
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {tx.status === "COMPLETED" || tx.decision === "APPROVE" ? (
                          <ShieldCheck className="h-4 w-4 text-safe" />
                        ) : tx.status === "BLOCKED" || tx.decision === "BLOCK" ? (
                          <ShieldX className="h-4 w-4 text-destructive" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-warning" />
                        )}
                        <span className="text-xs font-medium capitalize">
                          {tx.decision || tx.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-xs text-info font-medium hover:underline">
                        View Dossier &rarr;
                      </span>
                    </td>
                  </tr>
                ))
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
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                    {selectedTx.id}
                  </span>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      selectedTx.decision === "APPROVE"
                        ? "bg-safe/10 text-safe"
                        : selectedTx.decision === "BLOCK"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-warning/10 text-warning"
                    }`}
                  >
                    {selectedTx.decision || selectedTx.status}
                  </span>
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
                  <p className="text-xs text-muted-foreground">Risk Category</p>
                  <p className="text-sm font-semibold">{selectedTx.riskLevel || "SAFE"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Final Status</p>
                  <p className="text-sm font-semibold capitalize">
                    {selectedTx.status.replace(/_/g, " ").toLowerCase()}
                  </p>
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
                        <span className="font-mono font-semibold text-primary">{log.event}</span>
                        <span className="text-muted-foreground font-mono text-[11px]">
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
