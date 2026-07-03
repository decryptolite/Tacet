"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useClaim, useGetClaimAmount } from "@tokenops/sdk/fhe-airdrop/react";
import { useZamaSDK } from "@zama-fhe/react-sdk";
import Button from "@/components/design/Button";
import RevealSequence from "@/components/design/RevealSequence";
import RedactionBar from "@/components/design/RedactionBar";
import ClaimStatus from "@/components/claim/ClaimStatus";
import ClaimReceipt from "@/components/claim/ClaimReceipt";
import { formatAmount, type ClaimData } from "@/lib/campaign";
import { TOKEN_DECIMALS } from "@/lib/tokenops";

type Phase = "sealed" | "revealing" | "revealed" | "claiming" | "claimed";

export default function ClaimExperience({ data }: { data: ClaimData }) {
  const { campaign, recipient } = data;
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const claim = useClaim({ address: campaign.airdropAddress });
  const getClaimAmount = useGetClaimAmount({ address: campaign.airdropAddress });
  const sdk = useZamaSDK();

  const [phase, setPhase] = useState<Phase>(recipient.claimed ? "claimed" : "sealed");
  const [amount, setAmount] = useState<number | null>(null);
  const [receipt, setReceipt] = useState<{ txHash: string; claimedAt: number } | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const expired = campaign.deadline * 1000 < Date.now() && phase !== "claimed";
  const display = amount !== null ? formatAmount(amount) : null;

  async function handleReveal() {
    if (!isConnected) return openConnectModal?.();
    setPhase("revealing");
    try {
      // Grant ACL (gas tx), then decrypt the granted handle to this wallet only.
      const { handle } = await getClaimAmount.mutateAsync(recipient.claimPayload);
      const cleartext = await sdk.decryption.decryptValues([
        { encryptedValue: handle, contractAddress: campaign.airdropAddress },
      ]);
      const raw = Number(cleartext[handle]);
      setAmount(raw / 10 ** TOKEN_DECIMALS);
      setPhase("revealed");
    } catch {
      toast.error("Decryption failed. Try again.");
      setPhase("sealed");
    }
  }

  async function handleClaim() {
    setPhase("claiming");
    try {
      const txHash = await claim.mutateAsync(recipient.claimPayload);
      setReceipt({ txHash, claimedAt: Math.floor(Date.now() / 1000) });
      setPhase("claimed");
    } catch {
      toast.error("Wallet rejected the signature.");
      setPhase("revealed");
    }
  }

  const status =
    phase === "claimed" ? (
      "Claimed"
    ) : expired ? (
      <span className="text-state-error">Expired</span>
    ) : phase === "revealed" || phase === "claiming" ? (
      <span className="text-state-claimable">Claimable</span>
    ) : (
      "Sealed"
    );

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col justify-center text-center">
        {phase === "sealed" && (
          <div className="mb-24 flex flex-col items-center gap-16">
            <span className="rounded-pill border border-ink-200 px-3 py-1 font-mono text-[9px] uppercase tracking-[1px] text-ink-400">
              Pending claim
            </span>
            <p className="max-w-prose text-body text-ink-600">
              You have a sealed allocation from{" "}
              <span className="text-ink-1000">{campaign.maintainer}</span>.
            </p>
          </div>
        )}

        {phase === "sealed" && (
          <p className="mb-8 font-mono text-[10px] uppercase tracking-[1px] text-ink-400">
            Your allocation
          </p>
        )}

        <div className="flex min-h-[140px] items-center justify-center">
          {phase === "revealing" || phase === "revealed" || phase === "claiming" || (phase === "claimed" && display !== null) ? (
            <RevealSequence handle={recipient.encryptedAmountHandle} decryptedValue={display} />
          ) : (
            <RedactionBar width="100%" height={48} cipher className="max-w-[260px]" />
          )}
        </div>

        <ClaimStatus campaign={campaign} status={status} />

        {showReceipt && receipt && display && (
          <div className="mt-24 text-left">
            <ClaimReceipt
              campaign={campaign}
              amount={display}
              txHash={receipt.txHash}
              claimedAt={receipt.claimedAt}
            />
          </div>
        )}
      </div>

      <div className="sticky bottom-0 -mx-24 mt-32 border-t border-ink-100 bg-ink-50/95 px-24 py-16 backdrop-blur-sm">
        {phase === "claimed" ? (
          <div className="text-center">
            <p className="text-small text-ink-1000">Claimed. Receipt saved.</p>
            <button
              onClick={() => setShowReceipt((v) => !v)}
              className="mt-4 inline-flex min-h-[44px] items-center text-small text-ink-600 underline-offset-4 hover:underline"
            >
              {showReceipt ? "Hide receipt" : "View receipt"}
            </button>
          </div>
        ) : expired ? (
          <Button variant="secondary" className="w-full" disabled>
            Campaign expired
          </Button>
        ) : phase === "revealed" ? (
          <Button variant="accent" className="w-full" onClick={handleClaim} loading={claim.isPending}>
            Claim {display} {campaign.token}
          </Button>
        ) : phase === "claiming" ? (
          <Button variant="accent" className="w-full" disabled>
            Signing with wallet…
          </Button>
        ) : (
          // Sealed reveal CTA — serif ink text on the card, never a filled button.
          <button
            onClick={handleReveal}
            disabled={phase === "revealing"}
            className="mx-auto block min-h-[44px] font-serif text-[15px] font-bold text-ink-1000 transition-opacity duration-fast ease-sealed hover:opacity-70 disabled:opacity-50"
          >
            {phase === "revealing" ? "Decrypting to your wallet…" : "Reveal my share →"}
          </button>
        )}
      </div>
    </div>
  );
}
