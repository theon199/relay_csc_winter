"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import Link from "next/link";
import {
  Compass,
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  Users,
  CheckCircle2,
  Share2,
  Trash2,
} from "lucide-react";
import { ShiftCard, ShiftWithRelations } from "@/components/shift-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SEED_USERS } from "@/lib/db/seed-data";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function MyShiftsPage() {
  const [currentUserId, setCurrentUserId] = useState<string>("usr_marcus");
  const [currentUserName, setCurrentUserName] = useState<string>("Marcus Vance");

  useEffect(() => {
    fetch("/api/auth/switch-persona")
      .then((res) => res.json())
      .then((data) => {
        if (data.activeUserId) {
          setCurrentUserId(data.activeUserId);
          const found = SEED_USERS.find((u) => u.id === data.activeUserId);
          if (found) setCurrentUserName(found.displayName);
        }
      })
      .catch(() => {});
  }, []);

  const { data, mutate } = useSWR("/api/shifts", fetcher, {
    refreshInterval: 4000,
  });

  const shifts: ShiftWithRelations[] = data?.shifts || [];
  const myClaimedShifts = shifts.filter((s) =>
    s.participants.some((p) => p.userId === currentUserId)
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 flex flex-col">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              My Volunteer Schedule
            </h1>
            <Badge variant="amber" dot>
              {currentUserName}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Track your confirmed micro-shifts, view event locations, and invite friends to join you.
          </p>
        </div>

        <Link href="/">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <Compass className="w-3.5 h-3.5" />
            Discover More Shifts
          </Button>
        </Link>
      </div>

      {!data ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      ) : myClaimedShifts.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-stone-300 bg-white">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-stone-800">
            No shifts claimed yet for {currentUserName}
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1 mb-5">
            You don&apos;t have any upcoming micro-shifts scheduled. Find a 30-120 minute opportunity and invite a friend along!
          </p>
          <Link href="/">
            <Button variant="primary" size="md">
              Find an Opportunity
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {myClaimedShifts.map((shift) => (
            <ShiftCard
              key={shift.id}
              shift={shift}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              onClaimSuccess={() => mutate()}
            />
          ))}
        </div>
      )}
    </div>
  );
}
