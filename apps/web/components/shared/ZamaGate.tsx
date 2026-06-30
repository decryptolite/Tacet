"use client";

import { useMemo, type ReactNode } from "react";
import { ZamaProvider } from "@zama-fhe/react-sdk";
import { usePublicClient, useWalletClient } from "wagmi";
import { createPublicClient, createWalletClient, http } from "viem";
import { sepolia } from "viem/chains";
import { buildZamaConfig } from "@/lib/zama";

/**
 * Scopes the Zama FHE SDK to the routes that actually encrypt or decrypt —
 * the claim flow and the operator deploy step. Kept out of the global
 * provider tree so the marketing route never pulls the relayer WASM into its
 * first load. The signer is derived from the connected wallet; an
 * account-less fallback keeps the SDK available (read-only) before
 * connection so the reveal/encrypt hooks can mount.
 */
export default function ZamaGate({ children }: { children: ReactNode }) {
  const publicClient = usePublicClient({ chainId: sepolia.id });
  const { data: walletClient } = useWalletClient({ chainId: sepolia.id });

  const config = useMemo(() => {
    const reader = publicClient ?? createPublicClient({ chain: sepolia, transport: http() });
    const signer = walletClient ?? createWalletClient({ chain: sepolia, transport: http() });
    return buildZamaConfig(reader, signer);
  }, [publicClient, walletClient]);

  return <ZamaProvider config={config}>{children}</ZamaProvider>;
}
