# Paytercept | Agentic AI Payment Guardian

**"Think before you pay."**

## Project Overview
Digital payment scams are increasingly complex, relying on social engineering and urgency to bypass traditional banking rules. Users need protection *before* a suspicious transaction is completed.

Paytercept is an agentic payment-security assistant capable of analyzing a payment request, evaluating risk, verifying relevant information, and taking appropriate protective action before transaction completion.

> **IMPORTANT DISCLAIMER**: Paytercept is a hackathon prototype using simulated payment transactions. It does NOT execute real financial transactions. The system does NOT integrate with actual bank accounts or real UPI gateways.

## Architecture & Agent Workflow
Paytercept follows a strict philosophical foundation: *"AI reasons. Rules protect. Humans remain in control."*

When a payment is initiated, the orchestrator triggers:
1. **Transaction Intelligence**: Checks amount baselines and timing.
2. **Recipient Intelligence**: Simulates lookup of known vs. new recipients and verification statuses.
3. **Scam Pattern Detection**: Analyzes context for known social-engineering scripts (e.g., account suspension threats).
4. **Behaviour Analysis**: Compares the request against a simulated user baseline.
5. **Deterministic Risk Engine**: Generates a hard baseline score and policy recommendation (SAFE, REVIEW, HIGH, CRITICAL).
6. **Gemini Contextual Reasoning**: The Google Gemini API receives the deterministic evidence and evaluates contextual relationships, returning a strict structured assessment via Zod.
7. **Safety Policy Engine**: Fuses the AI intelligence with deterministic rules. **AI can escalate protection, but it can never bypass a deterministic block.**

## Technology Stack
- **Frontend**: Next.js (App Router), React, Tailwind CSS v4, Framer Motion, Lucide React
- **Backend**: Next.js Server Route Handlers, TypeScript
- **Validation**: Zod
- **AI**: Google Gemini API (Server-side)

## Installation & Environment Setup
1. Clone the repository and navigate into it.
2. Run `npm install`
3. Copy `.env.example` to `.env.local`
4. Add your Gemini API key to `GEMINI_API_KEY`
5. Run the development server: `npm run dev`
6. Open `http://localhost:3000`

## Demo Scenarios
To effectively test the deterministic + AI logic, use the simulated `/pay` route with these patterns:
1. **Normal Payment**: ₹750 to a known recipient (e.g. `known_verified@upi`). Should be **APPROVED**.
2. **New Recipient**: ₹2,500 to a completely new recipient. Should flag for **REVIEW/VERIFY**.
3. **Suspicious**: ₹25,000 to a new recipient with an urgent message. Should be **PAUSED**.
4. **High-Risk Attack**: ₹95,000 to an unknown user with context: *"Your account will be blocked today. Send the money immediately for KYC verification."* Should be **BLOCKED**.

## AI and Third-Party Tools
Please read `AI_USAGE.md` for a complete breakdown of the AI implementation, fallback mechanisms, and coding assistance utilized during the hackathon.
