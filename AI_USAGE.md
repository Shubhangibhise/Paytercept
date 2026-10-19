# AI and Third-Party Tools Disclosure

## Google Gemini API
Paytercept integrates the Google Gemini API solely for **contextual security reasoning and explanation**.
- **Usage**: Gemini is passed structured, deterministic risk evidence (amount deviations, scam patterns, known recipient signals) alongside the untrusted payment context. It returns a strictly typed JSON assessment (using Zod) outlining identified social engineering threats, explanation of risks, and recommended human verification steps.
- **Safety**: Gemini does NOT execute, authorize, or intercept payments directly. It runs strictly server-side. The underlying **Deterministic Risk Engine** maintains the absolute safety policy baseline. If Gemini fails, times out, or produces unexpected output, the system safely falls back to the deterministic decision without breaking the user flow.

## AI Coding Assistance
During the development of this prototype, AI coding assistants were used to accelerate the development of boilerplate code, styling, and standard Next.js API structures.
- The team architected the strict orchestration flow, risk rules, and fallback mechanisms manually.
- All AI-generated code was actively reviewed, heavily modified, and thoroughly tested by the team.
- The entire project is deeply understood by the contributors and follows the specific Hackathon guidelines.
