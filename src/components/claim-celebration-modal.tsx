"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Copy, Share2, Users, Sparkles, Heart } from "lucide-react";

interface ClaimCelebrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shiftTitle: string;
  invitationToken?: string | null;
  volunteerName: string;
}

export function ClaimCelebrationModal({
  open,
  onOpenChange,
  shiftTitle,
  invitationToken,
  volunteerName,
}: ClaimCelebrationModalProps) {
  const [copied, setCopied] = useState(false);
  const [inviteUrl, setInviteUrl] = useState("");

  useEffect(() => {
    if (open) {
      // Fire confetti burst
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#059669", "#D97706", "#10B981", "#F59E0B"],
      });

      if (typeof window !== "undefined" && invitationToken) {
        setInviteUrl(`${window.location.origin}/invite/${invitationToken}`);
      }
    }
  }, [open, invitationToken]);

  const handleCopy = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 mb-2">
          <Sparkles className="w-6 h-6" />
        </div>
        <DialogTitle className="text-center text-xl font-extrabold text-stone-900">
          Spot Confirmed, {volunteerName}!
        </DialogTitle>
        <DialogDescription className="text-center text-xs text-stone-600 mt-1">
          You are scheduled for{" "}
          <strong className="text-emerald-800">{shiftTitle}</strong>.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 my-2">
        {/* Buddy Encouragement Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/80 to-amber-50/50 border border-emerald-100 text-stone-800 text-xs">
          <div className="flex items-center gap-2 mb-1.5 font-bold text-emerald-950">
            <Users className="w-4 h-4 text-emerald-700" />
            Bring Someone Along!
          </div>
          <p className="text-stone-600 leading-relaxed text-[11px]">
            Arriving with a friend makes community service twice as memorable. Share your private buddy link below so they can claim an available spot with you.
          </p>
        </div>

        {/* Copyable Invitation Link */}
        {invitationToken && (
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">
              Your Shareable Buddy Link
            </label>
            <div className="flex items-center gap-2 p-1.5 rounded-xl border border-stone-200 bg-stone-50">
              <input
                type="text"
                readOnly
                value={inviteUrl}
                className="w-full bg-transparent text-xs text-stone-700 px-2 focus:outline-none select-all font-mono"
              />
              <Button
                size="sm"
                variant="primary"
                onClick={handleCopy}
                className="shrink-0 text-xs px-3 bg-emerald-700 hover:bg-emerald-800"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy Link
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Privacy Note */}
        <p className="text-[10px] text-stone-400 text-center italic">
          * Invitations share public shift details only; personal contact info is never disclosed.
        </p>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onOpenChange(false)}
          className="w-full sm:w-auto"
        >
          Done
        </Button>
      </div>
    </Dialog>
  );
}
