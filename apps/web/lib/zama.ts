import { createConfig } from "@zama-fhe/sdk/viem";
import { web } from "@zama-fhe/sdk/web";
import { sepolia as sepoliaFhe, type FheChain } from "@zama-fhe/sdk/chains";
import type { PublicClient, WalletClient } from "viem";

/**
 * Relayer requests are proxied through our own API route so the relayer key
 * stays server-side (Zama auth guide). Falls back to the public testnet
 * relayer for local dev when no proxy origin is set.
 */
const relayerUrl = process.env.NEXT_PUBLIC_RELAYER_URL ?? sepoliaFhe.relayerUrl;

const chain = { ...sepoliaFhe, relayerUrl } as const satisfies FheChain;

/**
 * Build a ZamaConfig from live viem clients. We use the viem adapter rather
 * than `@zama-fhe/react-sdk/wagmi` because that adapter targets a newer wagmi
 * `useConnection` API than the one this app pins.
 */
export function buildZamaConfig(publicClient: PublicClient, walletClient: WalletClient) {
  return createConfig({
    chains: [chain],
    publicClient,
    walletClient,
    relayers: { [chain.id]: web() },
  });
}
