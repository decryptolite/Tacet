"use client";

// Reads the operator's confidential CTTT balance handle (cheap, no relayer),
// lets them mint 500 test CTTT from the TokenOps faucet, and reveals the
// plaintext balance via user-decryption — the same seal/reveal move as the
// claim flow. Pulls from Sealed §Typography (Geist Mono numbers) and the amber
// accent for the single primary action. Not built: any auto-decrypt on mount —
// revealing a confidential balance always costs one explicit signature.

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useZamaSDK } from "@zama-fhe/react-sdk";
import { sepolia } from "viem/chains";
import type { Hex } from "viem";
import { TestnetFaucetClient, FaucetSupplyExhaustedError } from "@tokenops/sdk/testnet-faucet";
import { toast } from "sonner";
import Button from "@/components/design/Button";
import { CTTT_SEPOLIA, TOKEN_DECIMALS } from "@/lib/tokenops";

const MINT_AMOUNT = BigInt(500) * BigInt(10) ** BigInt(TOKEN_DECIMALS);

interface FaucetPanelProps {
  /** When set, a revealed balance below this many whole CTTT is flagged as short. */
  requiredAmount?: number;
}

export default function FaucetPanel({ requiredAmount }: FaucetPanelProps) {
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
  const [reading, setReading] = useState(false);
  const [minting, setMinting] = useState(false);
  const [revealing, setRevealing] = useState(false);

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
    setBalance(null);
    void loadHandle();
  }, [loadHandle]);

  const empty = handle !== null && BigInt(handle) === BigInt(0);

  const revealHandle = useCallback(
    async (h: Hex) => {
      if (BigInt(h) === BigInt(0)) {
        setBalance(0);
        return;
      }
      const cleartext = await sdk.decryption.decryptValues([
        { encryptedValue: h, contractAddress: CTTT_SEPOLIA },
      ]);
      setBalance(Number(cleartext[h]) / 10 ** TOKEN_DECIMALS);
    },
    [sdk]
  );

  async function reveal() {
    if (!handle || empty) return;
    setRevealing(true);
    try {
      await revealHandle(handle);
    } catch {
      toast.error("Decryption failed. Try again.");
    } finally {
      setRevealing(false);
    }
  }

  async function mint() {
    if (!faucet || !walletClient) {
      openConnectModal?.();
      return;
    }
    setMinting(true);
    try {
      await faucet.mintConfidential({ amount: MINT_AMOUNT });
      toast.success("500 CTTT added to your wallet.");
      const wasRevealed = balance !== null;
      const fresh = await loadHandle();
      if (wasRevealed && fresh) {
        try {
          await revealHandle(fresh);
        } catch {
          /* keep the prior number; the toast already confirmed the mint */
        }
      }
    } catch (err) {
      if (err instanceof FaucetSupplyExhaustedError) {
        toast.error("Test token supply exhausted — contact the Tacet team.");
      } else {
        toast.error("Minting failed. Check your wallet and try again.");
      }
    } finally {
      setMinting(false);
    }
  }

  const short = requiredAmount !== undefined && balance !== null && balance < requiredAmount;

  return (
    <div className="border border-ink-200 rounded-card bg-ink-50 p-24">
      <div className="flex items-center justify-between mb-16">
        <span className="text-label text-ink-400 uppercase tracking-wider">Test token balance</span>
        {isConnected && !empty && handle !== null && (
          balance !== null ? (
            <span className="font-mono text-h3 text-ink-1000 tabular-nums">
              {balance.toLocaleString()} <span className="text-ink-400">CTTT</span>
            </span>
          ) : (
            <span className="font-mono text-code text-ink-400 uppercase tracking-wider">Sealed</span>
          )
        )}
      </div>

      {!isConnected ? (
        <>
          <p className="text-small text-ink-600 mb-16">
            Connect a wallet to check your test token balance.
          </p>
          <Button variant="secondary" onClick={() => openConnectModal?.()}>
            Connect wallet
          </Button>
        </>
      ) : reading && handle === null ? (
        <div className="h-[20px] w-32 rounded-redaction bg-ink-100 animate-fade-in" />
      ) : empty ? (
        <>
          <p className="text-body text-ink-1000 mb-8">You need CTTT test tokens to run a campaign.</p>
          <p className="text-small text-ink-600 mb-16">Click below to mint 500 CTTT to your wallet.</p>
          <Button variant="accent" onClick={mint} loading={minting}>
            {minting ? "Minting tokens…" : "Mint test tokens"}
          </Button>
        </>
      ) : (
        <>
          {balance === null ? (
            <p className="text-small text-ink-600 mb-16">
              Your balance is sealed. Reveal it to yourself before setting a budget.
            </p>
          ) : short ? (
            <p className="text-small text-ink-1000 mb-16">
              Below the {requiredAmount?.toLocaleString()} CTTT budget. Mint more to cover it.
            </p>
          ) : (
            <p className="text-small text-ink-600 mb-16">Enough to fund a campaign.</p>
          )}
          <div className="flex gap-12">
            {balance === null && (
              <Button variant="secondary" onClick={reveal} loading={revealing}>
                {revealing ? "Revealing…" : "Reveal balance"}
              </Button>
            )}
            <Button variant={short ? "accent" : "secondary"} onClick={mint} loading={minting}>
              {minting ? "Minting tokens…" : "Mint 500 more"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
