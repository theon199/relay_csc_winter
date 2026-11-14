/* eslint-disable @typescript-eslint/no-explicit-any -- loosely-typed JSON responses in a test script */
/**
 * End-to-end smoke test for Relay's data rules.
 *
 *   pnpm smoke --worker http://127.0.0.1:8787        # Cloudflare Worker (/rpc)
 *   pnpm smoke --next   http://localhost:3000        # Next.js app (/api/*, persona cookie)
 *
 * WARNING: resets the demo data at the start and end.
 */
type Res = { ok: boolean; status: number; code?: string; data: any };

const [mode, base] = [process.argv[2], (process.argv[3] ?? "").replace(/\/$/, "")];
if (!["--worker", "--next"].includes(mode) || !base) {
  console.error("Usage: tsx scripts/smoke.ts --worker|--next <baseUrl>");
  process.exit(2);
}

async function rpc(body: Record<string, unknown>): Promise<Res> {
  const r = await fetch(`${base}/rpc`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const j: any = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, code: j.code, data: j.data ?? j };
}

async function api(path: string, userId: string | null, method = "GET", body?: unknown): Promise<Res> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (userId) headers.cookie = `relay_session_user=${encodeURIComponent(JSON.stringify({ id: userId }))}`;
  const r = await fetch(`${base}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const j: any = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, code: j.code, data: j };
}

const isWorker = mode === "--worker";
const call = {
  reset: () => (isWorker ? rpc({ op: "resetDemo" }) : api("/api/demo/reset", null, "POST")),
  list: (viewerId: string) => (isWorker ? rpc({ op: "listShifts", viewerId }) : api("/api/shifts", viewerId)),
  claim: (userId: string, shiftId: string, invitationToken?: string) =>
    isWorker
      ? rpc({ op: "claimShift", userId, shiftId, invitationToken })
      : api(`/api/shifts/${shiftId}/claim`, userId, "POST", { invitationToken }),
  cancel: (userId: string, shiftId: string) =>
    isWorker ? rpc({ op: "cancelClaim", userId, shiftId }) : api(`/api/shifts/${shiftId}/cancel`, userId, "POST", {}),
  invite: (token: string) => (isWorker ? rpc({ op: "getInvite", token }) : api(`/api/invite/${token}`, null)),
  newInvite: (userId: string, shiftId: string) =>
    isWorker ? rpc({ op: "createInvite", userId, shiftId }) : api(`/api/shifts/${shiftId}/invite`, userId, "POST", {}),
  revoke: (userId: string, token: string) =>
    isWorker ? rpc({ op: "revokeInvite", userId, token }) : api(`/api/invite/${token}/revoke`, userId, "POST", {}),
  publish: (userId: string, payload: unknown) =>
    isWorker ? rpc({ op: "publishShifts", userId, payload }) : api("/api/shifts/publish", userId, "POST", payload),
};

let failures = 0;
function check(name: string, cond: boolean, detail?: unknown) {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : `  ${JSON.stringify(detail)}`}`);
  if (!cond) failures++;
}

const VOLUNTEERS = ["usr_marcus", "usr_priya", "usr_jordan", "usr_sam", "usr_aiko"];

