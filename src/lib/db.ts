import { Transaction, AuditLog, CreateTransactionInput, Recipient } from "@/types";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

interface DatabaseSchema {
  transactions: Transaction[];
  auditLogs: AuditLog[];
  recipients: Record<string, Recipient>;
}

const INITIAL_RECIPIENTS: Record<string, Recipient> = {
  "known_verified@upi": {
    id: "r1",
    identifier: "known_verified@upi",
    name: "Amit Sharma",
    verified: true,
    known: true,
    previousTransactionCount: 15,
    riskLevel: "LOW",
  },
  "new_user@upi": {
    id: "r2",
    identifier: "new_user@upi",
    name: "Rahul Kumar",
    verified: false,
    known: false,
    previousTransactionCount: 0,
    riskLevel: "MEDIUM",
  },
  "vendor_rush@upi": {
    id: "r3",
    identifier: "vendor_rush@upi",
    name: "Quick Delivery",
    verified: false,
    known: false,
    previousTransactionCount: 1,
    riskLevel: "HIGH",
  },
  "kyc_support@upi": {
    id: "r4",
    identifier: "kyc_support@upi",
    name: "Security Desk",
    verified: false,
    known: false,
    previousTransactionCount: 0,
    riskLevel: "HIGH",
  },
};

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: "tx-demo-1",
    userId: "u1",
    amount: 750,
    currency: "INR",
    recipientId: "known_verified@upi",
    recipientName: "Amit Sharma",
    purpose: "Dinner with team",
    timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(), // 35 mins ago
    riskScore: 8,
    riskLevel: "SAFE",
    decision: "APPROVE",
    status: "COMPLETED",
    signals: [],
    agentAssessment: {
      riskScore: 8,
      riskLevel: "SAFE",
      recommendedAction: "APPROVE",
      confidence: 0.98,
      signals: [],
      explanation: "Known verified recipient with normal transaction amount.",
      recommendedVerification: [],
    },
  },
  {
    id: "tx-demo-2",
    userId: "u1",
    amount: 2500,
    currency: "INR",
    recipientId: "new_user@upi",
    recipientName: "Rahul Kumar",
    purpose: "Book purchase",
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 hours ago
    riskScore: 35,
    riskLevel: "REVIEW",
    decision: "VERIFY",
    status: "VERIFY",
    signals: [
      {
        type: "NEW_RECIPIENT",
        severity: "MEDIUM",
        impact: 15,
        description: "Recipient has no prior transaction history with user.",
      },
      {
        type: "UNVERIFIED_RECIPIENT",
        severity: "HIGH",
        impact: 20,
        description: "Recipient identity has not been verified by authoritative sources.",
      },
    ],
    agentAssessment: {
      riskScore: 35,
      riskLevel: "REVIEW",
      recommendedAction: "VERIFY",
      confidence: 0.92,
      signals: [
        {
          type: "UNVERIFIED_RECIPIENT",
          severity: "HIGH",
          impact: 20,
          description: "New unverified party requiring identification check.",
        },
      ],
      explanation: "New recipient requires one-time identity verification.",
      recommendedVerification: ["Verify recipient identity through official contacts."],
    },
  },
  {
    id: "tx-demo-3",
    userId: "u1",
    amount: 95000,
    currency: "INR",
    recipientId: "kyc_support@upi",
    recipientName: "Security Desk",
    purpose: "KYC Update",
    context: "Your account will be blocked today. Send the money immediately for KYC verification.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
    riskScore: 96,
    riskLevel: "CRITICAL",
    decision: "BLOCK",
    status: "BLOCKED",
    signals: [
      {
        type: "NEW_RECIPIENT",
        severity: "MEDIUM",
        impact: 15,
        description: "Recipient has no prior transaction history with user.",
      },
      {
        type: "UNVERIFIED_RECIPIENT",
        severity: "HIGH",
        impact: 20,
        description: "Recipient identity has not been verified.",
      },
      {
        type: "UNUSUAL_AMOUNT",
        severity: "HIGH",
        impact: 20,
        description: "Transaction amount is significantly above the user's normal range.",
      },
      {
        type: "URGENCY_LANGUAGE",
        severity: "HIGH",
        impact: 15,
        description: "Detected urgency keywords: account blocked, immediately.",
      },
      {
        type: "KNOWN_SCAM_PATTERN",
        severity: "CRITICAL",
        impact: 30,
        description: "The message creates urgency by threatening account consequences.",
      },
    ],
    agentAssessment: {
      riskScore: 96,
      riskLevel: "CRITICAL",
      recommendedAction: "BLOCK",
      confidence: 0.97,
      signals: [
        {
          type: "SOCIAL_ENGINEERING",
          severity: "CRITICAL",
          impact: 30,
          description: "Aggressive account suspension pretext detected.",
        },
      ],
      explanation: "Classic social engineering KYC phishing scam targeting account seizure fears.",
      recommendedVerification: [
        "Do not send funds under any circumstances.",
        "Contact your bank directly via the number printed on your debit/credit card.",
      ],
    },
  },
];

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: "log-1",
    transactionId: "tx-demo-3",
    event: "TRANSACTION_CREATED",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    metadata: { amount: 95000 },
  },
  {
    id: "log-2",
    transactionId: "tx-demo-3",
    event: "ANALYSIS_REQUESTED",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5 + 500).toISOString(),
    metadata: { recipientId: "kyc_support@upi" },
  },
  {
    id: "log-3",
    transactionId: "tx-demo-3",
    event: "RISK_CALCULATED",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5 + 1500).toISOString(),
    metadata: { score: 96, riskLevel: "CRITICAL" },
  },
  {
    id: "log-4",
    transactionId: "tx-demo-3",
    event: "PAYMENT_BLOCKED",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5 + 2000).toISOString(),
    metadata: { reason: "High confidence social engineering attack" },
  },
];

