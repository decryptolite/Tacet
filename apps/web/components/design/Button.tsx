"use client";

import { forwardRef } from "react";
import { motion } from "framer-motion";
import { ease, duration } from "@/lib/design-tokens";

type Variant = "primary" | "secondary" | "accent";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-ink-1000 text-ink-50 border border-ink-1000 hover:bg-ink-800 hover:border-ink-800",
  secondary:
    "bg-transparent text-ink-1000 border border-ink-200 hover:border-ink-600",
  accent:
    "bg-accent text-ink-1000 border border-accent hover:opacity-90",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", loading, children, className = "", disabled, ...props }, ref) => {
    const isDisabled = disabled || loading;

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: duration.fast, ease: ease.sealed }}
        disabled={isDisabled}
        className={[
          "inline-flex items-center justify-center gap-2",
          "rounded-pill px-[18px] py-[10px] min-h-[44px]",
          "text-[13px] font-sans font-medium",
          "transition-colors",
          `duration-[${duration.standard * 1000}ms]`,
          "ease-sealed",
          "focus-visible:outline-none focus-visible:ring-[1.5px] focus-visible:ring-ink-1000 focus-visible:ring-offset-2",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          "select-none",
          variantClasses[variant],
          className,
        ].join(" ")}
        {...(props as React.ComponentProps<typeof motion.button>)}
      >
        {children}
      </motion.button>
    );
  }
);

Button.displayName = "Button";

export default Button;
