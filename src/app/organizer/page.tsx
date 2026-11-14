"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import Link from "next/link";
import {
  Users2,
  Calendar,
  CheckCircle2,
  Sparkles,
  MapPin,
  Clock,
  ShieldCheck,
  Building,
  RotateCcw,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ShiftWithRelations } from "@/components/shift-card";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function OrganizerDashboard() {
  const { data, mutate } = useSWR("/api/shifts", fetcher, {
    refreshInterval: 4000,
  });

  // Listen to BroadcastChannel for live participant sync
  useEffect(() => {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const bc = new BroadcastChannel("relay_shifts");
      bc.onmessage = () => mutate();
      return () => bc.close();
    }
  }, [mutate]);

  const shifts: ShiftWithRelations[] = data?.shifts || [];

  // Metrics
  const totalShifts = shifts.length;
  const totalSpots = shifts.reduce((acc, s) => acc + s.capacity, 0);
  const totalClaimed = shifts.reduce((acc, s) => acc + s.claimedCount, 0);
  const totalHours = Math.round(
    shifts.reduce((acc, s) => acc + (s.durationMins / 60) * s.claimedCount, 0) * 10
  ) / 10;
  // A buddy pair = a volunteer who joined through a friend's invite link.
  const buddyPairsCount: number = data?.stats?.buddyPairs ?? shifts.reduce((n, s) => n + (s.buddyPairs ?? 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 flex flex-col">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              Organizer Operations & Roster
            </h1>
            <Badge variant="emerald" dot>
              Live Sync
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Track micro-shift volunteer staffing, confirm attendance, and monitor buddy-first community participation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/intake">
            <Button variant="primary" size="sm" className="gap-1.5 bg-emerald-700 hover:bg-emerald-800">
              <Plus className="w-3.5 h-3.5" />
              New AI Shift Intake
            </Button>
          </Link>
        </div>
      </div>

      {/* Impact & Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-4 border-stone-200 bg-white shadow-xs">
          <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wide">
            Published Shifts
          </p>
          <p className="text-2xl font-black text-stone-900 mt-1">{totalShifts}</p>
          <p className="text-[10px] text-stone-400 mt-0.5">Active opportunities</p>
        </Card>

        <Card className="p-4 border-stone-200 bg-white shadow-xs">
          <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wide">
            Staffed Spots
          </p>
          <p className="text-2xl font-black text-emerald-700 mt-1">
            {totalClaimed}{" "}
            <span className="text-xs font-semibold text-stone-400">/ {totalSpots}</span>
          </p>
          <p className="text-[10px] text-stone-400 mt-0.5">
            {totalSpots > 0 ? Math.round((totalClaimed / totalSpots) * 100) : 0}% capacity filled
          </p>
        </Card>

        <Card className="p-4 border-stone-200 bg-white shadow-xs">
          <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wide">
            Buddy Pairs
          </p>
          <p className="text-2xl font-black text-amber-600 mt-1">{buddyPairsCount}</p>
          <p className="text-[10px] text-stone-400 mt-0.5">Friends volunteering together</p>
        </Card>

        <Card className="p-4 border-stone-200 bg-white shadow-xs">
          <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wide">
            Coordinated Hours
          </p>
          <p className="text-2xl font-black text-purple-700 mt-1">{totalHours} hrs</p>
          <p className="text-[10px] text-stone-400 mt-0.5">Community service time</p>
        </Card>
      </div>

      {/* Live Shifts & Attendee Rosters */}
      <div className="space-y-6">
        <h2 className="text-base font-bold text-stone-900 tracking-tight flex items-center gap-2">
          <Users2 className="w-4 h-4 text-emerald-600" />
          Shift Rosters & Active Attendees ({shifts.length})
        </h2>

        {!data ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
        ) : (
          shifts.map((shift) => {
            const isFull = shift.spotsRemaining === 0;
            return (
              <Card
                key={shift.id}
                className="p-5 sm:p-6 border-stone-200 bg-white shadow-xs hover:border-emerald-300 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-bold text-base text-stone-900">
                        {shift.title}
                      </span>
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
                    </div>

                    <div className="flex items-center gap-2 text-xs text-stone-500">
                      <Calendar className="w-3.5 h-3.5 text-stone-400" />
                      <span>{shift.startAt}</span>
                      {shift.hub && (
                        <>
                          <span>•</span>
                          <MapPin className="w-3.5 h-3.5 text-stone-400" />
                          <span>{shift.hub.name}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full border ${
                        isFull
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                          : "bg-amber-50 text-amber-800 border-amber-300"
                      }`}
                    >
                      {shift.claimedCount} of {shift.capacity} Filled
                    </span>
                  </div>
                </div>

                {/* Participant Roster Table */}
                <div className="border border-stone-100 rounded-xl overflow-hidden bg-stone-50/50">
                  <div className="px-4 py-2 border-b border-stone-100 bg-stone-100/50 flex items-center justify-between text-[11px] font-bold text-stone-600 uppercase tracking-wide">
                    <span>Confirmed Volunteers</span>
                    <span>Status & Pairing</span>
                  </div>

                  {shift.participants.length === 0 ? (
                    <div className="p-4 text-center text-xs text-stone-400 italic">
                      No volunteers have claimed spots yet. Link is active in community discovery.
                    </div>
                  ) : (
                    <div className="divide-y divide-stone-100">
                      {shift.participants.map((p, pIdx) => {
                        return (
                          <div
                            key={p.claimId}
                            className="px-4 py-2.5 flex items-center justify-between text-xs hover:bg-white transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                                {p.displayName[0]}
                              </span>
                              <div>
                                <span className="font-semibold text-stone-800">
                                  {p.displayName}
                                </span>
                                <span className="text-[10px] text-stone-400 ml-2">
                                  Claim #{pIdx + 1}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {p.invitedBy ? (
                                <Badge variant="emerald" className="text-[10px]">
                                  Came with {p.invitedBy} 🤝
                                </Badge>
                              ) : shift.participants.some((o) => o.invitedBy && o.invitedBy === p.displayName) ? (
                                <Badge variant="amber" className="text-[10px]">
                                  Brought a friend
                                </Badge>
                              ) : (
                                <Badge variant="stone" className="text-[10px]">
                                  Signed up solo
                                </Badge>
                              )}
                              <Badge variant="emerald" dot className="text-[10px]">
                                Confirmed
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
