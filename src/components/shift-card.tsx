"use client";

import { useState } from "react";
import {
  MapPin,
  Clock,
  Users,
  CheckCircle2,
  Share2,
  Calendar,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClaimCelebrationModal } from "@/components/claim-celebration-modal";
import { AvatarStack } from "@/components/avatar-stack";

/** One line of social proof: who is going, and whether anyone came with a friend. */
function goingTogetherText(shift: ShiftWithRelations, currentUserId: string) {
  const people = shift.participants;
  const pair = people.find((p) => p.invitedBy);
  const others = people.filter((p) => p.userId !== currentUserId);
  if (people.length === 0) return "Be the first to go, and bring a friend";
  if (pair) {
    const rest = people.length - 2;
    return `${pair.invitedBy} brought ${pair.displayName} along${rest > 0 ? ` + ${rest} more` : ""}`;
  }
  if (others.length === 0) return "You're going. Invite a friend to join you";
  const names = others.slice(0, 2).map((p) => p.displayName).join(" & ");
  const extra = others.length - 2;
  return `${names}${extra > 0 ? ` + ${extra} more` : ""} ${others.length === 1 ? "is" : "are"} going${shift.isFull ? "" : ", join them"}`;
}

export interface ShiftWithRelations {
  id: string;
  orgId: string;
  hubId: string | null;
  title: string;
  description: string;
  locationType: "in_person" | "remote";
  startAt: string;
  endAt?: string | null;
  durationMins: number;
  capacity: number;
  status: string;
  requiredSkills: string[];
  hub?: {
    id: string;
    name: string;
    address: string;
    category: string;
    latitude?: number;
    longitude?: number;
  } | null;
  organization?: {
    name: string;
  } | null;
  claimedCount: number;
  spotsRemaining: number;
  isFull: boolean;
  participants: Array<{
    claimId: string;
    userId: string;
    displayName: string;
    avatarSeed: string;
    invitationId?: string | null;
    invitedBy?: string | null;
  }>;
  buddyPairs?: number;
  myInviteToken?: string | null;
}

interface ShiftCardProps {
  shift: ShiftWithRelations;
  currentUserId: string;
  currentUserName: string;
  onClaimSuccess?: () => void;
  onHover?: (hubId: string | null) => void;
}

