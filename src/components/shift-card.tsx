"use client";

import { useState } from "react";
import {
  MapPin,
  Clock,
  Users,
  CheckCircle2,
  Share2,
  Calendar,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClaimCelebrationModal } from "@/components/claim-celebration-modal";

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
  }>;
  activeInviteToken?: string | null;
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
  const [showCelebration, setShowCelebration] = useState(false);
  const [generatedInviteToken, setGeneratedInviteToken] = useState<string | null>(
    shift.activeInviteToken || null
  );

  const hasClaimed = shift.participants.some((p) => p.userId === currentUserId);
  const hasBuddyPair = shift.participants.length >= 2;

  const handleClaim = async () => {
    setIsClaiming(true);
    try {
      const res = await fetch(`/api/shifts/${shift.id}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedInviteToken(data.invitationToken);
        setShowCelebration(true);
        if (typeof window !== "undefined" && "BroadcastChannel" in window) {
          const bc = new BroadcastChannel("relay_shifts");
          bc.postMessage({ type: "SHIFT_CLAIMED", shiftId: shift.id });
        }
        if (onClaimSuccess) onClaimSuccess();
      } else {
        alert(data.error || "Failed to claim spot.");
      }
    } catch {
      alert("Error claiming spot.");
    } finally {
      setIsClaiming(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel your volunteer spot?")) return;
    setIsCancelling(true);
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
        alert(data.error || "Failed to cancel claim.");
      }
    } catch {
      alert("Error cancelling claim.");
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

        {/* Buddy Pair Tag if multiple volunteers joined */}
        {hasBuddyPair && (
          <div className="my-2.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-50 to-amber-50 border border-emerald-100 text-[11px] text-emerald-950 font-semibold flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              {shift.participants[0]?.displayName} & {shift.participants[1]?.displayName} attending together!
            </span>
            <span className="text-[10px] text-emerald-700 font-bold bg-white px-2 py-0.5 rounded-md border border-emerald-200">
              Buddy Pair 🤝
            </span>
          </div>
        )}

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
                  onClick={() => setShowCelebration(true)}
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
      </Card>

      <ClaimCelebrationModal
        open={showCelebration}
        onOpenChange={setShowCelebration}
        shiftTitle={shift.title}
        invitationToken={generatedInviteToken}
        volunteerName={currentUserName}
      />
    </>
  );
}
