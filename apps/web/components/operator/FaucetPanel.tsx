"use client";

// Faucet nudge for the operator composer. Shown only while the connected wallet
// holds no confidential CTTT — a zero balance handle is readable gaslessly, so
// no signature is spent to decide visibility. Minting 500 CTTT from the TokenOps
// testnet faucet flips the panel to a brief success note, then it retires itself.
// Pulls from Sealed §Typography (Geist Mono label + number, Geist Sans notice)
// and the single amber accent for the one primary action. Not built: any
// confidential-balance reveal — a nonzero handle is enough to know the operator
// is funded, and revealing the exact figure would cost a signature this nudge
// doesn't need.

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { sepolia } from "viem/chains";
import type { Hex } from "viem";
import { TestnetFaucetClient, FaucetSupplyExhaustedError } from "@tokenops/sdk/testnet-faucet";
import { TOKEN_DECIMALS } from "@/lib/tokenops";

const MINT_AMOUNT = BigInt(500) * BigInt(10) ** BigInt(TOKEN_DECIMALS);

export default function FaucetPanel() {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const publicClient = usePublicClient({ chainId: sepolia.id });
  const { data: walletClient } = useWalletClient();

  const faucet = useMemo(
    () => (publicClient ? new TestnetFaucetClient({ publicClient, walletClient: walletClient ?? undefined }) : null),
    [publicClient, walletClient]
  );

  const [handle, setHandle] = useState<Hex | null>(null);
  const [reading, setReading] = useState(false);
  const [minting, setMinting] = useState(false);
  const [minted, setMinted] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHandle = useCallback(async (): Promise<Hex | null> => {
    if (!faucet || !address) {
      setHandle(null);
      return null;
    }
    setReading(true);
    try {
      const h = await faucet.confidentialBalanceOf(address);
      setHandle(h);
      return h;
    } catch {
      setHandle(null);
      return null;
    } finally {
      setReading(false);
    }
  }, [faucet, address]);

  useEffect(() => {
    void loadHandle();
  }, [loadHandle]);

  const empty = handle !== null && BigInt(handle) === BigInt(0);

  async function mint() {
    if (!faucet || !walletClient) {
      openConnectModal?.();
      return;
    }
    setMinting(true);
    setError(null);
    try {
      await faucet.mintConfidential({ amount: MINT_AMOUNT });
      setMinted(true);
      void loadHandle();
      setTimeout(() => setDismissed(true), 2000);
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

  if (dismissed) return null;
  // Operator already holds confidential CTTT — nothing to nudge.
  if (isConnected && handle !== null && !empty && !minted) return null;

  return (
    <div className="border-0.5 border-ink-200 rounded-input bg-card" style={{ padding: "20px 24px" }}>
      <div className="mb-8 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[1px] text-ink-400">CTTT balance</span>
        {isConnected && (empty || minted) && (
          <span className="font-mono text-[20px] tabular-nums text-ink-1000">{minted ? "500" : "0"}</span>
        )}
      </div>

      {!isConnected ? (
        <>
          <p className="mb-16 font-sans text-[14px] text-ink-600">
            Connect a wallet to check your test token balance.
          </p>
          <button
            onClick={() => openConnectModal?.()}
            className="rounded-pill border border-ink-200 font-sans text-[14px] font-medium text-ink-1000 transition-colors hover:border-ink-600"
            style={{ padding: "10px 24px" }}
          >
            Connect wallet
          </button>
        </>
      ) : reading && handle === null ? (
        <div className="h-[20px] w-32 animate-fade-in rounded-redaction bg-ink-100" />
      ) : minted ? (
        <p className="font-mono text-[12px] text-ink-400">500 CTTT added to your wallet.</p>
      ) : (
        <>
          <p className="mb-16 font-sans text-[14px] text-ink-600">
            You need CTTT test tokens to run a campaign.
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
        </>
      )}
    </div>
  );
}
