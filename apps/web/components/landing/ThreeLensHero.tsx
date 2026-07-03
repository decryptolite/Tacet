"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ThreeLensToggle, { type Lens } from "@/components/design/ThreeLensToggle";
import RedactionBar from "@/components/design/RedactionBar";
import CipherCompanion from "@/components/design/CipherCompanion";
import { ease, duration, truncate } from "@/lib/design-tokens";

const DEMO_HANDLE = "0x9f44a3b7c1d82e5f3a9b0c4e7d1f2a8b3c5d7e9f1a2b3c4d5e6f7a8b9c0d1e2f3";

const LENS_ORDER: Lens[] = ["operator", "recipient", "public"];
const AUTO_CYCLE_MS = 3200;
const RESUME_DELAY_MS = 8000;

const recipients = [
  { handle: "torvalds", commits: 4821, amount: "12,500" },
  { handle: "gvanrossum", commits: 3102, amount: "8,200" },
  { handle: "dhh", commits: 2744, amount: "7,400" },
  { handle: "yyx990803", commits: 2318, amount: "6,300" },
];

const lensConfig = {
  operator: {
    label: "Operator sees all",
    renderAmount: (amount: string) => (
      <span className="font-mono text-code text-ink-1000">{amount}</span>
    ),
  },
  recipient: {
    label: "Recipient sees their share only",
    renderAmount: (amount: string, i: number) =>
      i === 1 ? (
        <span className="font-mono text-code text-ink-1000">{amount}</span>
      ) : (
        <RedactionBar width={60} />
      ),
  },
  public: {
    label: "Public sees ciphertext only",
    renderAmount: () => <RedactionBar width={60} />,
  },
};

export default function ThreeLensHero() {
  const [lens, setLens] = useState<Lens>("operator");
  const pausedUntil = useRef<number>(0);

  useEffect(() => {
    const id = setInterval(() => {
      if (Date.now() < pausedUntil.current) return;
      setLens((prev) => {
        const idx = LENS_ORDER.indexOf(prev);
        return LENS_ORDER[(idx + 1) % LENS_ORDER.length];
      });
    }, AUTO_CYCLE_MS);
    return () => clearInterval(id);
  }, []);

  function handleManualChange(next: Lens) {
    pausedUntil.current = Date.now() + RESUME_DELAY_MS;
    setLens(next);
  }

  const config = lensConfig[lens];

  return (
    <div className="border-0.5 border-ink-200 rounded-card overflow-hidden bg-card">
      {/* Document header */}
      <div className="border-b border-ink-150 px-6 py-3 flex items-center justify-between">
        <span className="font-mono text-[10px] text-ink-300 tracking-[1px]">
          Campaign · {truncate(DEMO_HANDLE)} · 2026.07.04
        </span>
        <ThreeLensToggle active={lens} onChange={handleManualChange} />
      </div>

      {/* Lens label */}
      <div className="px-6 pt-4 pb-2">
        <AnimatePresence mode="wait">
          <motion.span
            key={lens}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration.fast, ease: ease.sealed }}
            className="font-mono text-[9px] text-ink-400 uppercase tracking-[1px]"
          >
            {config.label}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Table */}
      <div className="px-6 pb-6">
        <div className="grid grid-cols-3 gap-4 py-2 border-b border-ink-150 mb-1">
          <span className="font-mono text-[10px] text-ink-250 uppercase tracking-[1px]">Contributor</span>
          <span className="font-mono text-[10px] text-ink-250 uppercase tracking-[1px] text-right">Commits</span>
          <span className="font-mono text-[10px] text-ink-250 uppercase tracking-[1px] text-right">Allocation</span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={lens}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration.standard, ease: ease.sealed }}
          >
            {recipients.map((r, i) => (
              <div
                key={r.handle}
                className="grid grid-cols-3 gap-4 py-3 border-b border-ink-150 last:border-0 items-center"
              >
                <span className="font-mono text-code text-ink-800">@{r.handle}</span>
                <span className="font-mono text-code text-ink-600 text-right">{r.commits.toLocaleString()}</span>
                <span className="flex justify-end">
                  {config.renderAmount(r.amount, i)}
                </span>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>

        {lens === "public" && (
          <div className="mt-4 pt-4 border-t border-ink-150">
            <CipherCompanion handle={DEMO_HANDLE} ambient />
          </div>
        )}
      </div>
    </div>
  );
}
