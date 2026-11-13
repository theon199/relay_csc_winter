# Relay (`relay_csc_winter`)

A community support and connection platform built for the **[CSC Winter Sparkathon](https://csc-winter-sparkathon.devpost.com/)**.

---

## 🎯 Hackathon Theme & Goals
* **Theme:** Build technology that brings people together or helps people support one another.
* **Target Submission:** November 30, 2026.
* **GitHub Repository:** [theon199/relay_csc_winter](https://github.com/theon199/relay_csc_winter)

---

## 🏗️ Architecture & Infrastructure Decisions

### 1. Hosting & Deployment
* **Platform:** Cloudflare Pages (Free Tier)
* **Domain:** Cloudflare free subdomains (`*.pages.dev`) — no custom domain required.
* **Cost:** \$0.00 (Unlimited static requests & bandwidth; 100k Worker requests/day for serverless functions).

### 2. Database
* **Database:** Cloudflare D1 (Serverless SQLite)
* **Tier:** Cloudflare Free Tier
* **Free Allowances:**
  * **Storage:** 5 GB total
  * **Reads:** 5,000,000 rows / day
  * **Writes:** 100,000 rows / day
  * **Backups:** 7-day automated point-in-time recovery
* **Cost:** \$0.00

### 3. AI Backend
* **Provider:** Google Gemini API
* **Configuration:** Configured via `GEMINI_API_KEY` in environment variables / Cloudflare secret bindings when needed.

---

## 💰 Budget Constraint
* **Competition Budget Cap:** **Max \$5.00 USD total spend** for the entire competition.
* All core infrastructure (hosting, database, CDN, SSL) is locked to free tiers; any spend is strictly reserved as an optional buffer for Gemini API usage, capped at \$5.
