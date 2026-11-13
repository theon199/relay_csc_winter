# Relay — Product Concept & MVP Specification

**Document type:** Product requirements and concept specification  
**Status:** Planning baseline (not an implementation plan)  
**Target:** CSC Winter Sparkathon 2026  
**Team:** Solo developer, using AI-assisted development tools  
**Product:** Responsive web application  
**Tagline:** *Find a way to help. Bring someone along.*

> **Purpose of this document:** Define what Relay should do, who it serves, what makes it distinctive, and what constitutes a successful hackathon MVP. Use this specification as the input for a separate technical implementation plan. Technical choices and open questions are distinguished from product requirements.

---

## 1. Executive Summary

**Relay** is a hyper-local micro-volunteering and mutual-aid coordination platform. It turns free-form requests from community organizers into short, actionable volunteer opportunities called **micro-shifts**, then helps volunteers discover and join them—ideally with a friend or a new buddy.

A pantry coordinator should not have to complete a complex posting form to find two helpers. A student should not have to commit to weeks of volunteering or arrive at an unfamiliar event alone. Relay removes both forms of friction:

1. **AI-assisted organizer intake:** An organizer writes or dictates a messy request. Relay extracts individual opportunities, relevant details, and missing information into editable draft micro-shifts.
2. **Fast volunteer discovery:** Volunteers find appropriate short shifts based on time, location, interests, skills, and eligibility.
3. **Social participation:** A volunteer can invite a friend or opt into a group-based experience, making community service less intimidating.
4. **Live coordination:** Organizers and volunteers see accurate availability, claims, and confirmations.

**Central product thesis:** Relay is not merely a volunteering directory with AI. It is a low-friction, social coordination layer that transforms intent to help into shared action.

---

## 2. Problem

### Organizer problems

- Small organizations, clubs, and community coordinators often communicate needs through texts, emails, flyers, or casual messages.
- Translating those requests into structured listings and managing signup counts takes unnecessary time.
- A single message may contain several tasks with different locations, durations, skills, or numbers of volunteers.
- Organizers may lack capacity for dedicated volunteer management software.

### Volunteer problems

- Traditional signups can be too long, formal, or commitment-heavy for students and busy neighbors.
- Finding an opportunity compatible with a short window of free time can be difficult.
- Attending an unfamiliar activity alone can feel intimidating.
- Listings may not clearly distinguish in-person work from remote help.

### Product opportunity

Make it possible to go from **“we need help”** to **“two people are going together”** in a few minutes, without requiring elaborate forms or long-term commitments.

---

## 3. Vision and Differentiation

### Vision

Make volunteering feel as approachable as inviting a friend to an activity, while giving organizers a simple way to coordinate real work.

### Primary differentiators

1. **Unstructured → structured:** Convert a raw, compound community request into multiple manageable opportunities.
2. **Micro-shifts:** Focus on tasks typically completable in **30–120 minutes**, with explicit spots, time, location type, and required skills.
3. **Buddy-first UX:** Make inviting someone or joining others a central part of claiming a shift—not a buried sharing feature.
4. **Youth-aware safety:** Design for student volunteers, public/verified event locations, restrained information disclosure, and organizer oversight.
5. **Hyper-local relevance:** Surface nearby in-person activities while keeping remote opportunities clearly distinguishable.

### What Relay is *not*

- Not a generic social network.
- Not a gig marketplace or payment platform.
- Not a replacement for formal volunteer screening, school approval, or organization-specific safeguarding procedures.
- Not an autonomous system that publishes AI-generated tasks without human review.

---

## 4. Target Users and Roles

| Role | Primary need | MVP capabilities |
| --- | --- | --- |
| **Organizer** (food pantry, school club, library, nonprofit coordinator) | Convert requests into staffed volunteer opportunities | Submit raw requests, review AI drafts, publish, track signups |
| **Volunteer** (student or community member) | Find short, suitable ways to help | Browse, filter, inspect, claim/cancel shifts, invite a friend |
| **Invited friend / buddy** | Join someone they trust | Open secure invite, see shift details, claim a remaining spot |
| **Platform administrator** | Keep sample/public opportunities safe and accurate | Manage approved organizers/hubs and review flagged listings (minimal MVP tooling or seeded configuration) |

**Initial audience:** Local students and community groups, with extra attention to ages 13–18. Deployment with real minors requires additional legal, consent, privacy, and moderation review; the hackathon demo may use fictional profiles.

---

## 5. Core User Journeys

