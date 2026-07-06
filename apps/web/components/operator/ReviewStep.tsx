"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import {
  useCreateAndFundConfidentialAirdropAndGetAddress,
  useSignClaimAuthorization,
  encryptUint64,
} from "@tokenops/sdk/fhe-airdrop/react";
import { useZamaSDK } from "@zama-fhe/react-sdk";
import { sepolia } from "viem/chains";
import type { Address, Hex } from "viem";
import Button from "@/components/design/Button";
import DotLeaderRow from "@/components/design/DotLeaderRow";
import { ease, duration } from "@/lib/design-tokens";
import {
  AIRDROP_CHAIN_ID,
  CTTT_SEPOLIA,
  FACTORY_ADDRESS,
  TOKEN_SYMBOL,
  toRawUnits,
  encodeClaimLinkId,
  toEncryptor,
} from "@/lib/tokenops";

// ERC-7984 operator authorization: setOperator(address operator, uint48 until).
// Called directly via viem because @tokenops/sdk's setOperator helper is only
// reachable through a barrel that pulls @zama-fhe/sdk exports missing in 3.x.
const ERC7984_SET_OPERATOR_ABI = [
  {
    type: "function",
    name: "setOperator",
    stateMutability: "nonpayable",
    inputs: [
      { name: "operator", type: "address" },
      { name: "until", type: "uint48" },
    ],
    outputs: [],
  },
] as const;
import { registerCampaign, REGISTRY_ADDRESS } from "@/lib/registry";
import type { Contributor, Formula } from "@/lib/github";

interface ReviewStepProps {
  contributors: Contributor[];
  selected: Set<string>;
  repoUrl: string;
  budget: number;
  formula: Formula;
  amounts: Record<string, number>;
  onBack: () => void;
}

interface RecipientLink {
  githubHandle: string;
  url: string;
}

const FORMULA_LABELS: Record<Formula, string> = {
  flat: "Flat split",
  weighted: "Weighted by commits",
  manual: "Manual",
};

