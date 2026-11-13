import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive" | "amber";
  size?: "sm" | "md" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer";

    const variantStyles = {
      primary:
        "bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm shadow-emerald-700/20 border border-emerald-600/30",
      secondary:
        "bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200/80",
      outline:
        "border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 shadow-xs",
      ghost:
        "hover:bg-stone-100 text-stone-700 hover:text-stone-900",
      destructive:
        "bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-600/20 border border-rose-500/30",
      amber:
        "bg-amber-600 hover:bg-amber-700 text-white shadow-sm shadow-amber-600/20 border border-amber-500/30",
    };

    const sizeStyles = {
      sm: "h-8 px-3 text-xs gap-1.5",
      md: "h-10 px-4 text-sm gap-2",
      lg: "h-12 px-6 text-base gap-2.5 rounded-2xl",
      icon: "h-9 w-9 p-0",
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
