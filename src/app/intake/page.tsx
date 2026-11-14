"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  MapPin,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Layers,
  Send,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SEED_HUBS } from "@/lib/db/seed-data";
import type { DecomposedTask } from "@/lib/ai/fallback-fixtures";

interface EditableDraft {
  id: string;
  title: string;
  description: string;
  locationType: "in_person" | "remote";
  hubId: string;
  durationMins: number;
  capacity: number;
  startAt: string;
  skills: string[];
  missingFields: string[];
}

export default function IntakeStudioPage() {
  const router = useRouter();
  const [inputText, setInputText] = useState(
    "Need 2 people Saturday from 9–11 AM to sort pantry boxes at the community center, plus someone remote to translate a one-page event flyer into Spanish."
  );
  const [isDecomposing, setIsDecomposing] = useState(false);
  const [drafts, setDrafts] = useState<EditableDraft[]>([]);
  const [modelLabel, setModelLabel] = useState<string | null>(null);
  const [usedFallback, setUsedFallback] = useState<boolean | null>(null);
  const [publishStatus, setPublishStatus] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  const samplePrompts = [
    {
      label: "Pantry + Spanish Flyer",
      text: "Need 2 people Saturday from 9–11 AM to sort pantry boxes at the community center, plus someone remote to translate a one-page event flyer into Spanish.",
    },
    {
      label: "Garden Mulching + Snack Bags",
      text: "Looking for 4 volunteers this Sunday from 1 to 3 PM to spread cedar mulch at Oak Park garden, and 2 people Friday afternoon at Lincoln High to assemble snack packs for students.",
    },
    {
      label: "Library Corner + Poster Design",
      text: "Need two student helpers Saturday at 11 AM at Central Library to setup youth reading mats, and one volunteer remote to design our winter gala poster in Canva.",
    },
  ];

  const handleDecompose = async () => {
    if (!inputText.trim()) return;
    setIsDecomposing(true);
    setPublishStatus(null);
    try {
      const res = await fetch("/api/intake/decompose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
      });
      const data = await res.json();
      if (data.tasks) {
        setModelLabel(data.model);
        setUsedFallback(Boolean(data.isFallback));
        const mapped: EditableDraft[] = data.tasks.map(
          (t: DecomposedTask, index: number) => ({
            id: `draft_${Date.now()}_${index}`,
            title: t.title || "Volunteer Activity",
            description: t.description || "",
            locationType: t.locationType || "in_person",
            hubId: t.locationType === "in_person" ? "hub_pantry" : "",
            durationMins: t.suggestedDurationMins || 60,
            capacity: t.spotsNeeded || 2,
            startAt: t.suggestedSchedule || "Saturday Morning",
            skills: t.skills || ["General Help"],
            missingFields: t.missingFields || [],
          })
        );
        setDrafts(mapped);
      }
    } catch (err) {
      console.error("Decomposition failed", err);
    } finally {
      setIsDecomposing(false);
    }
  };

  const updateDraft = (id: string, updates: Partial<EditableDraft>) => {
    setDrafts((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const updated = { ...d, ...updates };
        // If hub is chosen for in-person, resolve missing verified_hub warning
        if (updated.locationType === "in_person" && updated.hubId) {
          updated.missingFields = updated.missingFields.filter(
            (f) => f !== "verified_hub"
          );
        }
        return updated;
      })
    );
  };

  const removeDraft = (id: string) => {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  };

  const handlePublishAll = async () => {
    if (drafts.length === 0) return;
    setIsPublishing(true);
    setPublishStatus(null);
    try {
      const res = await fetch("/api/shifts/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drafts }),
      });
      const data = await res.json();
      if (data.success) {
        setPublishStatus(`Success! Published ${data.publishedCount} micro-shift(s).`);
        if (typeof window !== "undefined" && "BroadcastChannel" in window) {
          const bc = new BroadcastChannel("relay_shifts");
          bc.postMessage({ type: "SHIFT_PUBLISHED" });
        }
        setTimeout(() => {
          router.push("/");
        }, 1200);
      } else {
        setPublishStatus(data.error || "Failed to publish");
      }
    } catch {
      setPublishStatus("Error publishing shifts");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 flex flex-col">
      {/* Studio Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              AI Intake Studio
            </h1>
            {usedFallback === null ? (
              <Badge variant="emerald" dot>
                Powered by Gemini
              </Badge>
            ) : usedFallback ? (
              <Badge variant="amber" dot>
                Demo fixture (AI offline)
              </Badge>
            ) : (
              <Badge variant="emerald" dot>
                Live Gemini
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Dictate or paste a messy community organizer request. Relay decomposes it into structured, editable micro-shifts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="stone">
            <Building className="w-3 h-3 mr-1 text-stone-500" />
            Organizer Mode (Elena)
          </Badge>
        </div>
      </div>

      {/* Split-Screen Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
        {/* Left Column: Natural Language Input & Sample Presets */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <Card className="flex-1 flex flex-col p-5 shadow-xs border-stone-200">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-stone-900 tracking-wide uppercase">
                Raw Organizer Request
              </label>
              <span className="text-[11px] text-stone-400">Natural Language</span>
            </div>

            {/* Quick Sample Presets */}
            <div className="mb-3">
              <p className="text-[11px] text-stone-500 font-medium mb-1.5">
                Load Sparkathon Sample Prompt:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {samplePrompts.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setInputText(p.text)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 text-stone-700 transition-colors border border-stone-200/60"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={8}
              className="w-full flex-1 p-3.5 rounded-xl border border-stone-200 bg-stone-50/50 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all resize-none"
              placeholder="e.g. Need two volunteers Saturday 9 AM to pack food boxes at the pantry and one remote helper to translate the flyer into Spanish..."
            />

            <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between gap-3">
              <p className="text-[11px] text-stone-400">
                Splits tasks • Flags missing fields • Never hallucinates addresses
              </p>
              <Button
                onClick={handleDecompose}
                disabled={isDecomposing || !inputText.trim()}
                className="shrink-0"
              >
                <Sparkles className={`w-4 h-4 text-amber-300 ${isDecomposing ? "animate-spin" : ""}`} />
                {isDecomposing ? "Decomposing..." : "Decompose with AI"}
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Column: Live Draft Cards & Edit Review */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-stone-900 tracking-wide uppercase flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-600" />
                Structured Draft Micro-Shifts ({drafts.length})
              </h2>
              {modelLabel && (
                <span className="text-[10px] text-stone-400 hidden sm:inline">
                  via {modelLabel}
                </span>
              )}
            </div>

            {drafts.length > 0 && (
              <Button
                variant="primary"
                size="sm"
                onClick={handlePublishAll}
                disabled={isPublishing}
                className="gap-1.5 bg-emerald-700 hover:bg-emerald-800"
              >
                <Send className="w-3.5 h-3.5" />
                {isPublishing ? "Publishing..." : "Publish Approved Shifts"}
              </Button>
            )}
          </div>

          {publishStatus && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              {publishStatus}
            </div>
          )}

          {drafts.length === 0 ? (
            <Card className="flex-1 flex flex-col items-center justify-center p-12 text-center border-dashed border-stone-300 bg-stone-50/50">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100/60 text-emerald-700 flex items-center justify-center mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-stone-800">
                Ready for decomposition
              </h3>
              <p className="text-xs text-stone-500 max-w-sm mt-1">
                Enter your request on the left or select a sample prompt, then click &ldquo;Decompose with AI&rdquo; to extract clean micro-shifts.
              </p>
            </Card>
          ) : (
            <div className="space-y-4 overflow-y-auto">
              {drafts.map((draft, idx) => (
                <Card
                  key={draft.id}
                  className="p-5 border-stone-200/90 shadow-xs hover:border-emerald-300 transition-all relative group"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-stone-100 text-stone-700 text-xs font-bold">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={draft.title}
                        onChange={(e) =>
                          updateDraft(draft.id, { title: e.target.value })
                        }
                        className="text-base font-bold text-stone-900 border-b border-transparent hover:border-stone-300 focus:border-emerald-600 focus:outline-none px-1 py-0.5 rounded transition-all w-64 sm:w-80"
                        placeholder="Shift Title"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={draft.locationType}
                        onChange={(e) =>
                          updateDraft(draft.id, {
                            locationType: e.target.value as "in_person" | "remote",
                          })
                        }
                        className="text-xs font-semibold px-2 py-1 rounded-lg border border-stone-200 bg-stone-50 text-stone-700 focus:outline-none"
                      >
                        <option value="in_person">In-Person</option>
                        <option value="remote">Remote</option>
                      </select>

                      <button
                        onClick={() => removeDraft(draft.id)}
                        className="text-stone-400 hover:text-rose-600 p-1 rounded-md transition-colors"
                        title="Remove Draft"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <textarea
                    value={draft.description}
                    onChange={(e) =>
                      updateDraft(draft.id, { description: e.target.value })
                    }
                    rows={2}
                    className="w-full text-xs text-stone-600 border border-stone-200 rounded-lg p-2.5 bg-stone-50/30 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 mb-3"
                    placeholder="Short task description..."
                  />

                  {/* Metadata Editor Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3 pt-2 border-t border-stone-100">
                    <div>
                      <label className="text-[10px] font-bold text-stone-500 uppercase flex items-center gap-1 mb-1">
                        <Clock className="w-3 h-3 text-stone-400" />
                        Duration (mins)
                      </label>
                      <input
                        type="number"
                        value={draft.durationMins}
                        onChange={(e) =>
                          updateDraft(draft.id, {
                            durationMins: Number(e.target.value),
                          })
                        }
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-stone-200 bg-stone-50"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-stone-500 uppercase flex items-center gap-1 mb-1">
                        <Users className="w-3 h-3 text-stone-400" />
                        Spots Needed
                      </label>
                      <input
                        type="number"
                        value={draft.capacity}
                        onChange={(e) =>
                          updateDraft(draft.id, {
                            capacity: Number(e.target.value),
                          })
                        }
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-stone-200 bg-stone-50"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-stone-500 uppercase flex items-center gap-1 mb-1">
                        <MapPin className="w-3 h-3 text-stone-400" />
                        {draft.locationType === "in_person"
                          ? "Approved Public Hub"
                          : "Location Mode"}
                      </label>
                      {draft.locationType === "in_person" ? (
                        <select
                          value={draft.hubId}
                          onChange={(e) =>
                            updateDraft(draft.id, { hubId: e.target.value })
                          }
                          className="w-full text-xs px-2 py-1.5 rounded-lg border border-stone-200 bg-stone-50 truncate"
                        >
                          <option value="">Select an Approved Hub...</option>
                          {SEED_HUBS.map((h) => (
                            <option key={h.id} value={h.id}>
                              {h.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="text-xs px-2.5 py-1.5 rounded-lg bg-stone-100 text-stone-600 font-medium">
                          Remote / Online
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Missing Fields Warning Badge (Anti-Hallucination Indicator) */}
                  {draft.missingFields.length > 0 && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] mb-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>
                        <strong className="font-semibold">Review needed:</strong>{" "}
                        {draft.missingFields.join(", ")}
                      </span>
                    </div>
                  )}

                  {/* Skill Badges */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {draft.skills.map((s, sIdx) => (
                      <Badge key={sIdx} variant="stone">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </Card>
              ))}

              <div className="pt-2 flex justify-end">
                <Button
                  onClick={handlePublishAll}
                  disabled={isPublishing}
                  className="w-full sm:w-auto"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isPublishing
                    ? "Publishing Shifts..."
                    : `Publish ${drafts.length} Approved Micro-Shift(s)`}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
