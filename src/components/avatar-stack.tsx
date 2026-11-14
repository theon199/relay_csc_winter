import { cn } from "@/lib/utils";

const PALETTE = [
  "bg-emerald-600",
  "bg-amber-500",
  "bg-sky-600",
  "bg-rose-500",
  "bg-violet-600",
  "bg-teal-600",
];

function colorFor(seed: string) {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

function initials(name: string) {
  return name
    .replace(/\./g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export interface AvatarPerson {
  displayName: string;
  avatarSeed: string;
}

/** Overlapping initials avatars. Shows first name + initial only (privacy-preserving). */
export function AvatarStack({
  people,
  max = 4,
  size = "sm",
  className,
}: {
  people: AvatarPerson[];
  max?: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  const dim = size === "md" ? "w-9 h-9 text-xs" : "w-7 h-7 text-[10px]";
  return (
    <div className={cn("flex -space-x-2", className)}>
      {shown.map((p, i) => (
        <span
          key={`${p.avatarSeed}-${i}`}
          title={p.displayName}
          aria-label={p.displayName}
          className={cn(
            "inline-flex items-center justify-center rounded-full ring-2 ring-white font-bold text-white",
            dim,
            colorFor(p.avatarSeed)
          )}
        >
          {initials(p.displayName)}
        </span>
      ))}
      {extra > 0 && (
        <span className={cn("inline-flex items-center justify-center rounded-full ring-2 ring-white bg-stone-200 text-stone-700 font-bold", dim)}>
          +{extra}
        </span>
      )}
    </div>
  );
}