### 5.1 Organizer: from a messy request to published opportunities

1. Organizer signs in or uses a demo organizer account.
2. Organizer enters a free-form message in the **AI Intake** interface (text required for MVP; voice optional).
3. Relay parses the message into **one or more separate draft micro-shifts**.
4. Each draft shows a title, description, location type, location/hub if applicable, proposed time and duration, spots, skills, and missing details.
5. Organizer edits and approves drafts; ambiguous or unknown critical information is **not fabricated**.
6. Organizer publishes approved shifts.
7. Published shifts appear immediately in volunteer discovery, and the organizer sees signup counts.

**Example intake:**

> Need 2 people Saturday from 9–11 AM to sort pantry boxes at the community center, plus someone remote to translate a one-page event flyer into Spanish.

**Expected decomposition:**

- **Shift A:** Sort pantry boxes; in person; Saturday, 9:00–11:00 AM; 120 minutes; 2 spots; associated with a selected/verified community center.
- **Shift B:** Translate an event flyer into Spanish; remote; 1 spot; Spanish/translation skill; **deadline and estimated time are missing and must be supplied or confirmed** before publication.

The LLM should separate independent work items, not invent specific street addresses, times, contacts, or organizer credentials.

### 5.2 Volunteer: find and claim a shift

1. Volunteer lands on the discovery page with visible local opportunities.
2. Volunteer filters by availability, duration, skill, and in-person/remote type.
3. Volunteer opens a shift and sees its task, organizer, verified public hub (if in person), schedule, spots remaining, and any requirements.
4. Volunteer claims one available spot.
5. Relay confirms the claim and updates availability for other users.
6. Volunteer is prompted to **Bring a Friend** or explore optional group participation.

### 5.3 Buddy: invite and join

1. A claimed shift exposes a **Bring a Friend** action.
2. Relay generates a short-lived or revocable invitation link associated with that shift—not a permanent privileged access token.
3. Friend opens the link, signs in if needed, checks eligibility, and claims a separate available spot.
4. Both users receive confirmation. They are **not automatically exposed to each other's personal contact information**.
5. If no spots remain, show a clear full-state; an invitation must not bypass capacity or safety rules.

### 5.4 Organizer: monitor participation

1. Organizer opens a shift dashboard.
2. Available/claimed spots and approved participant counts update in near real time.
3. Organizer can review participants according to role-based permissions and cancel or update a shift with appropriate notifications.
4. Completed shifts can be marked finished for simple impact metrics (demo-safe; avoid presenting unverified hours as formally certified service hours).

---

## 6. MVP Scope and Priorities

### P0 — Must work end to end

- Responsive landing/discovery dashboard with a polished list/card interface.
- Eight clearly labeled realistic **demo opportunities** covering in-person and remote work.
- Organizer free-text AI intake that parses one message into multiple structured drafts.
- Human edit/review/approval before a draft can be published.
- Persistent shifts and capacity-aware signup claims.
- Volunteer shift details and filters for time, location type, and skills.
- **Bring a Friend** invitation flow; invited user can claim a spot if available.
- Live or promptly synchronized spot counts across organizer and volunteer views.
- Explicit demo organizer and volunteer roles; clear success/error/empty/loading states.
- Basic safety policy: approved public locations for youth-oriented in-person tasks, organizer identity/approval state, and prevention of unsafe publication.

### P1 — Strong additions if P0 is complete

- Leaflet/OpenStreetMap map with pins for **in-person** opportunities; remote opportunities displayed in a separate list or clearly marked section.
- Volunteer profile with interests, skills, typical availability, and general area.
- Deterministic relevance ranking or filtering by time, skills, distance, and eligibility.
- Optional opt-in group display using privacy-preserving nicknames/avatars.
- Organizer shift completion workflow and impact dashboard.
- AI safety classification/flagging as **advisory** input to hard rules and organizer approval.
- Notification emails or in-app alerts for accepted shifts and changes.

### P2 — Stretch goals, not needed for the competition demo

- Dictation or voice intake.
- Embedding-based semantic profile matching.
- Natural-language volunteer search.
- Waitlists and automatic replacement for cancellations.
- Recurring micro-shifts and organizer analytics.
- Calendar integrations, push notifications, and multichannel messaging.
- Rich reputation or verified-service-hour certification workflows.

### Explicit non-goals

