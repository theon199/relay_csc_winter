"use client";

import { use, useEffect, useState, Suspense } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import {
  Users2,
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AvatarStack } from "@/components/avatar-stack";
import { SEED_USERS } from "@/lib/db/seed-data";

interface InviteData {
  invitation: {
    token: string;
    status: string;
    isExpired: boolean;
  };
  inviter: {
    displayName: string;
    avatarSeed: string;
    userId: string;
  };
  going: { displayName: string; avatarSeed: string; userId: string }[];
  shift: {
    id: string;
    title: string;
    description: string;
    locationType: "in_person" | "remote";
    startAt: string;
    durationMins: number;
    capacity: number;
    spotsRemaining: number;
    isFull: boolean;
    requiredSkills: string[];
    organization?: { name: string } | null;
    hub?: {
      name: string;
      address: string;
      category: string;
    } | null;
  };
}

function InviteContent({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [data, setData] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [viewerId, setViewerId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/switch-persona")
      .then((res) => res.json())
      .then((json) => setViewerId(json.activeUserId ?? null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`/api/invite/${token}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setData(json);
        } else {
          setError(json.error || "Invitation link invalid or expired.");
        }
      })
      .catch(() => {
        setError("Failed to load invitation.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  const handleJoin = async () => {
    if (!data?.shift.id) return;
    setIsJoining(true);
    setJoinError(null);
    try {
      const res = await fetch(`/api/shifts/${data.shift.id}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationToken: token }),
      });
      const result = await res.json();
      if (result.success) {
        setJoined(true);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.5 },
          colors: ["#059669", "#D97706", "#3B82F6"],
        });
        if (typeof window !== "undefined" && "BroadcastChannel" in window) {
          const bc = new BroadcastChannel("relay_shifts");
          bc.postMessage({ type: "SHIFT_CLAIMED", shiftId: data.shift.id });
        }
      } else {
        setJoinError(result.error || "Unable to claim a spot.");
      }
    } catch {
      setJoinError("Network error. Please try again.");
    } finally {
      setIsJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex items-center gap-2 text-stone-500 text-sm font-medium">
          <Sparkles className="w-5 h-5 text-emerald-600 animate-spin" />
          Loading invitation...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 text-center border-stone-200">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-stone-900 mb-2">
            Invitation Expired or Unavailable
          </h2>
          <p className="text-xs text-stone-500 mb-6">
            {error || "This buddy invitation is no longer active or the shift is full."}
          </p>
          <Link href="/">
            <Button variant="primary" size="md" className="w-full">
              Explore Available Shifts
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const { inviter, shift, invitation } = data;
  const viewer = SEED_USERS.find((u) => u.id === viewerId);
  const alreadyGoing = !joined && data.going.some((g) => g.userId === viewerId);
  const isInviter = viewerId === inviter.userId;
  const linkProblem = joined
    ? null
    : invitation.status === "revoked"
    ? `${inviter.displayName} turned off this invite link.`
    : invitation.status === "claimed"
    ? "A friend already joined with this link. Each link works for one person."
    : invitation.isExpired
    ? "This invite link has expired."
    : null;
  const goingNow = joined && viewer
    ? [...data.going, { displayName: viewer.displayName, avatarSeed: viewer.avatarSeed, userId: viewer.id }]
    : data.going;

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-xl w-full">
        {/* Inviter Greeting Banner */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-3">
            <Users2 className="w-4 h-4 text-emerald-600" />
            Buddy Invitation
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            {inviter.displayName} wants you to come along!
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1.5 max-w-md mx-auto">
            Volunteering is easier and more fun together. Join {inviter.displayName} for this quick community micro-shift.
          </p>
        </div>

        {/* Shift Detail Card */}
        <Card className="p-6 sm:p-8 border-stone-200 shadow-lg relative overflow-hidden bg-white">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-1.5">
              {shift.locationType === "in_person" ? (
                <Badge variant="emerald" dot>
                  In-Person Public Hub
                </Badge>
              ) : (
                <Badge variant="blue" dot>
                  Remote Task
                </Badge>
              )}
              <Badge variant="stone">
                <Clock className="w-3 h-3 mr-1 text-stone-400" />
                {shift.durationMins} mins
              </Badge>
            </div>

            <span
              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                shift.isFull && !joined
                  ? "bg-rose-50 text-rose-800 border-rose-200"
                  : "bg-amber-50 text-amber-800 border-amber-300"
              }`}
            >
              {joined
                ? "You & " + inviter.displayName + " are Going!"
                : shift.isFull
                ? "Shift is Full"
                : `${shift.spotsRemaining} of ${shift.capacity} spot${shift.spotsRemaining === 1 ? "" : "s"} left`}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 mb-2">
            {shift.title}
          </h2>
          {shift.organization && (
            <p className="text-xs text-stone-500 -mt-1 mb-3 font-medium">{shift.organization.name}</p>
          )}

          {goingNow.length > 0 && (
            <div className="mb-5 flex items-center gap-2.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 px-3 py-2">
              <AvatarStack people={goingNow} size="md" />
              <p className="text-xs text-emerald-950 font-semibold">
                {goingNow.map((g) => g.displayName).slice(0, 3).join(", ")}
                {goingNow.length > 3 ? ` + ${goingNow.length - 3} more` : ""} {goingNow.length === 1 ? "is" : "are"} going
              </p>
            </div>
          )}
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed mb-6">
            {shift.description}
          </p>

          {/* Logistics Box */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2.5 text-xs text-stone-700 mb-6">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-stone-500 shrink-0" />
              <span className="font-semibold text-stone-900">{shift.startAt}</span>
            </div>

            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-stone-500 shrink-0" />
              {shift.locationType === "in_person" && shift.hub ? (
                <span>
                  <strong className="text-stone-900">{shift.hub.name}</strong> •{" "}
                  <span className="text-stone-500">{shift.hub.address}</span>
                </span>
              ) : (
                <span className="text-stone-600 italic">Remote / Complete from home</span>
              )}
            </div>

            <div className="flex items-center gap-2.5 text-[11px] text-stone-500 pt-1 border-t border-stone-200/50">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              {shift.locationType === "in_person"
                ? "Approved public community venue. No private addresses are ever used."
                : "Remote task. Only your first name and last initial are shown to others."}
            </div>
          </div>

          {/* Action Button */}
          {joined ? (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-1.5" />
                <p className="text-sm font-bold text-emerald-950">
                  You&apos;re going together with {inviter.displayName}! 🎉
                </p>
                <p className="text-xs text-emerald-800/80 mt-0.5">
                  Your spot is saved in Relay. We&apos;ll see you there!
                </p>
              </div>

              <Link href="/my-shifts" className="block">
                <Button variant="primary" size="md" className="w-full">
                  View in My Shifts
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
            </div>
          ) : linkProblem || alreadyGoing || isInviter ? (
            <div className="space-y-3">
              <p className="text-xs text-amber-800 text-center font-medium bg-amber-50 border border-amber-200 rounded-xl p-3">
                {linkProblem ??
                  (isInviter
                    ? "This is your own invite link. Share it with a friend, or switch to another demo persona (top right) to try joining."
                    : "You already have a spot on this shift.")}
              </p>
              <Link href={alreadyGoing || isInviter ? "/my-shifts" : "/"} className="block">
                <Button variant="outline" size="md" className="w-full">
                  {alreadyGoing || isInviter ? "Go to My Shifts" : "Browse Other Open Shifts"}
                </Button>
              </Link>
            </div>
          ) : shift.isFull ? (
            <div className="space-y-3">
              <p className="text-xs text-rose-700 text-center font-medium">
                Sorry, all remaining spots on this shift have already been claimed.
              </p>
              <Link href="/" className="block">
                <Button variant="outline" size="md" className="w-full">
                  Browse Other Open Shifts
                </Button>
              </Link>
            </div>
          ) : (
            <Button
              size="lg"
              variant="primary"
              onClick={handleJoin}
              disabled={isJoining}
              className="w-full text-sm font-bold bg-emerald-700 hover:bg-emerald-800"
            >
              <Sparkles className="w-4 h-4 mr-2 text-amber-300" />
              {isJoining ? "Claiming your spot..." : `Join ${inviter.displayName} & Claim Spot`}
            </Button>
          )}
          {!joined && viewer && !linkProblem && !isInviter && !alreadyGoing && !shift.isFull && (
            <p className="mt-2 text-center text-[10px] text-stone-400">
              Joining as demo persona {viewer.displayName}. Switch personas in the top bar.
            </p>
          )}
          {joinError && (
            <p role="alert" className="mt-3 text-center text-xs font-medium text-rose-700">
              {joinError}
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function InviteLandingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-8 text-stone-500 text-xs">
          Loading invitation...
        </div>
      }
    >
      <InviteContent params={params} />
    </Suspense>
  );
}
