"use client";

import { motion } from "framer-motion";
import { ease, duration } from "@/lib/design-tokens";

export type Lens = "operator" | "recipient" | "public";

interface ThreeLensToggleProps {
  active: Lens;
  onChange: (lens: Lens) => void;
}

const lenses: { id: Lens; label: string }[] = [
  { id: "operator", label: "Operator" },
  { id: "recipient", label: "Recipient" },
  { id: "public", label: "Public" },
];

/**
 * Persistent lens selector — shows the same campaign through three views.
 * Brand element: used anywhere the three-perspective story matters.
 */
export default function ThreeLensToggle({ active, onChange }: ThreeLensToggleProps) {
  return (
    <div
      role="tablist"
      aria-label="View lens"
      className="inline-flex items-center border border-ink-200 rounded-pill p-0.5 bg-ink-100 gap-0.5"
    >
      {lenses.map((lens) => (
        <button
          key={lens.id}
          role="tab"
          aria-selected={active === lens.id}
          onClick={() => onChange(lens.id)}
          className={[
            "relative px-4 py-1.5 rounded-pill text-[13px] font-medium transition-colors",
            "focus-visible:outline-none focus-visible:ring-[1.5px] focus-visible:ring-ink-1000 focus-visible:ring-offset-1",
            active === lens.id ? "text-ink-50" : "text-ink-600 hover:text-ink-1000",
          ].join(" ")}
          style={{ transitionDuration: `${duration.standard * 1000}ms` }}
        >
          {active === lens.id && (
            <motion.span
              layoutId="lens-pill"
              className="absolute inset-0 bg-ink-1000 rounded-pill"
              transition={{ duration: duration.standard, ease: ease.sealed }}
            />
          )}
          <span className="relative z-10">{lens.label}</span>
        </button>
      ))}
    </div>
  );
}
