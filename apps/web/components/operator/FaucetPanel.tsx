"use client";

// Faucet nudge for the allocation step. Visible modes, all keyed off the
// operator's confidential CTTT balance:
//   • Zero balance (readable gaslessly) — mint nudge.
//   • Non-zero, not yet checked, with a budget to meet — a sealed row plus an
//     explicit "Check balance" tap. Revealing a confidential balance costs one
//     EIP-712 signature, so it never happens on its own / on mount.
//   • Checked and below budget — insufficient warning with the real figure.
// The panel retires itself once a checked balance covers the budget, and with no
// budget to meet (requiredAmount 0) a non-zero balance is simply hidden. Pulls
// from Sealed §Typography (Geist Mono label + number, Geist Sans notice) and the
// single amber accent for the one action.

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useZamaSDK } from "@zama-fhe/react-sdk";
import { sepolia } from "viem/chains";
import type { Hex } from "viem";
import { TestnetFaucetClient, FaucetSupplyExhaustedError } from "@tokenops/sdk/testnet-faucet";
import { CTTT_SEPOLIA, TOKEN_DECIMALS, TOKEN_SYMBOL } from "@/lib/tokenops";

const MINT_AMOUNT = BigInt(500) * BigInt(10) ** BigInt(TOKEN_DECIMALS);

interface FaucetPanelProps {
  /** Whole-CTTT budget the balance must cover; 0 disables the below-budget check. */
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
  const [checking, setChecking] = useState(false);
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

  async function check() {
    if (!handle || empty) return;
    setChecking(true);
    setError(null);
    try {
      const cleartext = await sdk.decryption.decryptValues([
        { encryptedValue: handle, contractAddress: CTTT_SEPOLIA },
      ]);
      setBalance(Number(cleartext[handle]) / 10 ** TOKEN_DECIMALS);
    } catch {
      setError("Couldn't read your balance. Try again.");
    } finally {
      setChecking(false);
    }
  }

  async function mint() {
    if (!faucet || !walletClient) {
      openConnectModal?.();
      return;
    }
    setMinting(true);
    setError(null);
    try {
      await faucet.mintConfidential({ amount: MINT_AMOUNT });
      setBalance(null); // re-seal — the operator checks the new balance explicitly
      await loadHandle();
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

  const mode: "zero" | "sealed" | "insufficient" | null = !isConnected
    ? null
    : empty
    ? "zero"
    : requiredAmount <= 0
    ? null
    : balance === null
    ? "sealed"
    : balance < requiredAmount
    ? "insufficient"
    : null;

  if (!mode) return null;

  const value = mode === "sealed" ? "••••••" : mode === "zero" ? "0" : (balance ?? 0).toLocaleString();

  return (
    <div className="border-0.5 border-ink-200 rounded-input bg-card" style={{ padding: "20px 24px" }}>
      <div className={["flex items-center justify-between", mode === "sealed" ? "mb-16" : "mb-8"].join(" ")}>
        <span className="font-mono text-[10px] uppercase tracking-[1px] text-ink-400">{TOKEN_SYMBOL} balance</span>
        <span
          className={[
            "font-mono text-[20px] tabular-nums",
            mode === "sealed" ? "text-ink-400" : "text-ink-1000",
          ].join(" ")}
        >
          {value}
        </span>
      </div>

      {mode !== "sealed" && (
        <p className="mb-16 font-sans text-[14px] text-ink-600">
          {mode === "zero"
            ? `You need ${TOKEN_SYMBOL} test tokens to run a campaign.`
            : "Insufficient balance for this campaign."}
        </p>
      )}

      {mode === "sealed" ? (
        <button
          onClick={check}
          disabled={checking}
          className="rounded-pill bg-accent font-sans text-[14px] font-medium text-ink-1000 transition-opacity hover:opacity-90 disabled:pointer-events-none"
          style={{ padding: "10px 24px", opacity: checking ? 0.7 : 1 }}
        >
          {checking ? "Checking…" : "Check balance"}
        </button>
      ) : (
        <button
          onClick={mint}
          disabled={minting}
          className="rounded-pill bg-accent font-sans text-[14px] font-medium text-ink-1000 transition-opacity hover:opacity-90 disabled:pointer-events-none"
          style={{ padding: "10px 24px", opacity: minting ? 0.7 : 1 }}
        >
          {minting ? "Minting…" : `Mint 500 ${TOKEN_SYMBOL} →`}
        </button>
      )}
      {error && <p className="mt-12 font-mono text-[12px] text-ink-400">{error}</p>}
    </div>
  );
}
