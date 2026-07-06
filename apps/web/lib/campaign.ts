import { createPublicClient, http, isAddress, zeroAddress, type Address } from "viem";
import { sepolia } from "viem/chains";
import { createConfidentialAirdropClient } from "@tokenops/sdk/fhe-airdrop";
import { decodeClaimLinkId, TOKEN_SYMBOL, type EncryptedClaimPayload } from "@/lib/tokenops";
import { fetchCampaignMeta } from "@/lib/registry";

/** Recipient record — decoded from the per-recipient claim link, mirrored against the registry. */
export interface Recipient {
  address: Address;
  githubHandle: string;
  /** Ciphertext handle for the recipient's euint64 allocation. */
  encryptedAmountHandle: string;
  claimed: boolean;
  /** Admin-issued claim payload: { encryptedInput, signature }, carried in the claim link itself. */
  claimPayload: EncryptedClaimPayload;
}

/** Campaign metadata — read from TacetCampaignRegistry, resolved to a ConfidentialAirdrop. */
export interface Campaign {
  id: string;
  airdropAddress: Address;
  maintainer: string;
  maintainerAddress: Address;
  title: string;
  repoUrl: string;
  token: string;
  deadline: number;
  createdAt: number;
}

/** Everything the claim screen needs: the campaign plus the viewer's own sealed record. */
export interface ClaimData {
  campaign: Campaign;
  recipient: Recipient;
}

/**
 * Resolve a campaign + the connecting recipient's sealed record.
 *
 * The route's `id` is a base64url-encoded claim link payload (see
 * lib/tokenops.ts) — the recipient address and claim authorization travel in
 * the link itself, since the airdrop contract has no on-chain registry to
 * look them up by address. Campaign metadata (title, deadline, maintainer)
 * is a live read from TacetCampaignRegistry.
 */
export async function getClaimData(id: string): Promise<ClaimData> {
  const decoded = decodeClaimLinkId(id);
  if (!decoded) throw new Error("This claim link is invalid.");

  // Defensive validation — old / test links carry a placeholder recipient
  // (0x1111…1111), a missing signature, or a malformed handle. Reject before any
  // RPC so a bad link renders a clean message instead of a runtime error.
  const { recipientAddress, airdropAddress, claimPayload } = decoded;
  const signature = claimPayload?.signature;
  const handle = claimPayload?.encryptedInput?.handle;
  const isPlaceholderRecipient = /^0x1{40}$/i.test(recipientAddress ?? "");
  if (
    !isAddress(recipientAddress) ||
    recipientAddress === zeroAddress ||
    isPlaceholderRecipient ||
    !isAddress(airdropAddress) ||
    airdropAddress === zeroAddress ||
    !signature ||
    !signature.startsWith("0x") ||
    signature.length < 132 ||
    !handle ||
    handle.length !== 66
  ) {
    throw new Error("This claim link is invalid.");
  }

  const meta = await fetchCampaignMeta(airdropAddress);
  if (!meta) throw new Error("Campaign not found.");

  let claimed = false;
  try {
    const publicClient = createPublicClient({ chain: sepolia, transport: http() });
    const airdrop = createConfidentialAirdropClient({ publicClient, address: decoded.airdropAddress });
    claimed = await airdrop.isSignatureClaimed(
      decoded.recipientAddress,
      decoded.claimPayload.encryptedInput.handle
    );
  } catch {
    claimed = false;
  }

  return {
    campaign: {
      id,
      airdropAddress: decoded.airdropAddress,
      maintainer: meta.maintainer,
      maintainerAddress: meta.maintainer,
      title: meta.title,
      repoUrl: meta.repoUrl,
      token: TOKEN_SYMBOL,
      deadline: meta.deadline,
      createdAt: meta.createdAt,
    },
    recipient: {
      address: decoded.recipientAddress,
      githubHandle: decoded.githubHandle,
      encryptedAmountHandle: decoded.claimPayload.encryptedInput.handle,
      claimed,
      claimPayload: decoded.claimPayload,
    },
  };
}

const amountFormatter = new Intl.NumberFormat("en-US");

export function formatAmount(value: number): string {
  return amountFormatter.format(value);
}

/** Document-header date: 2026.07.04 */
export function formatDocDate(unix: number): string {
  const d = new Date(unix * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}.${pad(d.getUTCMonth() + 1)}.${pad(d.getUTCDate())}`;
}

/** Receipt-row date: Jul 4 */
export function formatShortDate(unix: number): string {
  return new Date(unix * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