export default function ReviewStep({ contributors, selected, repoUrl, budget, formula, amounts, onBack }: ReviewStepProps) {
  const { isConnected, address } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient({ chainId: sepolia.id });
  const zamaSDK = useZamaSDK();
  const encryptor = useMemo(() => toEncryptor(zamaSDK.relayer), [zamaSDK]);
  const deploy = useCreateAndFundConfidentialAirdropAndGetAddress({
    encryptor: () => encryptor,
  });
  const signClaim = useSignClaimAuthorization();

  const [sealed, setSealed] = useState(false);
  const [airdropAddress, setAirdropAddress] = useState<Address | null>(null);
  const [recipientLinks, setRecipientLinks] = useState<RecipientLink[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [progress, setProgress] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const active = contributors.filter((c) => selected.has(c.githubHandle));
  const missingAddress = active.filter((c) => !c.address);
  const totalAllocated = Object.values(amounts).reduce((s, v) => s + v, 0);
  const deadline = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
  const deploying = deploy.isPending || signClaim.isPending || progress.length > 0;

  async function handleDeploy() {
    if (!address || !walletClient || !publicClient) { openConnectModal?.(); return; }
    setShowModal(false);

    const userSalt = `0x${Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")}` as Hex;

    let currentStep = "initializing";
    try {
      // FACTORY_ADDRESS mirrors the SDK registry the create hook resolves from, so
      // these two logs — and the create tx's `to` — must all match on the next run.
      console.log("[tacet] setOperator spender (factory):", FACTORY_ADDRESS);
      console.log(`[tacet] create call factory (SDK registry, chain ${AIRDROP_CHAIN_ID}):`, FACTORY_ADDRESS);

      // Fund-on-create pulls CTTT from the maintainer, so the factory must be an
      // ERC-7984 operator first, scoped to the campaign deadline (least privilege).
      currentStep = "authorizing factory as operator";
      setProgress("Authorizing factory to fund — confirm in your wallet…");
      const authHash = await walletClient.writeContract({
        address: CTTT_SEPOLIA,
        abi: ERC7984_SET_OPERATOR_ABI,
        functionName: "setOperator",
        args: [FACTORY_ADDRESS, deadline],
        account: address,
        chain: sepolia,
      });
      await publicClient.waitForTransactionReceipt({ hash: authHash });

      setProgress("Funding pool — confirm the second wallet prompt…");
      currentStep = "deploying pool";
      const { airdrop } = await deploy.mutateAsync({
        params: {
          token: CTTT_SEPOLIA,
          startTimestamp: Math.floor(Date.now() / 1000),
          endTimestamp: deadline,
          canExtendClaimWindow: true,
          admin: address,
        },
        userSalt,
        amount: toRawUnits(totalAllocated),
      });

      if (REGISTRY_ADDRESS !== "0x0000000000000000000000000000000000000000") {
        setProgress("Registering campaign…");
        const repoLabel = repoUrl.replace(/^https?:\/\//, "").replace(/^github\.com\//, "");
        currentStep = "registering campaign";
        await registerCampaign(walletClient, airdrop, `${repoLabel} rewards`, repoUrl, deadline);
      }

      const links: RecipientLink[] = [];
      const recipients = active.filter((c) => c.address);
      for (let i = 0; i < recipients.length; i++) {
        const c = recipients[i];
        const recipientAddress = c.address as Address;
        setProgress(`Signing claim ${i + 1} of ${recipients.length}…`);

        currentStep = `encrypting recipient ${i + 1}`;
        const encryptedInput = await encryptUint64({
          encryptor,
          contractAddress: airdrop,
          userAddress: recipientAddress,
          value: toRawUnits(amounts[c.githubHandle] ?? 0),
        });
        currentStep = `signing claim ${i + 1}`;
        const signature = await signClaim.mutateAsync({
          airdropAddress: airdrop,
          recipient: recipientAddress,
          encryptedAmountHandle: encryptedInput.handle,
        });

        const id = encodeClaimLinkId({
          airdropAddress: airdrop,
          recipientAddress,
          githubHandle: c.githubHandle,
          claimPayload: { encryptedInput, signature },
        });
        links.push({ githubHandle: c.githubHandle, url: `${window.location.origin}/c/${id}` });
      }

      setRecipientLinks(links);
      setAirdropAddress(airdrop);
      setSealed(true);
      toast.success("Campaign sealed and deployed.");
    } catch (err: unknown) {
      const e = err as { shortMessage?: string; message?: string; cause?: unknown };

      // Always log the full error for debugging
      console.error("[tacet] seal failed at step:", currentStep, err);

      // viem exposes shortMessage which is clean and human-readable
      const msg = e?.shortMessage ?? e?.message ?? "Unknown error";

      // Show the real message regardless of length
      toast.error(msg);
    } finally {
      setProgress("");
    }
  }

  function copyLink(githubHandle: string, url: string) {
    navigator.clipboard.writeText(url);
    setCopied(githubHandle);
    toast.success("Link copied");
    setTimeout(() => setCopied((h) => (h === githubHandle ? null : h)), 1800);
  }

  if (sealed) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: duration.standard, ease: ease.sealed }}
        className="text-center py-16 space-y-6"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: duration.standard, ease: ease.sealed, delay: 0.1 }}
          className="inline-block border-2 border-ink-1000 rounded-card px-8 py-3 font-mono text-label text-ink-1000 uppercase tracking-widest"
        >
          Sealed
        </motion.div>
        <p className="font-serif text-h3 text-ink-1000">Campaign deployed.</p>
        {airdropAddress && (
          <p className="font-mono text-code text-ink-400 tabular-nums">
            {airdropAddress.slice(0, 10)}…{airdropAddress.slice(-6)}
          </p>
        )}
        <p className="text-small text-ink-600 max-w-sm mx-auto">
          {recipientLinks.length} recipients can now claim their sealed allocation.
          Each link below is unique to one recipient — share accordingly.
        </p>
        <div className="max-w-sm mx-auto text-left divide-y divide-ink-100 border-t border-b border-ink-100">
          {recipientLinks.map((r) => (
            <div key={r.githubHandle} className="flex items-center justify-between gap-4 py-3">
              <span className="font-mono text-code text-ink-800">@{r.githubHandle}</span>
              <button
                onClick={() => copyLink(r.githubHandle, r.url)}
                className="min-h-[44px] text-small text-ink-600 underline-offset-4 hover:underline"
              >
                {copied === r.githubHandle ? "Link copied" : "Copy link"}
              </button>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      {active.length > 30 && (
        <div className="rounded-card border-0.5 border-amber/40 bg-amber/[0.06] px-4 py-3 text-small text-ink-800">
          This release supports up to 30 recipients per campaign. You have {active.length}.
          Larger campaigns via Merkle-root batching are on the roadmap.
        </div>
      )}

      <div>
        <DotLeaderRow label="Formula" value={FORMULA_LABELS[formula]} />
        <DotLeaderRow label="Recipients" value={`${active.length}`} mono />
        <DotLeaderRow label="Total budget" value={`${budget.toLocaleString()} ${TOKEN_SYMBOL}`} mono />
        <DotLeaderRow label="Total allocated" value={`${totalAllocated.toLocaleString()} ${TOKEN_SYMBOL}`} mono />
      </div>

      <div>
        <div className="grid grid-cols-[1fr_auto] gap-4 py-2 border-b border-ink-200 mb-1">
          <span className="font-mono text-[10px] text-ink-250 uppercase tracking-[1px]">Contributor</span>
          <span className="font-mono text-[10px] text-ink-250 uppercase tracking-[1px] text-right">Allocation ({TOKEN_SYMBOL})</span>
        </div>
        <div className="divide-y divide-ink-100">
          {active.map((c) => (
            <div key={c.githubHandle} className="grid grid-cols-[1fr_auto] gap-4 py-3 items-center">
              <span className="font-mono text-code text-ink-800">
                @{c.githubHandle}
                {!c.address && <span className="ml-2 text-ink-400">no address</span>}
              </span>
              <span className="font-mono text-code text-ink-1000 tabular-nums text-right">
                {(amounts[c.githubHandle] ?? 0).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-small text-ink-400">
        Once deployed, each allocation is encrypted onchain. Only the recipient can decrypt their share.
        Amounts are never visible to the public.
      </p>

      {missingAddress.length > 0 && (
        <p className="text-small text-ink-1000">
          {missingAddress.length} recipient{missingAddress.length === 1 ? "" : "s"} missing a wallet address.
          Go back and upload a CSV with address, github_handle, commits.
        </p>
      )}

      <p className="text-small text-ink-600">
        Sealing requires {2 + active.length} quick signatures — 2 to authorize and fund,
        then 1 gasless authorization per recipient ({active.length} recipients).
        These are signatures, not transactions.
      </p>

      <div className="flex justify-between pt-4 border-t border-ink-100">
        <Button variant="secondary" onClick={onBack} disabled={deploying}>← Allocations</Button>
        <Button
          variant="accent"
          onClick={() => isConnected ? setShowModal(true) : openConnectModal?.()}
          loading={deploying}
          disabled={missingAddress.length > 0}
        >
          {deploying ? (progress || "Sealing…") : "Seal and deploy"}
        </Button>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration.fast, ease: ease.sealed }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink-1000/30 px-4 pb-4 sm:pb-0"
            onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: duration.standard, ease: ease.sealed }}
              className="w-full max-w-sm border-0.5 border-ink-200 rounded-card bg-card p-24"
            >
              <h2 className="font-sans text-h3 text-ink-1000 mb-4">Seal and deploy</h2>
              <p className="text-small text-ink-600 mb-6">
                This will deploy and fund the campaign onchain with {active.length} recipients.
                You will sign one transaction plus one claim authorization per recipient. This cannot be undone.
              </p>
              <DotLeaderRow label="Recipients" value={`${active.length}`} mono />
              <DotLeaderRow label="Total" value={`${totalAllocated.toLocaleString()} ${TOKEN_SYMBOL}`} mono />
              <div className="flex gap-3 mt-8">
                <Button variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button variant="accent" className="flex-1" onClick={handleDeploy}>Confirm</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
