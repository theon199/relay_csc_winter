/**
 * Server-side gateway to Relay data.
 *  - Production (Vercel): RELAY_API_URL points at the Cloudflare Worker that owns D1.
 *  - Local dev: no RELAY_API_URL, so the same service functions run on a local SQLite file.
 */
import { NextResponse } from "next/server";
import * as svc from "./services/relay";
import { RelayError } from "./services/relay";

type Op =
  | { op: "listShifts"; viewerId: string | null }
  | { op: "publishShifts"; userId: string; payload: unknown }
  | { op: "claimShift"; userId: string; shiftId: string; invitationToken?: string | null }
  | { op: "cancelClaim"; userId: string; shiftId: string }
  | { op: "createInvite"; userId: string; shiftId: string }
  | { op: "getInvite"; token: string }
  | { op: "revokeInvite"; userId: string; token: string }
  | { op: "resetDemo" };

type Result<T extends Op["op"]> = Awaited<ReturnType<(typeof svc)[T]>>;

async function runLocal(req: Op): Promise<unknown> {
  const { getLocalDb } = await import("./db/local");
  const db = await getLocalDb();
  switch (req.op) {
    case "listShifts": return svc.listShifts(db, req.viewerId);
    case "publishShifts": return svc.publishShifts(db, req.userId, req.payload);
    case "claimShift": return svc.claimShift(db, req.userId, req.shiftId, req.invitationToken);
    case "cancelClaim": return svc.cancelClaim(db, req.userId, req.shiftId);
    case "createInvite": return svc.createInvite(db, req.userId, req.shiftId);
    case "getInvite": return svc.getInvite(db, req.token);
    case "revokeInvite": return svc.revokeInvite(db, req.userId, req.token);
    case "resetDemo": return svc.resetDemo(db);
  }
}

async function runRemote(baseUrl: string, req: Op): Promise<unknown> {
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/rpc`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(req),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  const body = (await res.json().catch(() => ({}))) as { data?: unknown; error?: string; code?: string };
  if (!res.ok) throw new RelayError(res.status, body.code ?? "UPSTREAM_ERROR", body.error ?? "Relay data service error.");
  return body.data;
}

export async function relay<T extends Op["op"]>(req: Extract<Op, { op: T }>): Promise<Result<T>> {
  const baseUrl = process.env.RELAY_API_URL;
  return (baseUrl ? runRemote(baseUrl, req) : runLocal(req)) as Promise<Result<T>>;
}

/** Converts any thrown error into a JSON response with the right status. */
export function errorResponse(err: unknown, fallback: string) {
  if (err instanceof RelayError) {
    return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
  }
  console.error(fallback, err);
  return NextResponse.json({ error: fallback, code: "INTERNAL" }, { status: 500 });
}
