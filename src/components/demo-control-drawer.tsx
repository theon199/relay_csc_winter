"use client";

import { useState } from "react";
import {
  RotateCcw,
  Sparkles,
  ClipboardCopy,
  Check,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Zap,
} from "lucide-react";

export function DemoControlDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const samplePrompts = [
    {
      title: "Pantry Boxes + Spanish Flyer",
      text: "Need 2 people Saturday from 9–11 AM to sort pantry boxes at the community center, plus someone remote to translate a one-page event flyer into Spanish.",
    },
    {
      title: "Park Mulching + Snack Packs",
      text: "Looking for 4 volunteers this Sunday from 1 to 3 PM to spread cedar mulch at Oak Park garden, and 2 people Friday afternoon at Lincoln High to assemble snack packs for students.",
    },
    {
      title: "Library Storybook Corner + Poster",
      text: "Need two student helpers Saturday at 11 AM at Central Library to setup youth reading mats, and one volunteer remote to design our winter gala poster in Canva.",
    },
  ];

  const handleReset = async () => {
    setIsResetting(true);
    setResetMessage(null);
    try {
      const res = await fetch("/api/demo/reset", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setResetMessage("Pristine baseline restored!");
        if (typeof window !== "undefined") {
          if ("BroadcastChannel" in window) {
            const bc = new BroadcastChannel("relay_shifts");
            bc.postMessage({ type: "DB_RESET" });
          }
          setTimeout(() => {
            window.location.reload();
          }, 600);
        }
      } else {
        setResetMessage(data.error || "Reset failed");
      }
    } catch {
      setResetMessage("Failed to reset");
    } finally {
      setIsResetting(false);
      setTimeout(() => setResetMessage(null), 3000);
    }
  };

  const copyPrompt = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-lg hover:shadow-xl transition-all border border-emerald-500/40"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Judge & Demo Kit</span>
          <ChevronUp className="w-3.5 h-3.5 opacity-80" />
        </button>
      ) : (
        <div className="w-80 sm:w-96 rounded-2xl bg-white border border-stone-200 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="px-4 py-3 bg-stone-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <div>
                <p className="text-xs font-bold tracking-wide">Sparkathon Judge & Demo Kit</p>
                <p className="text-[10px] text-stone-400">90-second evaluation tools & reset</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-stone-400 hover:text-white p-1 rounded-lg"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
            {/* 1-Click Reset */}
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-stone-900 flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                  Pristine Demo Reset
                </span>
                {resetMessage && (
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100 px-2 py-0.5 rounded-full">
                    {resetMessage}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-500 mb-2.5">
                Restores the database to 8 realistic sample micro-shifts, 4 approved hubs, and 4 seeded personas.
              </p>
              <button
                onClick={handleReset}
                disabled={isResetting}
                className="w-full py-2 px-3 rounded-lg bg-stone-900 hover:bg-black text-white font-medium text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? "animate-spin" : ""}`} />
                {isResetting ? "Restoring..." : "Reset Database to Pristine Baseline"}
              </button>
            </div>

            {/* Quick-Copy Sample Intake Prompts */}
            <div>
              <p className="font-semibold text-stone-900 mb-2 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Quick-Copy Organizer Prompts (Gemini Intake)
              </p>
              <div className="space-y-1.5">
                {samplePrompts.map((p, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl border border-stone-200 bg-white hover:border-emerald-500/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-stone-800 text-[11px]">{p.title}</span>
                      <button
                        onClick={() => copyPrompt(p.text, idx)}
                        className="flex items-center gap-1 text-[10px] text-emerald-700 hover:text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md"
                      >
                        {copiedIndex === idx ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            Copied
                          </>
                        ) : (
                          <>
                            <ClipboardCopy className="w-3 h-3" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] text-stone-500 line-clamp-2 italic">
                      &ldquo;{p.text}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 90-Second Walkthrough Checklist */}
            <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
              <p className="font-semibold text-emerald-950 mb-1.5 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                Recommended 90s Walkthrough
              </p>
              <ol className="space-y-1 text-[11px] text-emerald-900/80 list-decimal list-inside">
                <li>
                  <span className="font-semibold">0–20s:</span> Switch to Elena, paste sample prompt, click Decompose.
                </li>
                <li>
                  <span className="font-semibold">20–35s:</span> Review & publish approved micro-shifts.
                </li>
                <li>
                  <span className="font-semibold">35–55s:</span> Switch to Marcus, find shift, claim spot.
                </li>
                <li>
                  <span className="font-semibold">55–75s:</span> Click &ldquo;Bring a Friend&rdquo;, open invite in incognito or switch to Priya.
                </li>
                <li>
                  <span className="font-semibold">75–90s:</span> Switch back to Elena, see &ldquo;Marcus & Priya&rdquo; buddy pair roster update live.
                </li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