export function ShiftCard({
  shift,
  currentUserId,
  currentUserName,
  onClaimSuccess,
  onHover,
}: ShiftCardProps) {
  const [isClaiming, setIsClaiming] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [modal, setModal] = useState<"closed" | "celebrate" | "invite">("closed");
  const [error, setError] = useState<string | null>(null);
  // A local token change (claim, revoke, new link) wins until the next list refresh catches up.
  const [tokenOverride, setTokenOverride] = useState<{ base: string | null; token: string | null } | null>(null);
  const baseToken = shift.myInviteToken ?? null;
  const inviteToken = tokenOverride && tokenOverride.base === baseToken ? tokenOverride.token : baseToken;
  const setInviteToken = (token: string | null) => setTokenOverride({ base: baseToken, token });

  const hasClaimed = shift.participants.some((p) => p.userId === currentUserId);
  const hasBuddyPair = (shift.buddyPairs ?? 0) > 0;

  const handleClaim = async () => {
    setIsClaiming(true);
    setError(null);
    try {
      const res = await fetch(`/api/shifts/${shift.id}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) {
        setInviteToken(data.invitationToken);
        setModal("celebrate");
        if (typeof window !== "undefined" && "BroadcastChannel" in window) {
          const bc = new BroadcastChannel("relay_shifts");
          bc.postMessage({ type: "SHIFT_CLAIMED", shiftId: shift.id });
        }
        if (onClaimSuccess) onClaimSuccess();
      } else {
        setError(data.error || "Couldn't claim this spot.");
        if (onClaimSuccess) onClaimSuccess();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsClaiming(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel your volunteer spot?")) return;
    setIsCancelling(true);
    setError(null);
    try {
      const res = await fetch(`/api/shifts/${shift.id}/cancel`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        if (typeof window !== "undefined" && "BroadcastChannel" in window) {
          const bc = new BroadcastChannel("relay_shifts");
          bc.postMessage({ type: "SHIFT_CANCELLED", shiftId: shift.id });
        }
        if (onClaimSuccess) onClaimSuccess();
      } else {
        setError(data.error || "Couldn't cancel your spot.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <>
      <Card
        onMouseEnter={() => onHover && onHover(shift.hubId)}
        onMouseLeave={() => onHover && onHover(null)}
        className={`p-5 transition-all duration-200 border ${
          hasClaimed
            ? "border-emerald-300 bg-emerald-50/20 shadow-sm ring-1 ring-emerald-500/20"
            : "border-stone-200/90 bg-white hover:border-emerald-400 hover:shadow-md"
        }`}
      >
        {/* Top Header Pills */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {shift.locationType === "in_person" ? (
              <Badge variant="emerald" dot>
                In-Person
              </Badge>
            ) : (
              <Badge variant="blue" dot>
                Remote
              </Badge>
            )}

            <Badge variant="stone">
              <Clock className="w-3 h-3 mr-1 text-stone-400" />
              {shift.durationMins} mins
            </Badge>

            {hasClaimed && (
              <Badge variant="emerald" className="font-bold">
                <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                You are Going
              </Badge>
            )}
          </div>

          {/* Spots Remaining Indicator */}
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
              shift.isFull
                ? "bg-stone-100 text-stone-500 border-stone-200"
                : shift.spotsRemaining === 1
                ? "bg-amber-50 text-amber-800 border-amber-300"
                : "bg-emerald-50 text-emerald-800 border-emerald-200"
            }`}
          >
            {shift.isFull
              ? "Full (All spots filled)"
              : `${shift.spotsRemaining} of ${shift.capacity} spots left`}
          </span>
        </div>

        {/* Title & Organization */}
        <div className="mb-2">
          <h3 className="text-base sm:text-lg font-bold text-stone-900 group-hover:text-emerald-800 transition-colors">
            {shift.title}
          </h3>
          <p className="text-xs text-stone-500 mt-0.5 font-medium">
            {shift.organization?.name || "Community Partner"}
          </p>
        </div>

        <p className="text-xs text-stone-600 leading-relaxed mb-4 line-clamp-2">
          {shift.description}
        </p>

        {/* Schedule & Hub Info */}
        <div className="space-y-1.5 py-3 border-t border-stone-100 text-xs text-stone-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span className="font-semibold text-stone-800">{shift.startAt}</span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            {shift.locationType === "in_person" && shift.hub ? (
              <span className="truncate">
                <strong className="text-stone-800">{shift.hub.name}</strong> •{" "}
                <span className="text-stone-500 text-[11px]">{shift.hub.address}</span>
              </span>
            ) : (
              <span className="text-stone-500 italic">
                Remote / Digital Task (Complete from home or school)
              </span>
            )}
          </div>
        </div>

        {/* Going together: social proof */}
        <div
          className={`my-2.5 px-3 py-2 rounded-xl border text-[11px] font-semibold flex items-center justify-between gap-2 ${
            hasBuddyPair
              ? "bg-gradient-to-r from-emerald-50 to-amber-50 border-emerald-100 text-emerald-950"
              : "bg-stone-50 border-stone-100 text-stone-600"
          }`}
        >
          <span className="flex items-center gap-2 min-w-0">
            {shift.participants.length > 0 ? (
              <AvatarStack people={shift.participants} max={4} />
            ) : (
              <Users className="w-4 h-4 text-stone-400 shrink-0" />
            )}
            <span className="truncate">{goingTogetherText(shift, currentUserId)}</span>
          </span>
          {hasBuddyPair && (
            <span className="shrink-0 text-[10px] text-emerald-700 font-bold bg-white px-2 py-0.5 rounded-md border border-emerald-200">
              Going together 🤝
            </span>
          )}
        </div>

        {/* Skills Tags & Card Actions */}
        <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1">
            {shift.requiredSkills.slice(0, 3).map((skill, sIdx) => (
              <span
                key={sIdx}
                className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-stone-100 text-stone-600"
              >
                {skill}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {hasClaimed ? (
              <>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setModal("invite")}
                  className="gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-xs"
                >
                  <Share2 className="w-3.5 h-3.5 text-amber-300" />
                  Bring a Friend
                </Button>
                <button
                  onClick={handleCancel}
                  disabled={isCancelling}
                  className="text-[11px] text-stone-400 hover:text-rose-600 font-semibold px-2 py-1 transition-colors"
                >
                  {isCancelling ? "Cancelling..." : "Cancel"}
                </button>
              </>
            ) : (
              <Button
                size="sm"
                variant={shift.isFull ? "secondary" : "primary"}
                disabled={shift.isFull || isClaiming}
                onClick={handleClaim}
                className="w-full sm:w-auto text-xs"
              >
                {shift.isFull
                  ? "Fully Booked"
                  : isClaiming
                  ? "Claiming..."
                  : "Claim 1 Spot"}
              </Button>
            )}
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-2 text-[11px] font-medium text-rose-700">
            {error}
          </p>
        )}
      </Card>

      <ClaimCelebrationModal
        open={modal !== "closed"}
        onOpenChange={(open) => !open && setModal("closed")}
        celebrate={modal === "celebrate"}
        shiftId={shift.id}
        shiftTitle={shift.title}
        invitationToken={inviteToken}
        onTokenChange={setInviteToken}
        volunteerName={currentUserName}
      />
    </>
  );
}
