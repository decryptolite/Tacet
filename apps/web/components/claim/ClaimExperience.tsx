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
import { truncate } from "@/lib/design-tokens";

type Phase = "sealed" | "revealing" | "revealed" | "claiming" | "claimed";

/** Surface a clean, human message from a viem/wallet/relayer error — never a raw revert. */
function cleanError(err: unknown, fallback: string): string {
  if (err && typeof err === "object") {
    const e = err as { shortMessage?: string; message?: string };
    if (typeof e.shortMessage === "string" && e.shortMessage) return e.shortMessage;
    if (typeof e.message === "string" && e.message) {
      if (/rejected|denied|user cancel/i.test(e.message))
        return "You rejected the request in your wallet.";
      return e.message.split("\n")[0].slice(0, 140);
    }
  }
  return fallback;
}

export default function ClaimExperience({ data }: { data: ClaimData }) {
  const { campaign, recipient } = data;
  const { address, isConnected } = useAccount();
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
  // Guard only — never gate by mutating handleReveal/handleClaim (see STATE.md).
  const wrongWallet =
    isConnected && !!address && address.toLowerCase() !== recipient.address.toLowerCase();

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
    } catch (err) {
      toast.error(cleanError(err, "Decryption failed. Try again."));
      setPhase("sealed");
    }
  }

  async function handleClaim() {
    setPhase("claiming");
    try {
      const txHash = await claim.mutateAsync(recipient.claimPayload);
      setReceipt({ txHash, claimedAt: Math.floor(Date.now() / 1000) });
      setPhase("claimed");
    } catch (err) {
      toast.error(cleanError(err, "Claim failed. Try again."));
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
          {phase === "claimed" && display === null ? (
            <p className="max-w-prose text-body text-ink-1000">
              This allocation has already been claimed.
            </p>
          ) : phase === "revealing" || phase === "revealed" || phase === "claiming" || (phase === "claimed" && display !== null) ? (
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
          receipt ? (
            <div className="text-center">
              <p className="text-small text-ink-1000">Claimed. Receipt saved.</p>
              <button
                onClick={() => setShowReceipt((v) => !v)}
                className="mt-4 inline-flex min-h-[44px] items-center text-small text-ink-600 underline-offset-4 hover:underline"
              >
                {showReceipt ? "Hide receipt" : "View receipt"}
              </button>
            </div>
          ) : (
            <p className="text-center text-small text-ink-600">
              This allocation has already been claimed.
            </p>
          )
        ) : expired ? (
          <div className="text-center">
            <p className="mb-8 text-small text-ink-600">
              This campaign has expired and can no longer be claimed.
            </p>
            <Button variant="secondary" className="w-full" disabled>
              Campaign expired
            </Button>
          </div>
        ) : phase === "revealed" ? (
          <div>
            <Button variant="accent" className="w-full" onClick={handleClaim} loading={claim.isPending}>
              Claim {display} {campaign.token}
            </Button>
            <p className="mt-8 text-center font-mono text-[10px] leading-relaxed text-ink-400">
              Claiming is an on-chain transaction — you&rsquo;ll need a little Sepolia ETH for gas.
            </p>
          </div>
        ) : phase === "claiming" ? (
          <Button variant="accent" className="w-full" disabled>
            Signing with wallet…
          </Button>
        ) : !isConnected ? (
          <div className="text-center">
            <button
              onClick={() => openConnectModal?.()}
              className="mx-auto block min-h-[44px] font-serif text-[15px] font-bold text-ink-1000 transition-opacity duration-fast ease-sealed hover:opacity-70"
            >
              Connect your wallet →
            </button>
            <p className="mt-4 text-small text-ink-600">
              Connect the wallet this claim was issued to.
            </p>
          </div>
        ) : wrongWallet ? (
          <div className="text-center">
            <p className="mb-8 max-w-prose text-small text-ink-600">
              This claim link was issued to{" "}
              <span className="font-mono text-ink-1000">{truncate(recipient.address)}</span>. Connect
              that wallet to reveal your allocation.
            </p>
            <button
              disabled
              className="mx-auto block min-h-[44px] font-serif text-[15px] font-bold text-ink-1000 opacity-50"
            >
              Reveal my share →
            </button>
          </div>
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
