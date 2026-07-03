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

const STEP_HEADINGS: Record<Step, string> = {
  1: "Choose recipients",
  2: "Set allocations",
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

        {/* Step counter + heading */}
        <div className="mb-12">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[2px] text-ink-400">
            Step {step} of 3
          </p>
          <h1 className="font-serif text-[40px] leading-none text-ink-1000">{STEP_HEADINGS[step]}</h1>
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
