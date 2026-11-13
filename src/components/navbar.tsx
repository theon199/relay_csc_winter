"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PersonaSwitcher } from "@/components/persona-switcher";
import { Users2, Sparkles, Compass, ClipboardList, HeartHandshake } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/", label: "Discover", icon: Compass },
    { href: "/intake", label: "AI Intake", icon: Sparkles },
    { href: "/organizer", label: "Organizer Roster", icon: ClipboardList },
    { href: "/my-shifts", label: "My Shifts", icon: HeartHandshake },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-200/80 bg-stone-50/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white shadow-sm shadow-emerald-700/20 group-hover:scale-105 transition-transform">
                <Users2 className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-stone-900 tracking-tight text-lg flex items-center gap-1">
                  Relay
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                </span>
                <p className="text-[10px] text-stone-500 font-medium hidden sm:block">
                  Bring someone along
                </p>
              </div>
            </Link>

            {/* Nav Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive =
                  link.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-white text-emerald-900 shadow-sm border border-stone-200/80"
                        : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/50"
                    }`}
                  >
                    <Icon
                      className={`w-3.5 h-3.5 ${
                        isActive ? "text-emerald-600" : "text-stone-400"
                      }`}
                    />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <PersonaSwitcher />
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="flex md:hidden border-t border-stone-200/60 py-2 gap-1 overflow-x-auto no-scrollbar">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap shrink-0 transition-colors ${
                  isActive
                    ? "bg-emerald-800 text-white"
                    : "text-stone-600 hover:bg-stone-200/60"
                }`}
              >
                <Icon className="w-3 h-3" />
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
