"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import QRCode from "qrcode";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Copy, Share2, Users, Sparkles, Link2Off, RefreshCw, QrCode } from "lucide-react";

interface ClaimCelebrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shiftId: string;
  shiftTitle: string;
  invitationToken?: string | null;
  volunteerName: string;
  /** True right after a new claim: fires confetti and shows the "Spot confirmed" header. */
  celebrate?: boolean;
  onTokenChange?: (token: string | null) => void;
}

function inviteUrlFor(token: string) {
  return typeof window === "undefined" ? `/invite/${token}` : `${window.location.origin}/invite/${token}`;
}

export function ClaimCelebrationModal({
  open,
  onOpenChange,
  shiftId,
  shiftTitle,
  invitationToken,
  volunteerName,
  celebrate = false,
  onTokenChange,
}: ClaimCelebrationModalProps) {
  const [copied, setCopied] = useState(false);
  const [qrSvg, setQrSvg] = useState<{ token: string; svg: string } | null>(null);
  const [busy, setBusy] = useState<"revoke" | "create" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [canShare] = useState(() => typeof navigator !== "undefined" && typeof navigator.share === "function");

  const inviteUrl = invitationToken ? inviteUrlFor(invitationToken) : "";

  useEffect(() => {
    if (open && celebrate) {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 }, colors: ["#059669", "#D97706", "#10B981", "#F59E0B"] });
    }
  }, [open, celebrate]);

  // Render the QR code for the current link so a friend can scan it from this screen.
  useEffect(() => {
    if (!open || !invitationToken) return;
    let cancelled = false;
    QRCode.toString(inviteUrlFor(invitationToken), { type: "svg", margin: 1, color: { dark: "#064e3b", light: "#ffffff" } })
      .then((svg) => {
        if (!cancelled) setQrSvg({ token: invitationToken, svg });
      })
      .catch(() => {
        if (!cancelled) setQrSvg(null);
      });
    return () => {
      cancelled = true;
    };
  }, [open, invitationToken]);

  const handleCopy = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError("Couldn't copy. Select the link and copy it manually.");
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: `Join me: ${shiftTitle}`,
        text: `I'm volunteering for "${shiftTitle}" on Relay. Want to come with me?`,
        url: inviteUrl,
      });
    } catch {
      // The user closed the share sheet; nothing to do.
    }
  };

  const handleRevoke = async () => {
    if (!invitationToken) return;
    setBusy("revoke");
    setError(null);
    try {
      const res = await fetch(`/api/invite/${invitationToken}/revoke`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onTokenChange?.(null);
    } catch (e) {
      setError((e as Error).message || "Couldn't turn off the link.");
    } finally {
      setBusy(null);
    }
  };

  const handleCreate = async () => {
    setBusy("create");
    setError(null);
    try {
      const res = await fetch(`/api/shifts/${shiftId}/invite`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onTokenChange?.(data.invitationToken);
    } catch (e) {
      setError((e as Error).message || "Couldn't create a new link.");
    } finally {
      setBusy(null);
    }
  };

  const svg = qrSvg && qrSvg.token === invitationToken ? qrSvg.svg : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 mb-2">
          {celebrate ? <Sparkles className="w-6 h-6" /> : <Users className="w-6 h-6" />}
        </div>
        <DialogTitle className="text-center text-xl font-extrabold text-stone-900">
          {celebrate ? `Spot confirmed, ${volunteerName.split(" ")[0]}!` : "Bring a friend"}
        </DialogTitle>
        <DialogDescription className="text-center text-xs text-stone-600 mt-1">
          {celebrate ? "You're scheduled for " : "Invite someone to "}
          <strong className="text-emerald-800">{shiftTitle}</strong>.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 my-2">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/80 to-amber-50/50 border border-emerald-100 text-xs">
          <div className="flex items-center gap-2 mb-1 font-bold text-emerald-950">
            <Users className="w-4 h-4 text-emerald-700" />
            Going together is easier
          </div>
          <p className="text-stone-600 leading-relaxed text-[11px]">
            Your friend scans the code or opens the link, then claims their own spot. Each link works for one friend and
            never gets around a full shift.
          </p>
        </div>

        {invitationToken ? (
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div
              className="w-40 h-40 shrink-0 rounded-2xl border border-stone-200 bg-white p-2 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
              role="img"
              aria-label="QR code for your invite link"
              // The SVG is generated locally by the qrcode library from our own URL.
              dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
            >
              {svg ? null : <QrCode className="w-10 h-10 text-stone-300 animate-pulse" />}
            </div>
            <div className="w-full space-y-2">
              <label htmlFor="invite-url" className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">
                Your buddy link
              </label>
              <input
                id="invite-url"
                type="text"
                readOnly
                value={inviteUrl}
                onFocus={(e) => e.currentTarget.select()}
                className="w-full rounded-xl border border-stone-200 bg-stone-50 text-[11px] text-stone-700 px-2.5 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <div className="flex gap-2">
                {canShare && (
                  <Button size="sm" variant="primary" onClick={handleShare} className="flex-1 text-xs bg-emerald-700 hover:bg-emerald-800">
                    <Share2 className="w-3.5 h-3.5" />
                    Share
                  </Button>
                )}
                <Button size="sm" variant={canShare ? "outline" : "primary"} onClick={handleCopy} className="flex-1 text-xs">
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied!" : "Copy link"}
                </Button>
              </div>
              <button
                onClick={handleRevoke}
                disabled={busy !== null}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-500 hover:text-rose-600 disabled:opacity-50"
              >
                <Link2Off className="w-3 h-3" />
                {busy === "revoke" ? "Turning off..." : "Turn off this link"}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl border border-dashed border-stone-300 text-center space-y-2">
            <p className="text-xs text-stone-600">No active invite link.</p>
            <Button size="sm" variant="primary" onClick={handleCreate} disabled={busy !== null} className="text-xs">
              <RefreshCw className={`w-3.5 h-3.5 ${busy === "create" ? "animate-spin" : ""}`} />
              {busy === "create" ? "Creating..." : "Create a new link"}
            </Button>
          </div>
        )}

        {error && (
          <p role="alert" className="text-[11px] text-rose-700 text-center">
            {error}
          </p>
        )}

        <p className="text-[10px] text-stone-400 text-center">
          Invites show public shift details and your first name + initial only. Links expire after 7 days.
        </p>
      </div>

      <div className="mt-4 flex justify-end">
        <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
          Done
        </Button>
      </div>
    </Dialog>
  );
}
