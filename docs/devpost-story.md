# Relay: Devpost submission draft

> Paste into the Devpost "Project Story" fields and edit in your own voice. Fill in the [bracketed] parts. Don't add numbers you didn't measure.

**Tagline:** Find a way to help. Bring someone along.

**Links:** https://relay-csc-winter.vercel.app · https://github.com/theon199/relay_csc_winter

## Inspiration
Two things stop people from helping locally. Organizers, like a pantry coordinator or a club lead, post needs as a rushed text or flyer, and turning that into proper sign-ups takes time they don't have. Volunteers, especially students, often skip opportunities because they're long, formal, or because walking in alone is intimidating. [Add a sentence about your own experience here, if you have one.]

## What it does
Relay goes from "we need help" to "two friends are going together" in a few minutes.
- **AI intake:** an organizer pastes a messy message. Relay splits it into separate **micro-shifts** (30–120 min) with spots, duration, skills and in-person/remote. Missing details are flagged, never made up, and the organizer reviews everything before publishing.
- **Discover:** volunteers filter short in-person or remote tasks on a list and a map of approved public venues.
- **Bring a friend:** every claim creates a personal invite with a **QR code** and **one-tap share**. The friend sees who's going, claims their own spot, and both appear as a buddy pair. Cards show social proof ("Jordan L. brought Sam O. along"), and organizers see who came with whom.

## How we built it
- **Next.js 16 on Vercel** for the app and API routes.
- **Cloudflare Workers + D1** as the data backend. One shared TypeScript service layer holds every rule, so local dev (SQLite) and production (D1) behave the same.
- **Google Gemini** with a strict response schema, plus Zod validation, an 8-second timeout and a clearly labeled fallback, so the demo never breaks.
- **Drizzle ORM** migrations, **Leaflet/OpenStreetMap**, and **qrcode** for invite QR codes.

## Challenges
- **Never overbooking.** "Count then insert" breaks under concurrency. We made a claim a single conditional SQL insert plus a partial unique index, then wrote a smoke test where 5 people race for the last spot. Exactly one wins, every time.
- **Invite links that are social but safe.** Links are single use, expire, can be turned off, can't skip a full shift, and only reveal first name + initial.
- **Trusting AI output.** The model drafts and humans decide. Output is schema-checked and clamped, and venue and role rules are enforced in code.

## Accomplishments
- A full loop — request → reviewed shifts → claim → buddy claim → live organizer view — running on free tiers.
- 35 automated end-to-end checks against the deployed backend.

## What we learned
[Your own reflection: e.g. designing for youth safety first, edge vs serverless trade-offs, prompt design for "don't invent details".]

## What's next
Real organizer verification and authentication, guardian consent for minors, waitlists that refill cancelled spots, reminders, and an organizer-confirmed impact report. [Optional: a pilot with a real club or pantry.]

## Evidence (only if real)
[If you ran a quick test with an organizer or student, report it honestly here, e.g. "1 club organizer: 3 shifts posted in ~X min with Relay vs ~Y min by hand."]

---

## 90-second video script
| Time | Show | Say |
|---|---|---|
| 0–15s | Intake: paste the pantry + translation request, parse | "Organizers ask for help in messy texts. Relay turns one message into separate micro-shifts and flags what's missing instead of guessing." |
| 15–30s | Edit a draft, choose a venue, publish, then show Discover | "The organizer reviews and publishes, and it's live for volunteers right away." |
| 30–50s | As Marcus, claim a spot; confetti; QR modal | "Claiming a spot immediately gives you a personal invite: a QR code or one-tap share." |
| 50–70s | Scan the QR with a phone (or a second window as Priya) and join | "Your friend sees who's going and claims their own spot. Links are single use and can't skip a full shift." |
| 70–90s | Organizer roster: "Came with Marcus V. 🤝", buddy-pair counter | "Organizers see real staffing, and who came together. Volunteering shouldn't mean signing up alone." |

Before recording, use **Judge & Demo Kit → reset** so the counts start at the baseline.
