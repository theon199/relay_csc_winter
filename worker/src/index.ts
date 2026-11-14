/**
 * relay-api: Cloudflare Worker that owns the D1 database.
 * The Next.js app on Vercel calls POST /rpc with { op, ...args }; business rules live in
 * src/lib/services/relay.ts and are shared with local development.
 */
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../../src/lib/db/schema";
import * as svc from "../../src/lib/services/relay";
import { RelayError } from "../../src/lib/services/relay";

// The D1 binding type, taken from drizzle so the Worker needs no extra type package.
type D1Database = Parameters<typeof drizzle>[0];

interface Env {
  DB: D1Database;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

type Rpc = Record<string, unknown> & { op?: string };

const str = (v: unknown) => (typeof v === "string" ? v : "");

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/health") {
      const row = (await env.DB.prepare("SELECT COUNT(*) AS shifts FROM shifts").first()) as Record<string, unknown> | null;
      return json({ ok: true, ...row });
    }

    if (request.method !== "POST" || url.pathname !== "/rpc") {
      return json({ error: "Not found", code: "NOT_FOUND" }, 404);
    }

    let req: Rpc;
    try {
      req = (await request.json()) as Rpc;
    } catch {
      return json({ error: "Invalid JSON body", code: "BAD_REQUEST" }, 400);
    }

    const db = drizzle(env.DB, { schema });
    try {
      let data: unknown;
      switch (req.op) {
        case "listShifts":
          data = await svc.listShifts(db, req.viewerId ? str(req.viewerId) : null);
          break;
        case "publishShifts":
          data = await svc.publishShifts(db, str(req.userId), req.payload);
          break;
        case "claimShift":
          data = await svc.claimShift(db, str(req.userId), str(req.shiftId), req.invitationToken ? str(req.invitationToken) : null);
          break;
        case "cancelClaim":
          data = await svc.cancelClaim(db, str(req.userId), str(req.shiftId));
          break;
        case "createInvite":
          data = await svc.createInvite(db, str(req.userId), str(req.shiftId));
          break;
        case "getInvite":
          data = await svc.getInvite(db, str(req.token));
          break;
        case "revokeInvite":
          data = await svc.revokeInvite(db, str(req.userId), str(req.token));
          break;
        case "resetDemo":
          data = await svc.resetDemo(db);
          break;
        default:
          return json({ error: `Unknown op "${req.op}"`, code: "BAD_REQUEST" }, 400);
      }
      return json({ data });
    } catch (err) {
      if (err instanceof RelayError) return json({ error: err.message, code: err.code }, err.status);
      console.error("relay-api error", err);
      return json({ error: "Relay data service error.", code: "INTERNAL" }, 500);
    }
  },
};

export default worker;