- Native iOS/Android apps.
- Full direct messaging or chat rooms.
- Payments or donations.
- Complex badges, leaderboards, or social feeds.
- Fully autonomous AI posting, organizer verification, or safeguarding decisions.
- Production-scale trust/safety infrastructure in the hackathon prototype.

---

## 7. Detailed Feature Requirements

### 7.1 AI intake and decomposition

**Input:** Organizer-supplied natural language, optionally describing multiple tasks.  
**Output:** Structured **draft** shifts plus extraction confidence or missing-field indicators.  
**Requirements:**

- Split clearly independent activities into separate tasks.
- Extract title, short description, count of volunteers, task skills, location type, proposed schedule, duration, and any explicit restrictions.
- Distinguish provided information from model inference; do not silently invent critical facts.
- Use strict schema validation on the server; reject or retry malformed outputs.
- Require organizers to resolve missing mandatory information before publication.
- Allow edits to *every* generated field; preserve the original request for review/debugging.
- Handle prompt injection and malicious text as untrusted input.
- Keep volunteer personal data out of third-party LLM requests when possible.

**Illustrative draft schema (design sketch, not a frozen API contract):**

```json
{
  "tasks": [
    {
      "title": "Sort pantry boxes",
      "description": "Help organize and pack pantry boxes.",
      "location_type": "in_person",
      "location_text": "community center",
      "hub_id": null,
      "start_at": null,
      "end_at": null,
      "duration_mins": 120,
      "spots_needed": 2,
      "skills": [],
      "age_restrictions": null,
      "missing_fields": ["date", "verified_hub"]
    },
    {
      "title": "Translate an event flyer into Spanish",
      "description": "Translate a one-page event flyer into Spanish.",
      "location_type": "remote",
      "location_text": null,
      "hub_id": null,
      "start_at": null,
      "end_at": null,
      "duration_mins": null,
      "spots_needed": 1,
      "skills": ["Spanish", "translation"],
      "age_restrictions": null,
      "missing_fields": ["duration_mins", "deadline_or_schedule"]
    }
  ]
}
```

Dates and times are normalized in the application using an explicit event timezone; relative phrases such as “Saturday” must be resolved relative to the organizer's timezone/date and confirmed in the editor. Schema can evolve during technical planning.

### 7.2 Discovery

- Clear distinction between **Nearby** and **Remote**.
- In-person listings present approved venue names and general areas; do not disclose private residential addresses.
- Filters: date/time, duration (30–120 minutes), in-person/remote, skills/interests, open spots.
- Shift cards include title, duration, organizer, venue or remote indicator, schedule, spots remaining, and a primary CTA.
- List view must function without geolocation permission.
- If map is enabled, show **only location-bearing in-person opportunities as map pins**; remote opportunities remain accessible in an adjacent list.

### 7.3 Shift lifecycle

Suggested states: `draft → published → full → completed`; optional `cancelled` state. Availability is derived from actual capacity and active claims, rather than managed through an independent fragile counter.

- Only organizer-approved drafts can publish.
- Signups must be atomic to prevent oversubscription.
- One active claim per user per shift (unless explicitly designed otherwise).
- Cancellation reopens a spot.
- A filled shift remains visible with an appropriate status or is filtered out by the user.
- Completion is an organizer-confirmed event, not proof of certified hours.

### 7.4 Buddy-first participation

- Prominent invitation CTA immediately after a successful claim.
- Invitation includes public-safe shift details and clear eligibility requirements.
- Friend must independently claim a separate spot and accept participation.
- Buddy connection is opt-in. Profiles and participation are private by default.
- A link alone never grants privileged organizer or volunteer account access.
- Invite is revocable/expiring; invalid and full-capacity links show useful explanations.
- MVP can present the buddy relationship inside a shift rather than implementing a general social graph.

### 7.5 Organizer dashboard

- Tabs/sections for drafts, published shifts, and completed/cancelled shifts.
- Each shift shows spots claimed and remaining, schedule, location, and basic safety/approval status.
- Quick editing and cancellation, with participant notifications if notifications are implemented.
- Optional impact metrics: number of completed shifts, unique volunteers, filled spots, and verified-by-organizer participation. Clearly distinguish demo metrics from live impact.

---

## 8. Safety, Trust, and Privacy

Because the intended audience includes minors, **product rules must be enforced through server-side validation and permissions—not just an LLM classifier or UI warning.**

### Minimum safeguards

