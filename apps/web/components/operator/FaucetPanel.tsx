"use client";

// Faucet nudge for the allocation step. Two visible states, both keyed off the
// operator's confidential CTTT balance:
//   1. Zero balance (readable gaslessly) — mint nudge.
//   2. Non-zero but below the campaign budget — insufficient warning.
// The panel retires itself once the balance covers the budget. Deciding #2 needs
// the plaintext figure, so a non-zero handle is user-decrypted once — one
// EIP-712 signature, the same seal/reveal move as the claim flow; a zero handle
// never needs it, and with no budget to check (requiredAmount 0) the reveal is
// skipped entirely. Pulls from Sealed §Typography (Geist Mono label + number,
// Geist Sans notice) and the single amber accent for the one action.

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useZamaSDK } from "@zama-fhe/react-sdk";
import { sepolia } from "viem/chains";
import type { Hex } from "viem";
import { TestnetFaucetClient, FaucetSupplyExhaustedError } from "@tokenops/sdk/testnet-faucet";
import { CTTT_SEPOLIA, TOKEN_DECIMALS } from "@/lib/tokenops";

const MINT_AMOUNT = BigInt(500) * BigInt(10) ** BigInt(TOKEN_DECIMALS);

interface FaucetPanelProps {
  /** Whole-CTTT budget the balance must cover; 0 disables the below-budget warning. */
  requiredAmount?: number;
}

export default function FaucetPanel({ requiredAmount = 0 }: FaucetPanelProps) {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const publicClient = usePublicClient({ chainId: sepolia.id });
  const { data: walletClient } = useWalletClient();
  const sdk = useZamaSDK();

  const faucet = useMemo(
    () => (publicClient ? new TestnetFaucetClient({ publicClient, walletClient: walletClient ?? undefined }) : null),
    [publicClient, walletClient]
  );

  const [handle, setHandle] = useState<Hex | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [revealing, setRevealing] = useState(false);
  const [minting, setMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHandle = useCallback(async (): Promise<Hex | null> => {
    if (!faucet || !address) {
      setHandle(null);
      return null;
    }
    try {
      const h = await faucet.confidentialBalanceOf(address);
      setHandle(h);
      return h;
    } catch {
      setHandle(null);
      return null;
    }
  }, [faucet, address]);

  useEffect(() => {
    setBalance(null);
    void loadHandle();
  }, [loadHandle]);

  const empty = handle !== null && BigInt(handle) === BigInt(0);

  const revealHandle = useCallback(
    async (h: Hex) => {
      const cleartext = await sdk.decryption.decryptValues([
        { encryptedValue: h, contractAddress: CTTT_SEPOLIA },
      ]);
      return Number(cleartext[h]) / 10 ** TOKEN_DECIMALS;
    },
    [sdk]
  );

  // A non-zero balance only matters against a real budget — decrypt once to compare.
  useEffect(() => {
    if (!handle || empty || requiredAmount <= 0 || balance !== null || revealing) return;
    let cancelled = false;
    setRevealing(true);
    revealHandle(handle)
      .then((b) => {
        if (!cancelled) setBalance(b);
      })
      .catch(() => {
        /* leave balance null — without the figure we simply don't warn */
      })
      .finally(() => {
        if (!cancelled) setRevealing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [handle, empty, requiredAmount, balance, revealing, revealHandle]);

  async function mint() {
    if (!faucet || !walletClient) {
      openConnectModal?.();
      return;
    }
    setMinting(true);
    setError(null);
    try {
      await faucet.mintConfidential({ amount: MINT_AMOUNT });
      const fresh = await loadHandle();
      if (fresh && BigInt(fresh) !== BigInt(0) && requiredAmount > 0) {
        try {
          setBalance(await revealHandle(fresh));
        } catch {
          setBalance(null);
        }
      }
    } catch (err) {
      if (err instanceof FaucetSupplyExhaustedError) {
        setError("Test token supply is exhausted — contact the Tacet team.");
      } else {
        setError("Mint failed. Make sure your wallet holds a little Sepolia ETH for gas, then try again.");
      }
    } finally {
      setMinting(false);
    }
  }

  // Two visible states only: a zero balance, or a revealed balance below budget.
  const mode: "zero" | "insufficient" | null = !isConnected
    ? null
    : empty
    ? "zero"
    : balance !== null && requiredAmount > 0 && balance < requiredAmount
    ? "insufficient"
    : null;

  if (!mode) return null;

  const value = mode === "zero" ? "0" : (balance ?? 0).toLocaleString();

  return (
    <div className="border-0.5 border-ink-200 rounded-input bg-card" style={{ padding: "20px 24px" }}>
      <div className="mb-8 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[1px] text-ink-400">CTTT balance</span>
        <span className="font-mono text-[20px] tabular-nums text-ink-1000">{value}</span>
      </div>

      <p className="mb-16 font-sans text-[14px] text-ink-600">
        {mode === "zero"
          ? "You need CTTT test tokens to run a campaign."
          : "Insufficient balance for this campaign."}
      </p>
      <button
        onClick={mint}
        disabled={minting}
        className="rounded-pill bg-accent font-sans text-[14px] font-medium text-ink-1000 transition-opacity hover:opacity-90 disabled:pointer-events-none"
        style={{ padding: "10px 24px", opacity: minting ? 0.7 : 1 }}
      >
        {minting ? "Minting…" : "Mint 500 CTTT →"}
      </button>
      {error && <p className="mt-12 font-mono text-[12px] text-ink-400">{error}</p>}
    </div>
  );
}
