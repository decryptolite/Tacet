"use client";

import { useState } from "react";
import Nav from "@/components/shared/Nav";
import ZamaGate from "@/components/shared/ZamaGate";
import RecipientsStep from "@/components/operator/RecipientsStep";
import AllocationsStep from "@/components/operator/AllocationsStep";
import ReviewStep from "@/components/operator/ReviewStep";
import { truncate } from "@/lib/design-tokens";
import type { Contributor, Formula } from "@/lib/github";

type Step = 1 | 2 | 3;

const STEP_LABELS: Record<Step, string> = {
  1: "Recipients",
  2: "Allocations",
  3: "Review and seal",
};

interface ComposerState {
  contributors: Contributor[];
  selected: Set<string>;
  repoUrl: string;
  budget: number;
  formula: Formula;
  amounts: Record<string, number>;
}

const CAMPAIGN_REF = "0x7c2e91b5d6f8a0c5d4e3b29f44a2c1";

export default function ComposerPage() {
  const [step, setStep] = useState<Step>(1);
  const [state, setState] = useState<ComposerState>({
    contributors: [],
    selected: new Set(),
    repoUrl: "",
    budget: 34_400,
    formula: "weighted",
    amounts: {},
  });

  function handleRecipientsNext(contributors: Contributor[], selected: Set<string>, repoUrl: string) {
    setState((s) => ({ ...s, contributors, selected, repoUrl }));
    setStep(2);
  }

  function handleAllocationsNext(budget: number, formula: Formula, amounts: Record<string, number>) {
    setState((s) => ({ ...s, budget, formula, amounts }));
    setStep(3);
  }

  return (
    <>
      <Nav />
      <main id="main" className="max-w-[48rem] mx-auto px-8 md:px-16 py-12">
        {/* Document header — signature move #5 */}
        <div className="flex items-center justify-between doc-header mb-8">
          <span>Campaign · {truncate(CAMPAIGN_REF)}</span>
          <span>{new Date().toISOString().slice(0, 10).replace(/-/g, ".")}</span>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-12 border border-ink-200 rounded-pill overflow-hidden">
          {([1, 2, 3] as Step[]).map((s) => (
            <div
              key={s}
              className={[
                "flex-1 py-2.5 text-center text-small transition-colors",
                step === s
                  ? "bg-ink-1000 text-ink-50 font-medium"
                  : step > s
                  ? "bg-ink-100 text-ink-600"
                  : "bg-ink-50 text-ink-400",
              ].join(" ")}
            >
              {STEP_LABELS[s]}
            </div>
          ))}
        </div>

        {/* Step content — wrapped in ZamaGate: every step touches the relayer
            (steps 1–2 reveal the confidential CTTT balance, step 3 encrypts). */}
        <ZamaGate>
          {step === 1 && (
            <RecipientsStep onNext={handleRecipientsNext} />
          )}
          {step === 2 && (
            <AllocationsStep
              contributors={state.contributors}
              selected={state.selected}
              onBack={() => setStep(1)}
              onNext={handleAllocationsNext}
            />
          )}
          {step === 3 && (
            <ReviewStep
              contributors={state.contributors}
              selected={state.selected}
              repoUrl={state.repoUrl}
              budget={state.budget}
              formula={state.formula}
              amounts={state.amounts}
              onBack={() => setStep(2)}
            />
          )}
        </ZamaGate>
      </main>
    </>
  );
}