1. **Organizer controls:** Only approved/verified demo organizers can publish publicly visible opportunities. Real-world verification is an operational process, not a claim the AI can establish.
2. **Approved venues:** For youth-oriented in-person shifts, publication is limited to allowlisted public/community hubs (schools, libraries, approved pantries, etc.); prohibit private residences.
3. **Moderation:** Flag suspicious, illegal, unsafe, adult-only, exploitative, or sensitive requests for human review. Model moderation may assist but cannot be the sole gate.
4. **Visibility:** Volunteer participation and buddy identity are opt-in, role-scoped, and privacy-preserving. Never expose minors' phone numbers, personal emails, or exact home locations.
5. **Consent and eligibility:** Appropriate age requirements, guardian/organizational consent when needed, and clear event instructions must be addressed before any real deployment involving minors.
6. **Access control:** Organizers can manage only their own shifts; volunteers can manage only their own claims; admins have explicit permissions.
7. **Abuse controls:** Rate-limit AI intake, signup, and invite creation; prevent fraudulent capacity changes; allow reporting and manual removal.
8. **Data minimization:** Store only required account, eligibility, and shift details; avoid collecting precise home addresses, personal safety information, or unnecessary biometrics.
9. **Transport / personal safety:** Relay does not promise supervision, background checks, transportation, or personal safety. Show organization-specific instructions and contact pathways.
10. **Demo integrity:** Fictional people, opportunities, and impact counts are plainly labeled as sample data; do not misrepresent seeded activity as real community participation.

**Launch boundary:** The hackathon MVP is a demonstration, not a production-ready service for coordinating minors. A public launch with minors requires a separate legal/privacy/safeguarding review and real organizer verification operations.

---

## 9. Suggested UX / Information Architecture

### Public / volunteer

- **Landing / Discover:** Mission statement, AI-driven opportunity feed, category filters, cards, optional map, visible demo content.
- **Shift detail:** Actionable task description, organizer, schedule, duration, venue/remote status, spots, eligibility, claim action.
- **Claim confirmation:** Success state and prominent **Bring a Friend** CTA.
- **Invitation page:** Shared shift preview, friend signup/claim, full/expired states.
- **My Shifts:** Upcoming, completed, cancelled, and buddy-associated activities.

### Organizer

- **Organizer dashboard:** Drafts, active shifts, claims and remaining capacity.
- **AI Intake:** Single prominent text box, example prompt, parse action, structured draft previews.
- **Draft editor:** Review each extracted shift, fix missing fields, select approved venue, and publish.

### UX principles

- Show the main value proposition without lengthy onboarding.
- Keep the **social/buddy** action more prominent than secondary engagement features.
- Use concise actions: **Find a Shift**, **Create from a Request**, **Claim Spot**, **Bring a Friend**.
- Make errors and missing details recoverable without losing input.
- Design mobile-first but ensure the desktop judge demo is excellent.
- Accessibility: keyboard navigation, high contrast, semantic labels, reduced-motion support, and non-map list discovery.

---

## 10. Data Concepts (Planning-Level)

These are suggested domain entities, **not** a final database schema.

| Entity | Key data / responsibility |
| --- | --- |
| `users` / `profiles` | Account ID, chosen display name, role, optional skills/interests, safe general area, participation visibility preference |
| `organizations` | Name, organizer ownership, approval/verification status |
| `hubs` | Approved public venue, address/map coordinates, allowed status |
| `intake_requests` | Raw submitted text, organizer, created timestamp, parse/review status |
| `shifts` | Organization, title, description, status, timezone-aware schedule/deadline, duration, location type, hub, skill tags, capacity |
| `shift_claims` | Shift, volunteer, status, created/cancelled/completion timestamps; unique active claim protection |
| `invitations` | Shift, inviter, opaque secure token/hashed token, expiry, revocation, optional linked buddy claim |
| `moderation_flags` | Rule/model flags, severity, review status, reviewer decision |

### Relationships and invariants

- One intake request can produce many draft shifts.
- An organizer owns or has permission to operate an organization and its shifts.
- An in-person published youth-facing shift references an approved public hub.
- A shift can have multiple claims but never more active claims than capacity.
- A volunteer can only have one active claim on a given shift.
- An invitation never guarantees an available spot.
- A remote shift does not require geographic coordinates or appear as a physical map pin.

---

## 11. Technical Direction (Suggestions, Not Locked Decisions)

