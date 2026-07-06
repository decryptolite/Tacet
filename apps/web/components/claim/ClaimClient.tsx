"use client";

// Runs the crash-prone work in the browser, never during server render. The
// server route only passes the raw base64url link id; decode, the campaign RPC
// read, and all Zama SDK / FHE work happen here (FHE needs crossOriginIsolated +
// browser WASM, which cannot exist server-side). Any failure resolves to a clean
// "invalid or expired" state rather than throwing the render.

import { useEffect, useState } from "react";
import ClaimHeader from "@/components/claim/ClaimHeader";
import ClaimExperience from "@/components/claim/ClaimExperience";
import ZamaGate from "@/components/shared/ZamaGate";
import { getClaimData, type ClaimData } from "@/lib/campaign";

type State =
  | { status: "loading" }
  | { status: "ready"; data: ClaimData }
  | { status: "invalid" };

export default function ClaimClient({ id }: { id: string }) {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getClaimData(id);
        if (!cancelled) setState({ status: "ready", data });
      } catch {
        if (!cancelled) setState({ status: "invalid" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (state.status === "invalid") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <p className="text-body text-ink-1000">This claim link is invalid or expired.</p>
        <p className="mt-2 max-w-prose text-small text-ink-600">
          Check that you opened the full link exactly as it was shared with you.
        </p>
      </div>
    );
  }

  if (state.status === "loading") return <ClaimSkeleton />;

  return (
    <>
      <ClaimHeader
        airdropAddress={state.data.campaign.airdropAddress}
        createdAt={state.data.campaign.createdAt}
      />
      <ZamaGate>
        <ClaimExperience data={state.data} />
      </ZamaGate>
    </>
  );
}

/** Static skeleton — no spinner, no shimmer (Sealed §Motion). */
function ClaimSkeleton() {
  return (
    <div className="flex flex-1 flex-col animate-fade-in">
      <div className="h-[10px] w-40 rounded-redaction bg-ink-100" />
      <div className="mt-32 flex justify-center">
        <div className="h-[48px] w-[260px] rounded-[4px] bg-ink-100" />
      </div>
      <div className="mt-32 space-y-3">
        <div className="h-[12px] w-full rounded-redaction bg-ink-100" />
        <div className="h-[12px] w-3/4 rounded-redaction bg-ink-100" />
        <div className="h-[12px] w-2/3 rounded-redaction bg-ink-100" />
      </div>
    </div>
  );
}
