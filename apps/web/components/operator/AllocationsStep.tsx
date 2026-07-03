"use client";

import { useState, useMemo } from "react";
import Button from "@/components/design/Button";
import FaucetPanel from "@/components/operator/FaucetPanel";
import { computeAllocations, type Contributor, type Formula } from "@/lib/github";

interface AllocationsStepProps {
  contributors: Contributor[];
  selected: Set<string>;
  onBack: () => void;
  onNext: (budget: number, formula: Formula, amounts: Record<string, number>) => void;
}

const FORMULAS: { id: Formula; label: string; description: string }[] = [
  { id: "flat", label: "Flat split", description: "Equal share for each recipient" },
  { id: "weighted", label: "Weighted by commits", description: "Proportional to commit count" },
  { id: "manual", label: "Manual", description: "Set each amount individually" },
];

export default function AllocationsStep({ contributors, selected, onBack, onNext }: AllocationsStepProps) {
  const [budget, setBudget] = useState(34_400);
  const [formula, setFormula] = useState<Formula>("weighted");
  const [manualAmounts, setManualAmounts] = useState<Record<string, number>>({});

  const active = useMemo(
    () => contributors.filter((c) => selected.has(c.githubHandle)),
    [contributors, selected]
  );

  const amounts = useMemo(
    () => computeAllocations(active, selected, budget, formula, manualAmounts),
    [active, selected, budget, formula, manualAmounts]
  );

  const totalAllocated = Object.values(amounts).reduce((s, v) => s + v, 0);
  const remainder = budget - totalAllocated;

  function handleManualChange(handle: string, value: string) {
    const num = parseInt(value.replace(/,/g, ""), 10);
    setManualAmounts((prev) => ({ ...prev, [handle]: isNaN(num) ? 0 : num }));
  }

  const canProceed = active.length > 0 && (formula !== "manual" || totalAllocated > 0);

  return (
    <div className="space-y-8">
      <FaucetPanel requiredAmount={budget} />

      {/* Budget */}
      <div>
        <label htmlFor="budget" className="block text-label text-ink-600 mb-2 uppercase tracking-wider">
          Total budget (cUSDT)
        </label>
        <div className="flex items-center gap-4">
          <input
            id="budget"
            type="range"
            min={1000}
            max={100_000}
            step={100}
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="flex-1 accent-ink-1000"
          />
          <span className="font-mono text-h3 text-ink-1000 tabular-nums w-24 text-right">
            {budget.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Formula picker */}
      <div>
        <p className="text-label text-ink-600 mb-3 uppercase tracking-wider">Formula</p>
        <div className="grid grid-cols-3 gap-3">
          {FORMULAS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFormula(f.id)}
              className={[
                "text-left p-4 border rounded-card transition-colors",
                formula === f.id
                  ? "border-ink-1000 bg-ink-100/60"
                  : "border-ink-200 hover:border-ink-600",
              ].join(" ")}
            >
              <div className="text-small font-medium text-ink-1000 mb-1">{f.label}</div>
              <div className="text-code font-mono text-ink-400">{f.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Allocation table */}
      <div>
        <div className="grid grid-cols-[1fr_auto_auto] gap-4 py-2 border-b border-ink-200 mb-1">
          <span className="font-mono text-[10px] text-ink-250 uppercase tracking-[1px]">Contributor</span>
          <span className="font-mono text-[10px] text-ink-250 uppercase tracking-[1px] text-right">Commits</span>
          <span className="font-mono text-[10px] text-ink-250 uppercase tracking-[1px] text-right">Allocation (cUSDT)</span>
        </div>

        <div className="divide-y divide-ink-100">
          {active.map((c) => (
            <div key={c.githubHandle} className="grid grid-cols-[1fr_auto_auto] gap-4 py-3 items-center">
              <span className="font-mono text-code text-ink-800">@{c.githubHandle}</span>
              <span className="font-mono text-code text-ink-600 text-right tabular-nums">
                {c.commits.toLocaleString()}
              </span>
              {formula === "manual" ? (
                <input
                  type="text"
                  value={manualAmounts[c.githubHandle] ?? ""}
                  onChange={(e) => handleManualChange(c.githubHandle, e.target.value)}
                  placeholder="0"
                  className="w-28 border border-ink-200 rounded-input px-3 py-1.5 font-mono text-code text-ink-1000 text-right focus:outline-none focus:border-ink-1000 bg-ink-50"
                />
              ) : (
                <span className="font-mono text-code text-ink-1000 tabular-nums text-right w-28">
                  {(amounts[c.githubHandle] ?? 0).toLocaleString()}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="mt-4 pt-4 border-t border-ink-200 grid grid-cols-[1fr_auto] gap-4">
          <span className="text-small text-ink-600">Total allocated</span>
          <span className="font-mono text-code text-ink-1000 tabular-nums text-right">
            {totalAllocated.toLocaleString()} cUSDT
          </span>
          {formula === "manual" && remainder !== 0 && (
            <>
              <span className="text-small text-ink-600">
                {remainder > 0 ? "Unallocated" : "Over budget"}
              </span>
              <span className={["font-mono text-code tabular-nums text-right", remainder < 0 ? "text-state-error" : "text-ink-400"].join(" ")}>
                {Math.abs(remainder).toLocaleString()} cUSDT
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t border-ink-100">
        <Button variant="secondary" onClick={onBack}>← Recipients</Button>
        <Button variant="primary" onClick={() => onNext(budget, formula, amounts)} disabled={!canProceed}>
          Review and seal →
        </Button>
      </div>
    </div>
  );
}