| Area | Proposed technology | Rationale |
| --- | --- | --- |
| App | **Next.js App Router + TypeScript** | Integrated frontend, routes, and server functionality |
| UI | Tailwind CSS + accessible component primitives | Fast polished responsive development |
| Backend/data | **Supabase Postgres** | Relational shift/claim data and convenient hosting features |
| Auth | Supabase Auth | Role-based demo account flow and session management |
| Live updates | Supabase Realtime or reliable refetch | Reflect claims and capacity changes |
| AI parsing | Gemini Flash or Groq-hosted model, selected after evaluation | Low-latency structured extraction |
| Schema | Zod/JSON Schema validation | Verify LLM and API output formats |
| Map | Leaflet + OpenStreetMap tiles | Familiar interactive map without proprietary maps SDK charges; respect tile-provider usage terms |
| Hosting | Vercel or equivalent | Straightforward preview/deployment |

### Engineering principles

- Put AI API keys and sensitive logic on the **server**.
- Use schema-constrained parsing; gracefully handle malformed/model-unavailable responses.
- Enforce signup capacity atomically in the database (transaction or equivalent RPC), not only client-side.
- Enforce ownership/visibility via database row-level security and server-side authorization.
- Prefer deterministic rule-based matching for MVP; embeddings are optional later.
- Provide a deterministic fallback or fixture for AI demo reliability, clearly labeled when used.
- Optimize perceived speed but avoid making an unvalidated **under-two-second** latency guarantee.
- Seed realistic but fictional sample data with a safe reset path for repeated demonstrations.

---

## 12. Matching Approach

### MVP: deterministic eligibility and ranking

**Hard eligibility checks (never overridden by an LLM):**

- Shift is published and has open capacity.
- Volunteer satisfies explicit age/eligibility requirements.
- Volunteer can attend within the required schedule.
- In-person shift is permitted and at an approved venue for youth users.

**Optional ranking factors:**

- Skill overlap.
- Availability overlap.
- Approximate distance to in-person hub, if the user voluntarily supplies a general area.
- Preference for short durations and selected categories.
- Buddy opportunity: whether a friend has joined or the shift allows multiple participants.

**Future improvement:** Semantic matching from natural-language interests and task descriptions. Treat embeddings as supplementary relevance signals, not replacements for hard safety and availability constraints.

---

## 13. Demo Data and Experience

### Seed dataset

At least **8 fictional micro-shifts**, representing multiple kinds of help:

| Example | Location type | Skill / theme |
| --- | --- | --- |
| Pantry box sorting | In person, approved community hub | General help |
| Library book organization | In person, approved library | Organization |
| Park cleanup | In person, approved park/community event | Outdoor service |
| School supply packing | In person, approved school | Logistics |
| Spanish flyer translation | Remote | Spanish, translation |
| Nonprofit event poster | Remote | Graphic design |
| Community survey cleanup | Remote | Spreadsheet/data entry |
| Accessible document formatting | Remote | Document formatting/accessibility |

Use explicitly fictional organizations, volunteer accounts, hub data, and impact figures unless real permission and verification exist.

### Recommended judge demonstration (~90 seconds)

1. **0–20 s:** Enter a compound organizer request and show AI splitting it into multiple draft shifts.
2. **20–35 s:** Review/edit a draft, approve it, and publish; show it appearing in discovery.
3. **35–55 s:** Switch to volunteer role, filter relevant opportunities, and claim a spot.
4. **55–75 s:** Click **Bring a Friend**, open invitation in second demo session, and claim a second spot.
5. **75–90 s:** Show organizer view updating live and summarize how Relay lowers the barrier to helping together.

**Reliability requirement:** This same demonstration must work repeatedly with real persisted state. Provide controlled demo reset and recognizable seeded accounts. Avoid depending on uncontrolled third-party latency for all core actions.

---

## 14. MVP Success Criteria / Acceptance Tests

### Organizer intake

- A compound message with two independent tasks produces two editable draft shifts.
- Missing dates, venues, and deadlines remain explicitly unresolved instead of being invented.
- Malformed AI responses do not create broken or publicly visible records.
- Organizer can correct parsed fields and publish compliant shifts.

### Volunteer discovery and signup

- Newly published in-person shifts become discoverable without redeployment.
- Remote tasks are not incorrectly represented as physical pins.
- Volunteer can claim a remaining slot and see a confirmation.
- Two concurrent claims cannot oversubscribe the last available spot.
- Cancellation frees capacity and updates relevant views.

### Buddy pairing

- Claiming a shift generates a working, revocable/expiring invitation link.
- A second demo user can open the link and claim another available spot.
- An expired link or full shift cannot bypass validation.
- Private volunteer information is not exposed in public previews.

