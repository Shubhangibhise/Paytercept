"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, ArrowRight, Activity, AlertTriangle, ShieldX, RefreshCw } from "lucide-react";
import { Transaction } from "@/types";

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState({
    protectedToday: 0,
    transactionsAnalyzed: 0,
    threatsIntercepted: 0,
  });
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Top Status Section */}
      <section className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold mb-1 tracking-tight">Paytercept</h1>
          <p className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-safe opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-safe"></span>
            </span>
            SYSTEM ACTIVE &bull; LIVE GUARDIAN PIPELINE
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
            href="/history"
            className="px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-secondary transition-colors"
          >
            SECURITY HISTORY
          </Link>
          <Link
            href="/pay"
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            MAKE PAYMENT <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Live Stats Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border p-6 rounded-2xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-safe/10 text-safe rounded-xl">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Protected Today</p>
              <p className="text-2xl font-bold tracking-tight">
                ₹{stats.protectedToday.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border p-6 rounded-2xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-info/10 text-info rounded-xl">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Transactions Analyzed</p>
              <p className="text-2xl font-bold tracking-tight">
                {stats.transactionsAnalyzed}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border p-6 rounded-2xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-destructive/10 text-destructive rounded-xl">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Threats Intercepted</p>
              <p className="text-2xl font-bold tracking-tight">
                {stats.threatsIntercepted}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Demo Launchpad */}
      <section className="bg-secondary/20 border border-border/70 p-5 rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Demo Scenarios (Connected to Live Pipeline)
            </h3>
            <p className="text-xs text-muted-foreground">
              Test all four PS09 risk vectors through the live analysis orchestrator
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
              <span className="text-xs font-semibold text-warning">VERIFY</span>
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
              <span className="text-xs font-semibold text-warning">PAUSE</span>
              <span className="text-xs text-muted-foreground">₹25,000</span>
            </div>
            <p className="text-sm font-medium mt-1 text-foreground">3. Suspicious</p>
            <p className="text-xs text-muted-foreground mt-0.5">Urgent context + high sum</p>
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

      {/* Live Recent Transactions */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold tracking-tight">Recent Transactions (Live Data)</h2>
          <span className="text-xs text-muted-foreground font-medium">
            {transactions.length} recorded
          </span>
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No transactions recorded yet. Submit a simulated payment to see it here!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    <th className="px-6 py-4">Recipient</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Time</th>
                    <th className="px-6 py-4">Risk Score</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {transactions.slice(0, 8).map((tx) => (
                    <tr key={tx.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-foreground">{tx.recipientName}</p>
                        <p className="text-xs text-muted-foreground font-mono">{tx.recipientId}</p>
                      </td>
                      <td className="px-6 py-4 font-semibold text-foreground">
                        ₹{tx.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(tx.timestamp).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
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
                          {tx.riskScore !== undefined ? `${tx.riskScore} / 100` : "Pending"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {tx.status === "COMPLETED" ? (
                            <ShieldCheck className="h-4 w-4 text-safe" />
                          ) : tx.status === "BLOCKED" ? (
                            <ShieldX className="h-4 w-4 text-destructive" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-warning" />
                          )}
                          <span className="text-xs font-medium capitalize">
                            {tx.status.replace(/_/g, " ").toLowerCase()}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
