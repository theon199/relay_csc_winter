import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "default"
    | "emerald"
    | "amber"
    | "rose"
    | "blue"
    | "purple"
    | "stone"
    | "outline";
  dot?: boolean;
}

export function Badge({
  className,
  variant = "default",
  dot = false,
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: "bg-stone-100 text-stone-700 border-stone-200",
    emerald: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
    amber: "bg-amber-50 text-amber-800 border-amber-200/80",
    rose: "bg-rose-50 text-rose-800 border-rose-200/80",
    blue: "bg-sky-50 text-sky-800 border-sky-200/80",
    purple: "bg-purple-50 text-purple-800 border-purple-200/80",
    stone: "bg-stone-100 text-stone-600 border-stone-200",
    outline: "bg-transparent text-stone-700 border-stone-300",
  };

  const dotColors = {
    default: "bg-stone-400",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
    blue: "bg-sky-500",
    purple: "bg-purple-500",
    stone: "bg-stone-400",
    outline: "bg-stone-500",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition-colors",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColors[variant])}
        />
      )}
      {children}
    </span>
  );
}