### Trust and permissions

- Youth-facing in-person shifts without an approved hub cannot publish.
- Unapproved organizers cannot bypass posting rules.
- A volunteer cannot edit another volunteer's claim or an organizer's shift.
- AI moderation alone is never treated as verified human safety review.

### Demo quality

- All primary flows work on desktop and mobile viewport sizes.
- There are explicit loading, empty, success, and error states.
- The 90-second narrative is repeatable with sample data and multiple sessions.
- Every fictional record, profile, and impact metric is labeled as demo/sample content.

---

## 15. Competition Positioning

**Core narrative:** “Volunteering shouldn't require a complicated signup or going alone.”

**Problem:** Local requests and potential volunteers fail to connect because coordination takes effort and participation can feel socially intimidating.

**Solution:** Relay turns an organizer's ordinary message into short, actionable tasks and makes bringing a friend the easiest next step.

**Why the technology matters:** LLMs remove structured data-entry work; database-backed coordination and atomic claims manage real capacity; shareable invitations create an observable social outcome.

**Differentiation:** Competing volunteer directories may already offer event listings and shared signup links. Relay should foreground its **AI-driven task decomposition + micro-shift format + buddy-first coordination** as one continuous interaction.

**Evidence to collect if possible:** A small, clearly reported usability test with an organizer or student. Compare time required to create and publish separate opportunities manually versus using the AI intake editor. Do not invent impact statistics or imply actual deployments occurred.

---

## 16. Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| AI misreads requests or invents details | Strict schema, missing-field labels, mandatory human edit/approval |
| Demo map seems empty | Clearly marked fictional seed opportunities and an immediately visible AI intake |
| Friend feature feels like a generic share link | Show the second volunteer claiming, buddy opt-in status, and updated organizer count |
| Capacity race conditions | Database-level atomic claim operation and tests |
| Minors' privacy or safety issues | Approved public hubs, privacy defaults, organizer approval, role-based permissions; no real-world youth launch without further review |
| Third-party AI delays/outage | Timeouts, errors, retry, explicit fallback demo fixture |
| Scope creep for solo development | Deliver P0 completely before map polish, embeddings, or analytics |
| Fake impact claims | Label seeded activities and metrics as demo data |
| Overpromised verified organizers | Clearly distinguish manually approved sample organizers from independently verified real organizations |

---

## 17. Open Product Decisions for the Implementation Plan

These are **not blockers to documenting the idea**, but must be resolved or assigned defaults during technical planning:

1. **Authentication:** Email magic link, OAuth, or preconfigured demo sessions? Is login required for all volunteers?
2. **Publishing approval:** Are demo organizers preapproved, or is a minimal admin approval UI needed?
3. **Scheduling:** Must all shifts have fixed start/end times? Should remote deliverables use a due date instead?
4. **Buddy model:** Invitation-only for MVP, or voluntary group visibility too? Can any volunteer generate more than one invite?
5. **Venue verification:** Seed an allowlist of sample hubs or create a lightweight hub approval editor?
6. **Location privacy:** Approximate neighborhoods/city-level browsing only, or permission-based location ranking?
7. **Map priority:** Include it in P0 or add only once the entire intake → claim → buddy flow is stable?
8. **AI vendor:** Which model performs best on multi-task extraction, structured output reliability, and latency at hackathon scale?
9. **Impact measures:** Which figures count as organizer-confirmed rather than merely claimed?
10. **Demo reset:** Should a developer/admin action restore seeded accounts, shift claims, and invitation links?

---

## 18. Suggested Follow-On Implementation Plan Deliverables

The next document should translate this specification into:

1. Finalized user flows, page inventory, and design system.
2. Definitive data model, enums, indexes, migrations, and row-level-security policies.
3. API and server-action contracts, including schemas and error handling.
4. AI extraction prompt, constrained schema, evaluation cases, and fallback behavior.
5. Shift claim transaction design, invitation token lifecycle, and test cases.
6. Seed data, demo account setup, and demo reset tooling.
7. Prioritized build phases with dependencies, milestones, and objective acceptance criteria.
8. Security/privacy checklist and a clear distinction between demo-ready and launch-ready requirements.
9. Deployment, observability, testing, and 90-second video walkthrough checklist.

**Implementation priority:** Prove the complete sequence **raw request → reviewed micro-shifts → published opportunity → volunteer claim → buddy claim → live organizer update** before adding secondary capabilities.