function loadDatabase(): DatabaseSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(content);
      return {
        transactions: parsed.transactions || [],
        auditLogs: parsed.auditLogs || [],
        recipients: parsed.recipients || INITIAL_RECIPIENTS,
      };
    }
  } catch (e) {
    console.error("Error loading DB file, using fallback:", e);
  }

  const initialData: DatabaseSchema = {
    transactions: INITIAL_TRANSACTIONS,
    auditLogs: INITIAL_AUDIT_LOGS,
    recipients: INITIAL_RECIPIENTS,
  };
  saveDatabase(initialData);
  return initialData;
}

function saveDatabase(data: DatabaseSchema) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("Error saving DB file:", e);
  }
}

export const db = {
  async createTransaction(input: CreateTransactionInput & { userId: string }): Promise<Transaction> {
    const data = loadDatabase();
    const tx: Transaction = {
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: input.userId,
      amount: input.amount,
      currency: "INR",
      recipientId: input.recipientId,
      recipientName: input.recipientName,
      purpose: input.purpose,
      context: input.context,
      timestamp: new Date().toISOString(),
      status: "PENDING",
    };
    data.transactions.unshift(tx);
    saveDatabase(data);
    return tx;
  },

  async getTransaction(id: string): Promise<Transaction | null> {
    const data = loadDatabase();
    const tx = data.transactions.find((t) => t.id === id);
    return tx || null;
  },

  async getTransactions(): Promise<Transaction[]> {
    const data = loadDatabase();
    return [...data.transactions].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  },

  async updateTransactionStatus(id: string, status: Transaction["status"]): Promise<Transaction | null> {
    const data = loadDatabase();
    const idx = data.transactions.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    data.transactions[idx] = { ...data.transactions[idx], status };
    saveDatabase(data);
    return data.transactions[idx];
  },

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | null> {
    const data = loadDatabase();
    const idx = data.transactions.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    data.transactions[idx] = { ...data.transactions[idx], ...updates };
    saveDatabase(data);
    return data.transactions[idx];
  },

  async createAuditLog(transactionId: string, event: string, metadata?: any): Promise<AuditLog> {
    const data = loadDatabase();
    const log: AuditLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      transactionId,
      event,
      timestamp: new Date().toISOString(),
      metadata,
    };
    data.auditLogs.unshift(log);
    saveDatabase(data);
    return log;
  },

  async getAuditLogs(transactionId?: string): Promise<AuditLog[]> {
    const data = loadDatabase();
    if (transactionId) {
      return data.auditLogs.filter((log) => log.transactionId === transactionId);
    }
    return data.auditLogs;
  },

  async getRecipient(identifier: string): Promise<Recipient | null> {
    const data = loadDatabase();
    return data.recipients[identifier] || null;
  },

  async getRecipients(): Promise<Record<string, Recipient>> {
    const data = loadDatabase();
    return data.recipients;
  },

  async getStats() {
    const data = loadDatabase();
    const transactions = data.transactions;

    let protectedToday = 0;
    let threatsIntercepted = 0;

    for (const tx of transactions) {
      if (tx.status === "BLOCKED" || tx.status === "PAUSED" || tx.decision === "BLOCK" || tx.decision === "PAUSE") {
        protectedToday += tx.amount || 0;
        threatsIntercepted += 1;
      }
    }

    return {
      protectedToday,
      transactionsAnalyzed: transactions.length,
      threatsIntercepted,
    };
  },
};