async function main() {
  console.log(`Smoke testing ${mode.slice(2)} at ${base}\n`);

  check("reset demo", (await call.reset()).ok);

  const list = await call.list("usr_marcus");
  check("lists 8 seeded shifts", list.data.shifts?.length === 8, list.data.shifts?.length);
  check("seeded 1 buddy pair", list.data.stats?.buddyPairs === 1, list.data.stats);
  const pantry = list.data.shifts.find((s: any) => s.id === "shift_pantry_sorting");
  check("viewer sees own invite token only", pantry?.myInviteToken === "invite-marcus-pantry", pantry?.myInviteToken);
  check("names are first name + initial", pantry?.participants?.[0]?.displayName === "Marcus V.", pantry?.participants);
  const priyaView = await call.list("usr_priya");
  check(
    "other viewers don't get someone else's invite token",
    priyaView.data.shifts.find((s: any) => s.id === "shift_pantry_sorting")?.myInviteToken === null
  );

  // Race: 5 volunteers, 1 spot.
  const race = await Promise.all(VOLUNTEERS.map((u) => call.claim(u, "shift_spanish_flyer")));
  const winners = race.filter((r) => r.ok).length;
  check("race: exactly 1 of 5 claims wins the last spot", winners === 1, race.map((r) => r.status));
  check("race: losers get CAPACITY_EXCEEDED", race.filter((r) => !r.ok).every((r) => r.code === "CAPACITY_EXCEEDED"), race.map((r) => r.code));

  // Same user double-click.
  const dbl = await Promise.all([call.claim("usr_aiko", "shift_garden_mulching"), call.claim("usr_aiko", "shift_garden_mulching")]);
  check("double claim: exactly 1 succeeds", dbl.filter((r) => r.ok).length === 1, dbl.map((r) => r.status));
  check("double claim: other is ALREADY_CLAIMED", dbl.some((r) => r.code === "ALREADY_CLAIMED"), dbl.map((r) => r.code));

  // Buddy flow.
  const inv = await call.invite("invite-marcus-pantry");
  check("invite preview loads", inv.ok && inv.data.shift?.spotsRemaining === 1, inv.data);
  check("invite preview hides inviter full name", inv.data.inviter?.displayName === "Marcus V.", inv.data.inviter);
  const own = await call.claim("usr_marcus", "shift_pantry_sorting", "invite-marcus-pantry");
  check("can't use your own invite", own.code === "OWN_INVITE" || own.code === "ALREADY_CLAIMED", own.code);
  const buddy = await call.claim("usr_priya", "shift_pantry_sorting", "invite-marcus-pantry");
  check("buddy claims via invite", buddy.ok && buddy.data.joinedWith === "Marcus V.", buddy.data);
  check("buddy gets their own invite link", typeof buddy.data.invitationToken === "string" && buddy.data.invitationToken.length >= 16);
  const reuse = await call.claim("usr_jordan", "shift_pantry_sorting", "invite-marcus-pantry");
  check("used invite can't be reused", reuse.code === "INVITE_USED", reuse.code);
  const full = await call.claim("usr_jordan", "shift_pantry_sorting", buddy.data.invitationToken);
  check("invite can't bypass a full shift", full.code === "CAPACITY_EXCEEDED", full.code);
  const bogus = await call.claim("usr_jordan", "shift_pantry_sorting", "not-a-real-token");
  check("unknown invite token is rejected", bogus.code === "INVITE_NOT_FOUND", bogus.code);

  const pairs = await call.list("usr_marcus");
  check("buddy pair counted", pairs.data.stats?.buddyPairs === 2, pairs.data.stats);

  // Revoke.
  const marcusReading = await call.claim("usr_marcus", "shift_reading_corner");
  check("claim reading corner", marcusReading.ok, marcusReading);
  check("revoke own invite", (await call.revoke("usr_marcus", marcusReading.data.invitationToken)).ok);
  const revoked = await call.claim("usr_jordan", "shift_reading_corner", marcusReading.data.invitationToken);
  check("revoked invite is rejected", revoked.code === "INVITE_REVOKED", revoked.code);
  const fresh = await call.newInvite("usr_marcus", "shift_reading_corner");
  check("new link after revoke", fresh.ok && fresh.data.invitationToken !== marcusReading.data.invitationToken, fresh.data);
  const noClaimInvite = await call.newInvite("usr_sam", "shift_reading_corner");
  check("can't create invite without a claim", noClaimInvite.code === "NO_CLAIM", noClaimInvite.code);
  const notMine = await call.revoke("usr_jordan", buddy.data.invitationToken);
  check("can't revoke someone else's invite", !notMine.ok, notMine.status);

  // Cancel reopens the spot.
  check("cancel claim", (await call.cancel("usr_priya", "shift_pantry_sorting")).ok);
  const reopened = await call.claim("usr_jordan", "shift_pantry_sorting");
  check("cancelled spot can be claimed again", reopened.ok, reopened.code);
  const noClaim = await call.cancel("usr_sam", "shift_reading_corner");
  check("cancel without a claim is 404", noClaim.status === 404, noClaim.status);

  // Publishing rules.
  const draft = { title: "Test shift", description: "Smoke test", locationType: "remote", durationMins: 999, capacity: 0, skills: ["Testing"] };
  const asVolunteer = await call.publish("usr_marcus", { drafts: [draft] });
  check("volunteers can't publish", asVolunteer.status === 403, asVolunteer.status);
  const noHub = await call.publish("usr_elena", { drafts: [{ ...draft, locationType: "in_person", hubId: null }] });
  check("in-person without approved hub is rejected", noHub.code === "HUB_REQUIRED", noHub.code);
  const fakeHub = await call.publish("usr_elena", { drafts: [{ ...draft, locationType: "in_person", hubId: "hub_someones_house" }] });
  check("unknown hub is rejected", fakeHub.code === "HUB_REQUIRED", fakeHub.code);
  const okPub = await call.publish("usr_elena", { drafts: [draft] });
  check("organizer publishes", okPub.ok && okPub.data.shiftIds?.length === 1, okPub.data);
  const after = await call.list("usr_marcus");
  const created = after.data.shifts.find((s: any) => s.id === okPub.data.shiftIds?.[0]);
  check("published shift is discoverable", !!created);
  check("duration and capacity are clamped", created?.durationMins === 240 && created?.capacity === 1, created);

  check("final reset", (await call.reset()).ok);

  console.log(`\n${failures === 0 ? "All checks passed." : `${failures} check(s) failed.`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
