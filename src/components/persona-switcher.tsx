"use client";

import { useState, useEffect } from "react";
import { SEED_USERS, SeedUser } from "@/lib/db/seed-data";
import { User, Check, ChevronDown, Sparkles } from "lucide-react";

export function PersonaSwitcher() {
  const [activeUser, setActiveUser] = useState<SeedUser>(SEED_USERS[1]); // Default to Marcus
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/switch-persona")
      .then((res) => res.json())
      .then((data) => {
        if (data.activeUserId) {
          const found = SEED_USERS.find((u) => u.id === data.activeUserId);
          if (found) setActiveUser(found);
        }
      })
      .catch(() => {});
  }, []);

  const handleSelect = async (user: SeedUser) => {
    setIsLoading(true);
    try {
      await fetch("/api/auth/switch-persona", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      setActiveUser(user);
      setIsOpen(false);
      // Notify other tabs and reload
      if (typeof window !== "undefined") {
        if ("BroadcastChannel" in window) {
          const bc = new BroadcastChannel("relay_shifts");
          bc.postMessage({ type: "PERSONA_CHANGED", userId: user.id });
        }
        window.location.reload();
      }
    } catch (err) {
      console.error("Failed to switch persona", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "organizer":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "volunteer":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "admin":
        return "bg-purple-100 text-purple-800 border-purple-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-800 text-xs font-medium shadow-sm transition-all"
        title="Switch Demo Persona"
      >
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
          {activeUser.displayName[0]}
        </span>
        <span className="hidden sm:inline font-semibold">{activeUser.displayName}</span>
        <span
          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${getRoleBadge(
            activeUser.role
          )}`}
        >
          {activeUser.role.toUpperCase()}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-stone-200 shadow-xl z-50 p-2 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3 py-2 border-b border-stone-100 mb-1">
              <p className="text-xs font-semibold text-stone-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Demo Persona Switcher
              </p>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Select a preconfigured role to test distinct organizer and volunteer workflows.
              </p>
            </div>

            <div className="space-y-1">
              {SEED_USERS.map((user) => {
                const isSelected = user.id === activeUser.id;
                return (
                  <button
                    key={user.id}
                    onClick={() => handleSelect(user)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between ${
                      isSelected
                        ? "bg-emerald-50 text-emerald-950 font-medium"
                        : "hover:bg-stone-100 text-stone-700"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-stone-900">
                          {user.displayName}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${getRoleBadge(
                            user.role
                          )}`}
                        >
                          {user.role}
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-500 mt-0.5">
                        {user.safeNeighborhood || user.email}
                      </p>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
