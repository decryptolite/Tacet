import { createPublicClient, createWalletClient, http, encodeFunctionData, parseAbi } from "viem";
import { sepolia } from "viem/chains";
import type { Address, WalletClient } from "viem";

/**
 * Deployed TacetCampaignRegistry on Sepolia.
 * Set NEXT_PUBLIC_REGISTRY_ADDRESS after running `forge script Deploy`.
 */
export const REGISTRY_ADDRESS = (
  process.env.NEXT_PUBLIC_REGISTRY_ADDRESS ?? "0x0000000000000000000000000000000000000000"
) as Address;

const ABI = parseAbi([
  "struct Campaign { address maintainer; string title; string repoUrl; uint40 deadline; uint40 createdAt; }",
  "function register(address airdropAddress, string calldata title, string calldata repoUrl, uint40 deadline) external",
  "function getCampaign(address airdropAddress) external view returns (Campaign)",
]);

/**
 * Register a deployed airdrop in the campaign registry.
 * Called by the operator after `useCreateConfidentialAirdrop` succeeds.
 */
export async function registerCampaign(
  walletClient: WalletClient,
  airdropAddress: Address,
  title: string,
  repoUrl: string,
  deadline: number
): Promise<`0x${string}`> {
  const [account] = await walletClient.getAddresses();
  return walletClient.sendTransaction({
    account,
    to: REGISTRY_ADDRESS,
    data: encodeFunctionData({
      abi: ABI,
      functionName: "register",
      args: [airdropAddress, title, repoUrl, deadline],
    }),
    chain: sepolia,
  });
}

/**
 * Read campaign metadata from the registry.
 * Returns null if the address is unknown (zero createdAt).
 */
export async function fetchCampaignMeta(airdropAddress: Address): Promise<{
  maintainer: Address;
  title: string;
  repoUrl: string;
  deadline: number;
  createdAt: number;
} | null> {
  try {
    const client = createPublicClient({ chain: sepolia, transport: http() });
    const result = await client.readContract({
      address: REGISTRY_ADDRESS,
      abi: ABI,
      functionName: "getCampaign",
      args: [airdropAddress],
    });
    // viem returns a named tuple as an object, not an array.
    const { maintainer, title, repoUrl, deadline, createdAt } = result;
    const meta = { maintainer, title, repoUrl, deadline: Number(deadline), createdAt: Number(createdAt) };
    // TEMP diagnostic — confirm the parsed campaign decodes correctly.
    console.log("[tacet] fetchCampaignMeta OK", {
      REGISTRY_ADDRESS,
      airdropAddress,
      maintainer,
      title,
      deadline: meta.deadline,
      createdAt: meta.createdAt,
    });
    if (meta.createdAt === 0) return null;
    return meta;
  } catch (err) {
    // Unknown address, unregistered campaign, or RPC hiccup — treat as not-found
    // so the claim page renders a clean message rather than crashing the render.
    console.error("[tacet] fetchCampaignMeta FAILED", { REGISTRY_ADDRESS, airdropAddress, err });
    return null;
  }
}
