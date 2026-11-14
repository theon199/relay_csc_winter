# Relay

**Find a way to help. Bring someone along.**

Relay turns a community organizer's messy message into short volunteer **micro-shifts** (30–120 min), and makes **bringing a friend** the natural next step after claiming one.

Built for the [CSC Winter Sparkathon](https://csc-winter-sparkathon.devpost.com/) (theme: technology that brings people together).

- **Live demo:** https://relay-csc-winter.vercel.app
- **Data API (Cloudflare Worker):** https://relay-api.kumonai-staff.workers.dev/health

> All organizations, people, venues and counts are fictional sample data.

---

## Try it in 90 seconds (judge demo)

1. **Organizer intake.** Open **AI Intake**, use the example request (or write your own), and click parse. One message becomes several draft micro-shifts, and missing details are flagged instead of invented.
2. **Review and publish.** Edit a draft, pick an approved public venue for in-person tasks, and publish. The shift appears in **Discover** right away.
3. **Claim a spot.** Switch to the volunteer **Marcus Vance** (persona menu, top right) and claim a shift.
4. **Bring a friend.** The confirmation shows a **QR code**, a **Share** button (native share sheet on phones) and a copyable link. Scan it with your phone, or open it in a second window and switch to **Priya Patel**, then claim the second spot.
5. **Watch it update.** The **Organizer Roster** shows "Came with Marcus V. 🤝", the buddy-pair counter goes up, and Discover shows "Marcus V. brought Priya P. along".

**Reset:** open **Judge & Demo Kit** (bottom right) and choose reset to restore the original sample data.

---

## What makes it different

| | |
|---|---|
| **Unstructured → structured** | Gemini splits one compound request into separate tasks with a strict schema. Every field is editable, and nothing is published without human review. |
| **Micro-shifts** | Short, concrete tasks with explicit spots, duration, venue or "remote". |
| **Buddy-first** | Every claim creates a personal, single-use invite link with a QR code and Web Share. Cards show who's going together, as social proof that makes showing up less intimidating. |
| **Youth-aware safety** | In-person shifts must use an approved public venue. Names are first name + initial everywhere. Invite links expire, can be turned off, and never get around a full shift. |

---

## Architecture

```
Browser ──▶ Vercel: Next.js 16 app (UI, /api routes, demo persona cookie, Gemini intake)
                │  RELAY_API_URL  (server-to-server fetch, POST /rpc)
                ▼
         Cloudflare Worker "relay-api" ──▶ Cloudflare D1 "relay-db" (SQLite)
```

- **`src/lib/services/relay.ts`** holds every business rule (claims, invites, publishing, reset). The same code runs in the Worker on D1 in production and on a local SQLite file in development.
- **`worker/`** is the Cloudflare Worker (`wrangler.jsonc` binds D1).
- **`src/lib/data-client.ts`** sends Next.js API routes to the Worker when `RELAY_API_URL` is set, and to local SQLite otherwise.
- **`drizzle/`** contains SQL migrations shared by D1 and local dev.

### Correctness guarantees
- **No overbooking.** A claim is a single conditional `INSERT … SELECT … WHERE active_claims < capacity`, so concurrent claims can't exceed capacity. A partial unique index enforces one active claim per volunteer per shift.
- **Invites.** Random 128-bit tokens, single use, 7-day expiry, revocable, and rejected for the wrong shift, your own link, or a full shift. The shift list only returns *your own* invite token.
- **Validation.** Publish payloads and Gemini output are checked with Zod and clamped (15–240 min, 1–50 spots). Hubs must exist and be approved in the database.
- **AI resilience.** 8-second timeout, then a deterministic fixture that the UI clearly labels "Demo Fixture".

`scripts/smoke.ts` runs 35 end-to-end checks, including a 5-way race for the last spot (exactly one wins). It works against the Worker or the Next.js app.

---

## Responsible AI

- The organizer's text is treated as untrusted data. The prompt tells the model to ignore embedded instructions, and the output is schema-validated.
- The model is told never to invent addresses, phone numbers or times. Gaps go into `missingFields` and are shown to the organizer.
- AI only drafts. A human approves and publishes, and server-side rules (approved venues, roles, capacity) are enforced in code, not by the model.
- No volunteer data is sent to the model. Only the organizer's request text is.

## Safety and privacy (demo scope)
- Demo personas replace real authentication (a cookie selects a fictional user). The Worker checks every user id against the database and enforces roles: only organizers publish, and volunteers manage only their own claims and links. A real launch would need real auth, organizer verification, guardian consent for minors, and moderation review.
- No private addresses; in-person tasks are limited to allowlisted public hubs.

---

## Run locally

```bash
corepack pnpm install
corepack pnpm dev            # http://localhost:3000, uses .data/relay-dev.db (auto-migrated and seeded)
```

Optional: add `GEMINI_API_KEY=...` to `.env.local` for live AI intake. Without it, intake uses the labeled demo fixture.

Test the rules end to end:

```bash
corepack pnpm smoke --next http://localhost:3000
```

### Worker and D1

```bash
corepack pnpm db:migrate:local && corepack pnpm worker:dev   # local Worker on :8787
corepack pnpm smoke --worker http://127.0.0.1:8787
corepack pnpm db:migrate:remote && corepack pnpm worker:deploy
```

### Deployment settings (Vercel)
| Variable | Value |
|---|---|
| `RELAY_API_URL` | `https://relay-api.kumonai-staff.workers.dev` |
| `GEMINI_MODEL` | `gemini-3.5-flash-lite` (change if your key uses a different model) |
| `GEMINI_API_KEY` | *your key (add it in Vercel → Settings → Environment Variables, then redeploy)* |

## Cost
Everything runs on free tiers (Vercel Hobby, Workers, D1). The only possible spend is Gemini usage, capped at $5 for the competition.

## Tech
Next.js 16 · React 19 · Tailwind CSS 4 · Drizzle ORM · Cloudflare Workers + D1 · Google Gemini · Zod · Leaflet/OpenStreetMap · qrcode
