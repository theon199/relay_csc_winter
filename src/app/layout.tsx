import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { DemoControlDrawer } from "@/components/demo-control-drawer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Relay — Hyper-Local Micro-Volunteering & Buddy-First Coordination",
  description:
    "Transforming community requests into micro-shifts with AI intake and buddy-first social coordination. Built for the CSC Winter Sparkathon 2026.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#FAF9F6] text-stone-900 selection:bg-emerald-100 selection:text-emerald-900">
        <Suspense fallback={<header className="h-16 w-full border-b border-stone-200 bg-stone-50" />}>
          <Navbar />
        </Suspense>
        <main className="flex-1 flex flex-col">{children}</main>
        <footer className="border-t border-stone-200 py-6 px-4 sm:px-8 text-center text-xs text-stone-500 bg-stone-50">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <p>
              <strong className="text-stone-700">Relay</strong> — Built with Gemini Flash-Lite & Cloudflare D1 for the{" "}
              <a
                href="https://csc-winter-sparkathon.devpost.com/"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-emerald-700"
              >
                CSC Winter Sparkathon 2026
              </a>
              .
            </p>
            <p className="text-[11px] text-stone-400">
              Demo/Sample data only • No real youth contacts collected
            </p>
          </div>
        </footer>
        <DemoControlDrawer />
      </body>
    </html>
  );
}
