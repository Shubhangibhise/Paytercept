"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  AlertTriangle,
  RefreshCw,
  Check,
  X,
  ArrowRight,
  UserCheck,
  Search,
  Filter,
  Tag,
  Lock,
  FileText,
  Clock,
  Sparkles,
  Layers,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";
import { Transaction, PaymentCategory } from "@/types";

const CATEGORIES: { label: string; value: string; color: string }[] = [
  { label: "All Categories", value: "ALL", color: "bg-secondary text-foreground" },
  { label: "Personal", value: "PERSONAL", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  { label: "Vendor & Bills", value: "VENDOR", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  { label: "Utilities", value: "UTILITIES", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  { label: "Payroll", value: "PAYROLL", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  { label: "Emergency", value: "EMERGENCY", color: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
  { label: "Suspicious", value: "SUSPICIOUS", color: "bg-destructive/10 text-destructive border-destructive/20" },
];

export default function ApprovalsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"PENDING_APPROVAL" | "ALL" | "APPROVED" | "BLOCKED">("PENDING_APPROVAL");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Modal states
  const [approvalModalTx, setApprovalModalTx] = useState<Transaction | null>(null);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [use2FA, setUse2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");

  const [declineModalTx, setDeclineModalTx] = useState<Transaction | null>(null);
  const [declineReason, setDeclineReason] = useState("");

  const [categoryModalTx, setCategoryModalTx] = useState<Transaction | null>(null);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/transactions");
      if (res.ok) {
        const data = await res.json();
        if (data.transactions) setTransactions(data.transactions);
      }
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleApprove = async () => {
    if (!approvalModalTx) return;
    try {
      setProcessingId(approvalModalTx.id);
      const res = await fetch(`/api/transactions/${approvalModalTx.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: approvalNotes,
          approver: "Security Officer / You",
          verifiedWith2FA: use2FA,
        }),
      });

      if (res.ok) {
        setApprovalModalTx(null);
        setApprovalNotes("");
        setUse2FA(false);
        setTwoFactorCode("");
        await fetchTransactions();
      }
    } catch (err) {
      console.error("Approval failed:", err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async () => {
    if (!declineModalTx) return;
    try {
      setProcessingId(declineModalTx.id);
      const res = await fetch(`/api/transactions/${declineModalTx.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: declineReason || "Declined by approver",
          approver: "Security Officer / You",
        }),
      });

      if (res.ok) {
        setDeclineModalTx(null);
        setDeclineReason("");
        await fetchTransactions();
      }
    } catch (err) {
      console.error("Decline failed:", err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleBlock = async (tx: Transaction) => {
    if (!confirm(`Are you sure you want to block this payment of ₹${tx.amount.toLocaleString()} to ${tx.recipientName}?`)) return;
    try {
      setProcessingId(tx.id);
      const res = await fetch(`/api/transactions/${tx.id}/block`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: "Flagged and blocked directly from Approval Hub",
        }),
      });

      if (res.ok) {
        await fetchTransactions();
      }
    } catch (err) {
      console.error("Block failed:", err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleUpdateCategory = async (txId: string, newCategory: string) => {
    try {
      setProcessingId(txId);
      const res = await fetch(`/api/transactions/${txId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: newCategory }),
      });
      if (res.ok) {
        setCategoryModalTx(null);
        await fetchTransactions();
      }
    } catch (err) {
      console.error("Category update failed:", err);
    } finally {
      setProcessingId(null);
    }
  };

  // Filtered lists
  const isAwaitingApproval = (tx: Transaction) => {
    const isApprovalState =
      tx.status === "VERIFY" ||
      tx.status === "PAUSED" ||
      tx.status === "PENDING" ||
      tx.decision === "VERIFY" ||
      tx.decision === "PAUSE";
    return isApprovalState && tx.status !== "COMPLETED" && tx.status !== "BLOCKED" && tx.status !== "CANCELLED";
  };

  const pendingApprovals = useMemo(() => {
    return transactions.filter(isAwaitingApproval);
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Status filter
      if (statusFilter === "PENDING_APPROVAL" && !isAwaitingApproval(tx)) return false;
      if (statusFilter === "APPROVED" && tx.status !== "COMPLETED" && tx.decision !== "APPROVE") return false;
      if (statusFilter === "BLOCKED" && tx.status !== "BLOCKED" && tx.decision !== "BLOCK") return false;

      // Category filter
      if (selectedCategory !== "ALL" && (tx.category || "PERSONAL") !== selectedCategory) return false;

      // Search filter
      if (search) {
        const query = search.toLowerCase();
        const matchesName = tx.recipientName?.toLowerCase().includes(query);
        const matchesId = tx.recipientId?.toLowerCase().includes(query);
        const matchesPurpose = tx.purpose?.toLowerCase().includes(query);
        const matchesContext = tx.context?.toLowerCase().includes(query);
        const matchesCategory = tx.category?.toLowerCase().includes(query);
        return matchesName || matchesId || matchesPurpose || matchesContext || matchesCategory;
      }

      return true;
    });
  }, [transactions, statusFilter, selectedCategory, search]);

  const totalAtStake = useMemo(() => {
    return pendingApprovals.reduce((acc, tx) => acc + (tx.amount || 0), 0);
  }, [pendingApprovals]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Top Header */}
      <section className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Payment Approval Hub</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-warning/10 text-warning border border-warning/20">
              {pendingApprovals.length} Action Needed
            </span>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Categorized risk queue: evaluate AI recommendations, verify evidence, approve payments or intercept fraud.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchTransactions}
            title="Refresh Queue"
            className="p-2 border border-border rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <Link
            href="/pay"
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            Create Test Payment <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Metrics Ribbon */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-4 rounded-xl">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Awaiting Approval</p>
          <p className="text-2xl font-bold mt-1 text-warning">{pendingApprovals.length}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Payments currently held</p>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Value in Review</p>
          <p className="text-2xl font-bold mt-1 text-foreground">₹{totalAtStake.toLocaleString()}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Subject to authorization</p>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">High Risk / Urgent</p>
          <p className="text-2xl font-bold mt-1 text-destructive">
            {pendingApprovals.filter((t) => t.riskLevel === "HIGH" || t.riskLevel === "CRITICAL" || t.status === "PAUSED").length}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Paused by guardian policy</p>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Approved Today</p>
          <p className="text-2xl font-bold mt-1 text-safe">
            {transactions.filter((t) => t.status === "COMPLETED" || t.decision === "APPROVE").length}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Safe & authorized</p>
        </div>
      </section>

      {/* Categorization & Filter Toolbar */}
      <section className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
          {/* Status Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setStatusFilter("PENDING_APPROVAL")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === "PENDING_APPROVAL"
                  ? "bg-warning/15 text-warning border-warning/30"
                  : "bg-secondary/40 text-muted-foreground border-border hover:bg-secondary hover:text-foreground"
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Approval Queue ({pendingApprovals.length})
            </button>
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all whitespace-nowrap ${
                statusFilter === "ALL"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary/40 text-muted-foreground border-border hover:bg-secondary hover:text-foreground"
              }`}
            >
              All Categorized ({transactions.length})
            </button>
            <button
              onClick={() => setStatusFilter("APPROVED")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all whitespace-nowrap ${
                statusFilter === "APPROVED"
                  ? "bg-safe/15 text-safe border-safe/30"
                  : "bg-secondary/40 text-muted-foreground border-border hover:bg-secondary hover:text-foreground"
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setStatusFilter("BLOCKED")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all whitespace-nowrap ${
                statusFilter === "BLOCKED"
                  ? "bg-destructive/15 text-destructive border-destructive/30"
                  : "bg-secondary/40 text-muted-foreground border-border hover:bg-secondary hover:text-foreground"
              }`}
            >
              Blocked
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search recipient, UPI, purpose..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-background rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="pt-2 border-t border-border flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-muted-foreground font-medium flex items-center gap-1 shrink-0">
            <Tag className="h-3.5 w-3.5" /> Category:
          </span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors shrink-0 ${
                selectedCategory === cat.value
                  ? "bg-foreground text-background font-semibold border-foreground"
                  : "bg-secondary/30 text-muted-foreground border-border/80 hover:bg-secondary hover:text-foreground"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* Main Approval Cards List */}
      <section className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground text-sm bg-card border border-border rounded-2xl">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
            Loading categorized payments...
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm bg-card border border-border rounded-2xl space-y-3">
            <ShieldCheck className="h-10 w-10 text-safe mx-auto opacity-70" />
            <p className="font-semibold text-foreground text-base">
              {statusFilter === "PENDING_APPROVAL" ? "No Pending Approval Requests" : "No Payments Match Filters"}
            </p>
            <p className="text-xs max-w-md mx-auto">
              {statusFilter === "PENDING_APPROVAL"
                ? "All transactions have either been processed, verified, or blocked according to Paytercept's security rules."
                : "Try clearing your search query or switching categories."}
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <Link
                href="/pay?demo=new"
                className="px-4 py-2 text-xs font-medium bg-warning/10 text-warning border border-warning/20 rounded-lg hover:bg-warning/20"
              >
                Trigger Demo Review Payment (₹2,500)
              </Link>
              <Link
                href="/pay?demo=suspicious"
                className="px-4 py-2 text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20 rounded-lg hover:bg-destructive/20"
              >
                Trigger Demo Urgent Payment (₹25,000)
              </Link>
            </div>
          </div>
        ) : (
          filteredTransactions.map((tx) => {
            const needsApproval = isAwaitingApproval(tx);
            const isBlocked = tx.status === "BLOCKED" || tx.decision === "BLOCK";
            const isApproved = tx.status === "COMPLETED" || tx.decision === "APPROVE";

            return (
              <div
                key={tx.id}
                className={`bg-card border rounded-2xl p-5 shadow-sm transition-all hover:border-border/90 ${
                  needsApproval
                    ? "border-warning/30 bg-warning/[0.02]"
                    : isBlocked
                    ? "border-destructive/20"
                    : "border-border"
                }`}
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  {/* Left Column: Recipient & Meta */}
                  <div className="space-y-2 min-w-[280px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                        {tx.id}
                      </span>
                      {/* Category Badge */}
                      <button
                        onClick={() => setCategoryModalTx(tx)}
                        title="Click to change category"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border border-border bg-secondary/50 text-foreground hover:bg-secondary"
                      >
                        <Tag className="h-3 w-3 text-muted-foreground" />
                        {tx.category || "PERSONAL"}
                      </button>

                      {/* Status Badge */}
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          needsApproval
                            ? "bg-warning/15 text-warning border border-warning/30"
                            : isApproved
                            ? "bg-safe/15 text-safe border border-safe/30"
                            : isBlocked
                            ? "bg-destructive/15 text-destructive border border-destructive/30"
                            : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {needsApproval ? "APPROVAL REQUEST" : tx.status}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                        {tx.recipientName}
                        <span className="font-normal text-xs text-muted-foreground font-mono">
                          ({tx.recipientId})
                        </span>
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        <span className="font-medium text-foreground">Purpose:</span> {tx.purpose}
                      </p>
                      {tx.context && (
                        <p className="text-xs text-muted-foreground italic bg-background/50 p-1.5 rounded border border-border/50 mt-1 max-w-lg">
                          &ldquo;{tx.context}&rdquo;
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(tx.timestamp).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {tx.approvedBy && (
                        <span className="text-safe flex items-center gap-1 font-medium">
                          <Check className="h-3 w-3" /> Authorized by: {tx.approvedBy}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle Column: Amount & AI Risk Intelligence */}
                  <div className="flex-1 w-full lg:max-w-md bg-secondary/20 p-3.5 rounded-xl border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] text-muted-foreground uppercase font-semibold">Payment Sum</p>
                        <p className="text-xl font-extrabold text-foreground">
                          ₹{tx.amount.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-muted-foreground uppercase font-semibold">Risk Rating</p>
                        <span
                          className={`inline-block font-mono text-xs font-bold px-2 py-0.5 rounded ${
                            tx.riskLevel === "SAFE"
                              ? "bg-safe/20 text-safe"
                              : tx.riskLevel === "REVIEW"
                              ? "bg-warning/20 text-warning"
                              : "bg-destructive/20 text-destructive"
                          }`}
                        >
                          {tx.riskScore !== undefined ? `${tx.riskScore}/100 ` : ""}
                          {tx.riskLevel || "PENDING"}
                        </span>
                      </div>
                    </div>

                    {/* AI Assessment Breakdown */}
                    {tx.agentAssessment && (
                      <div className="text-xs text-muted-foreground border-t border-border/60 pt-2 flex items-start gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-info shrink-0 mt-0.5" />
                        <p className="line-clamp-2 leading-relaxed text-[11px]">
                          {tx.agentAssessment.explanation}
                        </p>
                      </div>
                    )}

                    {/* Signals Tags */}
                    {tx.signals && tx.signals.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {tx.signals.slice(0, 3).map((sig, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-2 py-0.5 rounded bg-background/80 border border-border font-medium text-foreground"
                          >
                            {sig.type.replace(/_/g, " ")} (+{sig.impact})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Interactive Approval Actions */}
                  <div className="flex lg:flex-col items-center gap-2 w-full lg:w-44 shrink-0">
                    {needsApproval ? (
                      <>
                        <button
                          onClick={() => {
                            setApprovalModalTx(tx);
                            setApprovalNotes("");
                            setUse2FA(false);
                          }}
                          disabled={processingId === tx.id}
                          className="w-full py-2.5 px-3 bg-safe text-white font-semibold text-xs rounded-lg hover:bg-safe/90 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Approve Payment
                        </button>
                        <button
                          onClick={() => {
                            setDeclineModalTx(tx);
                            setDeclineReason("");
                          }}
                          disabled={processingId === tx.id}
                          className="w-full py-2 px-3 bg-secondary border border-border text-foreground font-medium text-xs rounded-lg hover:bg-secondary/80 transition-all flex items-center justify-center gap-1.5"
                        >
                          <X className="h-3.5 w-3.5 text-muted-foreground" />
                          Decline Request
                        </button>
                        <button
                          onClick={() => handleBlock(tx)}
                          disabled={processingId === tx.id}
                          className="w-full py-1.5 px-3 bg-destructive/10 text-destructive text-[11px] font-semibold rounded-lg hover:bg-destructive/20 transition-all flex items-center justify-center gap-1"
                        >
                          <ShieldX className="h-3 w-3" />
                          Block Threat
                        </button>
                      </>
                    ) : (
                      <div className="w-full space-y-1.5">
                        <Link
                          href="/history"
                          className="w-full py-2 px-3 bg-secondary/80 text-foreground font-medium text-xs rounded-lg hover:bg-secondary transition-all flex items-center justify-center gap-1 text-center"
                        >
                          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                          View Dossier
                        </Link>
                        {isBlocked && (
                          <button
                            onClick={() => {
                              setApprovalModalTx(tx);
                              setApprovalNotes("Manual administrative unblock & approval override");
                              setUse2FA(true);
                            }}
                            className="w-full py-1.5 px-2 text-[11px] font-semibold text-warning hover:underline text-center block"
                          >
                            Override & Approve
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* APPROVAL MODAL */}
      {approvalModalTx && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-safe" />
                  Authorize Payment Request
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Confirm simulated funds transfer to {approvalModalTx.recipientName}
                </p>
              </div>
              <button
                onClick={() => setApprovalModalTx(null)}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Summary Grid */}
            <div className="p-3.5 rounded-xl bg-secondary/30 border border-border grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground block">Transfer Amount:</span>
                <span className="font-extrabold text-base text-foreground">
                  ₹{approvalModalTx.amount.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Recipient UPI:</span>
                <span className="font-mono font-medium text-foreground truncate block">
                  {approvalModalTx.recipientId}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Category:</span>
                <span className="font-semibold text-primary">{approvalModalTx.category || "PERSONAL"}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Risk Evaluation:</span>
                <span className="font-bold text-warning">{approvalModalTx.riskScore ?? 0} / 100</span>
              </div>
            </div>

            {/* Optional 2FA Simulation */}
            <div className="space-y-2 p-3.5 rounded-xl bg-background border border-border text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={use2FA}
                  onChange={(e) => setUse2FA(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-primary" />
                  Simulate Two-Factor Authentication (2FA / OTP Verified)
                </span>
              </label>
              {use2FA && (
                <div className="pt-2">
                  <input
                    type="text"
                    placeholder="Enter simulated 6-digit OTP (e.g. 849201)"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value)}
                    className="w-full p-2 bg-secondary/30 border border-border rounded-lg text-xs font-mono"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Simulates SMS/Banking OTP hardware token approval.
                  </p>
                </div>
              )}
            </div>

            {/* Approval Notes */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-foreground">
                Approval Notes / Justification (Audit Logged)
              </label>
              <textarea
                rows={2}
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="e.g., Verified recipient over phone; approved invoice #104..."
                className="w-full p-2.5 text-xs bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex justify-end gap-2 border-t border-border">
              <button
                onClick={() => setApprovalModalTx(null)}
                className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={processingId !== null}
                className="px-5 py-2 text-xs font-bold bg-safe text-white rounded-lg hover:bg-safe/90 transition-colors flex items-center gap-2"
              >
                {processingId ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Confirm & Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DECLINE MODAL */}
      {declineModalTx && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <X className="h-4 w-4 text-destructive" />
                  Decline Payment Request
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Stop payment of ₹{declineModalTx.amount.toLocaleString()} to {declineModalTx.recipientName}
                </p>
              </div>
              <button
                onClick={() => setDeclineModalTx(null)}
                className="p-1 text-muted-foreground hover:text-foreground rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-foreground">
                Reason for Rejection
              </label>
              <textarea
                rows={3}
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="e.g., Unrecognized invoice, suspicious phone call, duplicate charge..."
                className="w-full p-2.5 text-xs bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-border">
              <button
                onClick={() => setDeclineModalTx(null)}
                className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground rounded-lg"
              >
                Keep Request
              </button>
              <button
                onClick={handleDecline}
                disabled={processingId !== null}
                className="px-4 py-2 text-xs font-bold bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
              >
                {processingId ? "Declining..." : "Decline Payment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORY CHANGE MODAL */}
      {categoryModalTx && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground">Assign Category</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{categoryModalTx.purpose}</p>
              </div>
              <button
                onClick={() => setCategoryModalTx(null)}
                className="p-1 text-muted-foreground hover:text-foreground rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1.5 pt-1">
              {CATEGORIES.filter((c) => c.value !== "ALL").map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => handleUpdateCategory(categoryModalTx.id, cat.value)}
                  className={`w-full p-2.5 text-left text-xs font-medium rounded-lg border transition-colors flex items-center justify-between ${
                    categoryModalTx.category === cat.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary/40 text-foreground border-border hover:bg-secondary"
                  }`}
                >
                  <span>{cat.label}</span>
                  {categoryModalTx.category === cat.value && <Check className="h-3.5 w-3.5" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
