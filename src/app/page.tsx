"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ArrowRight,
  Activity,
  AlertTriangle,
  ShieldX,
  RefreshCw,
  Check,
  X,
  Tag,
  Clock,
  Sparkles,
  Lock,
} from "lucide-react";
import { Transaction } from "@/types";

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState({
    protectedToday: 0,
    transactionsAnalyzed: 0,
    threatsIntercepted: 0,
    pendingApprovals: 0,
    approvedTotal: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "APPROVALS" | "APPROVED" | "BLOCKED">("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Quick Approval Modal
  const [quickApproveTx, setQuickApproveTx] = useState<Transaction | null>(null);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [use2FA, setUse2FA] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [txRes, statsRes] = await Promise.all([
        fetch("/api/transactions"),
        fetch("/api/stats"),
      ]);

      if (txRes.ok) {
        const txData = await txRes.json();
        if (txData.transactions) setTransactions(txData.transactions);
      }

      if (statsRes.ok) {
        const sData = await statsRes.json();
        if (sData.stats) setStats(sData.stats);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async () => {
    if (!quickApproveTx) return;
    try {
      setActionLoadingId(quickApproveTx.id);
      const res = await fetch(`/api/transactions/${quickApproveTx.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: approvalNotes || "Approved via Dashboard Quick Action",
          approver: "Admin / You",
          verifiedWith2FA: use2FA,
        }),
      });

      if (res.ok) {
        setQuickApproveTx(null);
        setApprovalNotes("");
        setUse2FA(false);
        await fetchData();
      }
    } catch (err) {
      console.error("Failed to approve transaction:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDecline = async (txId: string) => {
    try {
      setActionLoadingId(txId);
      const res = await fetch(`/api/transactions/${txId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: "Declined from Dashboard quick action",
        }),
      });

      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error("Failed to decline transaction:", err);
    } finally {
      setActionLoadingId(null);
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

  const pendingApprovalsList = useMemo(() => {
    return transactions.filter(isPendingApproval);
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (filter === "APPROVALS" && !isPendingApproval(tx)) return false;
      if (filter === "APPROVED" && tx.status !== "COMPLETED" && tx.decision !== "APPROVE") return false;
      if (filter === "BLOCKED" && tx.status !== "BLOCKED" && tx.decision !== "BLOCK") return false;

      if (categoryFilter !== "ALL" && (tx.category || "PERSONAL") !== categoryFilter) return false;
      return true;
    });
  }, [transactions, filter, categoryFilter]);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Top Status Section */}
      <section className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-2xl font-bold mb-1 tracking-tight">
            Paytercept<span className="text-info font-mono text-base">.ai</span>
          </h1>
          <p className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-safe opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-safe"></span>
            </span>
            SYSTEM ACTIVE &bull; LIVE SCAM GUARDIAN &amp; APPROVAL PIPELINE
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            title="Refresh Live Data"
            className="p-2 border border-border rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <Link
            href="/approvals"
            className="px-3.5 py-2 text-sm font-semibold border border-warning/30 bg-warning/10 text-warning rounded-lg hover:bg-warning/20 transition-colors flex items-center gap-1.5"
          >
            <AlertTriangle className="h-4 w-4" />
            Approvals ({pendingApprovalsList.length})
          </Link>
          <Link
            href="/history"
            className="px-3.5 py-2 text-sm font-medium border border-border rounded-lg hover:bg-secondary transition-colors"
          >
            HISTORY
          </Link>
          <Link
            href="/pay"
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            MAKE PAYMENT <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Live Stats Cards (4 Columns) */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-5 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-safe/10 text-safe rounded-xl">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Protected</p>
              <p className="text-xl font-bold tracking-tight">₹{stats.protectedToday.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-info/10 text-info rounded-xl">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Analyzed</p>
              <p className="text-xl font-bold tracking-tight">{stats.transactionsAnalyzed}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-destructive/10 text-destructive rounded-xl">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Intercepted</p>
              <p className="text-xl font-bold tracking-tight">{stats.threatsIntercepted}</p>
            </div>
          </div>
        </div>

        <Link
          href="/approvals"
          className="bg-card border border-warning/30 hover:border-warning/60 p-5 rounded-2xl transition-all group block"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-warning/10 text-warning rounded-xl group-hover:scale-105 transition-transform">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-warning font-semibold uppercase tracking-wider">Pending Approvals</p>
              <p className="text-xl font-bold text-foreground tracking-tight">
                {pendingApprovalsList.length}
              </p>
            </div>
          </div>
        </Link>
      </section>

      {/* ACTION REQUIRED: Pending Approvals Queue Banner */}
      {pendingApprovalsList.length > 0 && (
        <section className="bg-warning/5 border border-warning/30 p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-warning/20 text-warning">
                <AlertTriangle className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-foreground">
                  Action Required: {pendingApprovalsList.length} Payment Request(s) Awaiting Your Approval
                </h2>
                <p className="text-xs text-muted-foreground">
                  Flagged by deterministic security engine or AI reasoning. Approve with verification or decline.
                </p>
              </div>
            </div>
            <Link
              href="/approvals"
              className="text-xs font-semibold text-warning hover:underline shrink-0"
            >
              Open Full Approval Hub &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {pendingApprovalsList.slice(0, 2).map((tx) => (
              <div
                key={tx.id}
                className="bg-card border border-border p-4 rounded-xl flex items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm truncate">{tx.recipientName}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                      {tx.category || "PERSONAL"}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-foreground">₹{tx.amount.toLocaleString()}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{tx.purpose}</p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => setQuickApproveTx(tx)}
                    disabled={actionLoadingId === tx.id}
                    className="py-1.5 px-3 bg-safe text-white text-xs font-semibold rounded-lg hover:bg-safe/90 transition-colors flex items-center gap-1"
                  >
                    <Check className="h-3 w-3" /> Approve
                  </button>
                  <button
                    onClick={() => handleDecline(tx.id)}
                    disabled={actionLoadingId === tx.id}
                    className="py-1.5 px-2.5 bg-secondary text-foreground text-xs font-medium rounded-lg hover:bg-secondary/80 transition-colors"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Quick Demo Launchpad */}
      <section className="bg-secondary/20 border border-border/70 p-5 rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Demo Scenarios (Connected to Live Pipeline)
            </h3>
            <p className="text-xs text-muted-foreground">
              Simulate diverse categories and observe risk engine classification &amp; approvals
            </p>
          </div>
          <Link
            href="/pay"
            className="text-xs font-semibold text-info hover:underline self-start sm:self-auto"
          >
            Custom Payment &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <Link
            href="/pay?demo=normal"
            className="p-3 rounded-xl bg-card border border-border/80 hover:border-safe/50 transition-all text-left group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-safe">APPROVE</span>
              <span className="text-xs text-muted-foreground">₹750</span>
            </div>
            <p className="text-sm font-medium mt-1 text-foreground">1. Normal Payment</p>
            <p className="text-xs text-muted-foreground mt-0.5">Known verified recipient</p>
          </Link>

          <Link
            href="/pay?demo=new"
            className="p-3 rounded-xl bg-card border border-border/80 hover:border-warning/50 transition-all text-left group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-warning">NEEDS APPROVAL</span>
              <span className="text-xs text-muted-foreground">₹2,500</span>
            </div>
            <p className="text-sm font-medium mt-1 text-foreground">2. New Recipient</p>
            <p className="text-xs text-muted-foreground mt-0.5">First-time unverified</p>
          </Link>

          <Link
            href="/pay?demo=suspicious"
            className="p-3 rounded-xl bg-card border border-border/80 hover:border-warning/50 transition-all text-left group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-warning">PAUSE &amp; VERIFY</span>
              <span className="text-xs text-muted-foreground">₹25,000</span>
            </div>
            <p className="text-sm font-medium mt-1 text-foreground">3. High Sum Suspicious</p>
            <p className="text-xs text-muted-foreground mt-0.5">Urgent vocabulary flagged</p>
          </Link>

          <Link
            href="/pay?demo=attack"
            className="p-3 rounded-xl bg-card border border-border/80 hover:border-destructive/50 transition-all text-left group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-destructive">BLOCK</span>
              <span className="text-xs text-muted-foreground">₹95,000</span>
            </div>
            <p className="text-sm font-medium mt-1 text-foreground">4. Social Attack</p>
            <p className="text-xs text-muted-foreground mt-0.5">KYC suspension pretext</p>
          </Link>
        </div>
      </section>

      {/* Categorized Recent Transactions */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Categorized Transactions</h2>
            <p className="text-xs text-muted-foreground">
              Review live ledger entries, category tags, and security decisions
            </p>
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
              <Tag className="h-3 w-3" /> Category:
            </span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs bg-card border border-border rounded-lg px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
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

        {/* Status Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg border font-medium transition-colors ${
              filter === "ALL"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:bg-secondary"
            }`}
          >
            All ({transactions.length})
          </button>
          <button
            onClick={() => setFilter("APPROVALS")}
            className={`px-3 py-1.5 rounded-lg border font-medium transition-colors flex items-center gap-1.5 ${
              filter === "APPROVALS"
                ? "bg-warning/20 text-warning border-warning/40 font-semibold"
                : "bg-card text-muted-foreground border-border hover:bg-secondary"
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            Needs Approval ({pendingApprovalsList.length})
          </button>
          <button
            onClick={() => setFilter("APPROVED")}
            className={`px-3 py-1.5 rounded-lg border font-medium transition-colors ${
              filter === "APPROVED"
                ? "bg-safe/20 text-safe border-safe/40 font-semibold"
                : "bg-card text-muted-foreground border-border hover:bg-secondary"
            }`}
          >
            Approved &amp; Completed
          </button>
          <button
            onClick={() => setFilter("BLOCKED")}
            className={`px-3 py-1.5 rounded-lg border font-medium transition-colors ${
              filter === "BLOCKED"
                ? "bg-destructive/20 text-destructive border-destructive/40 font-semibold"
                : "bg-card text-muted-foreground border-border hover:bg-secondary"
            }`}
          >
            Blocked Threats
          </button>
        </div>

        {/* Transactions Table */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          {filteredTransactions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No transactions found matching the selected filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    <th className="px-5 py-3.5">Recipient &amp; Purpose</th>
                    <th className="px-5 py-3.5">Category</th>
                    <th className="px-5 py-3.5">Amount</th>
                    <th className="px-5 py-3.5">Risk Score</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {filteredTransactions.slice(0, 8).map((tx) => {
                    const needsApproval = isPendingApproval(tx);

                    return (
                      <tr key={tx.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-foreground">{tx.recipientName}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {tx.purpose}
                          </p>
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
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                              tx.riskLevel === "SAFE"
                                ? "bg-safe/10 text-safe border border-safe/20"
                                : tx.riskLevel === "REVIEW"
                                ? "bg-warning/10 text-warning border border-warning/20"
                                : "bg-destructive/10 text-destructive border border-destructive/20"
                            }`}
                          >
                            {tx.riskScore !== undefined ? `${tx.riskScore}/100` : "Pending"}
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
                              {needsApproval ? "Awaiting Approval" : tx.status.replace(/_/g, " ").toLowerCase()}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          {needsApproval ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setQuickApproveTx(tx)}
                                className="px-2.5 py-1 text-xs font-semibold bg-safe text-white rounded-md hover:bg-safe/90 transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleDecline(tx.id)}
                                className="px-2 py-1 text-xs font-medium bg-secondary text-muted-foreground hover:text-foreground rounded-md transition-colors"
                              >
                                Decline
                              </button>
                            </div>
                          ) : (
                            <Link
                              href="/history"
                              className="text-xs text-info font-medium hover:underline"
                            >
                              Dossier &rarr;
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* QUICK APPROVAL MODAL */}
      {quickApproveTx && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-safe" />
                  Approve Payment Request
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Confirm funds transfer of ₹{quickApproveTx.amount.toLocaleString()} to {quickApproveTx.recipientName}
                </p>
              </div>
              <button
                onClick={() => setQuickApproveTx(null)}
                className="p-1 text-muted-foreground hover:text-foreground rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-foreground">
                Approval Note (Recorded in Audit Trail)
              </label>
              <textarea
                rows={2}
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="e.g. Verified recipient over phone, authorized expenditure..."
                className="w-full p-2.5 text-xs bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs p-2.5 rounded-lg bg-secondary/30 border border-border">
              <input
                type="checkbox"
                checked={use2FA}
                onChange={(e) => setUse2FA(e.target.checked)}
                className="rounded text-primary focus:ring-primary"
              />
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-primary" />
                Simulate 2FA Security Token Verification
              </span>
            </label>

            <div className="pt-2 flex justify-end gap-2 border-t border-border">
              <button
                onClick={() => setQuickApproveTx(null)}
                className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={actionLoadingId !== null}
                className="px-5 py-2 text-xs font-bold bg-safe text-white rounded-lg hover:bg-safe/90 transition-colors flex items-center gap-2"
              >
                {actionLoadingId ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Authorize &amp; Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
