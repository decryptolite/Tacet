import type { EncryptedInput, Encryptor, FheValueInput } from "@tokenops/sdk/fhe-airdrop";
import { hexToBytes, type Address, type Hex } from "viem";

/** ConfidentialTokenopsTestToken (CTTT) on Sepolia — 6-decimal ERC-7984 backed by TTT. */
export const CTTT_SEPOLIA = "0x258F9D60dc023870e4E3109c894D834D5377361a" as const;

/** Display symbol for the confidential token — the single source of truth for UI labels. */
export const TOKEN_SYMBOL = "CTTT" as const;

/** The only chain with a TokenOps FHE Airdrop factory deployment. */
export const AIRDROP_CHAIN_ID = 11155111 as const;

/**
 * ConfidentialAirdropFactory on Sepolia — the exact address the SDK's create hook
 * resolves from (DEPLOYED_ADDRESSES.fheAirdrop.confidentialAirdropFactory[11155111]).
 * Kept as a local constant because @tokenops/sdk only re-exports its address
 * accessor from barrels that also pull @zama-fhe/sdk symbols absent in the pinned
 * 3.x (RelayerWeb / SepoliaConfig / MainnetConfig), which fails the build.
 */
export const FACTORY_ADDRESS = "0xbE6A3B78B36684fFee48De77d47Bc3393F5Acd4c" as const;

/** ERC-7984 confidential tokens on TokenOps use 6 decimals. */
export const TOKEN_DECIMALS = 6;

export function toRawUnits(amount: number): bigint {
  return BigInt(amount) * BigInt(10) ** BigInt(TOKEN_DECIMALS);
}

interface ZamaRelayerLike {
  encrypt(params: {
    values: FheValueInput[];
    contractAddress: Address;
    userAddress: Address;
  }): Promise<{ encryptedValues: Hex[]; inputProof: Hex }>;
}

/**
 * Adapts `@zama-fhe/sdk`'s relayer to `@tokenops/sdk`'s `Encryptor` interface.
 * The two declare structurally different result shapes for the same operation
 * (`encryptedValues: Hex[]` vs. `handles: Uint8Array[]`) despite the peer-dependency
 * range lining up — this is just an encoding difference, so a thin adapter resolves
 * it instead of forking either SDK's types.
 */
export function toEncryptor(relayer: ZamaRelayerLike): Encryptor {
  return {
    async encrypt(params) {
      const result = await relayer.encrypt(params);
      return {
        handles: result.encryptedValues.map((v) => hexToBytes(v)),
        inputProof: hexToBytes(result.inputProof),
      };
    },
  };
}

/**
 * Admin-issued claim authorization for a single recipient, generated client-side
 * by the maintainer's wallet (which holds DEFAULT_ADMIN_ROLE on its own clone):
 * encryptUint64 (bound to recipient + contract) → signClaimAuthorization.
 * Submitted verbatim to useClaim / useGetClaimAmount. The signature commits to
 * the exact handle — re-encrypting would invalidate it.
 *
 * There is no on-chain registry for this pair — the contract only checks the
 * signature at claim time and tracks replay protection. So it has to reach the
 * recipient out of band; Tacet embeds it directly in the per-recipient claim
 * link rather than standing up a database for it.
 */
export interface EncryptedClaimPayload {
  encryptedInput: EncryptedInput;
  signature: Hex;
}

export interface ClaimLinkPayload {
  airdropAddress: Address;
  recipientAddress: Address;
  githubHandle: string;
  claimPayload: EncryptedClaimPayload;
}

function toBase64Url(bytes: Uint8Array): string {
  let base64: string;
  if (typeof window === "undefined") {
    base64 = Buffer.from(bytes).toString("base64");
  } else {
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    base64 = btoa(binary);
  }
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(id: string): Uint8Array {
  const base64 = id.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  if (typeof window === "undefined") return new Uint8Array(Buffer.from(padded, "base64"));
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Encode a per-recipient claim link payload into the `/c/[id]` route segment. */
export function encodeClaimLinkId(payload: ClaimLinkPayload): string {
  return toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
}

/** Decode a `/c/[id]` route segment back into a claim link payload. Returns null if malformed. */
export function decodeClaimLinkId(id: string): ClaimLinkPayload | null {
  try {
    const json = new TextDecoder().decode(fromBase64Url(id));
    const parsed = JSON.parse(json) as ClaimLinkPayload;
    if (!parsed.airdropAddress || !parsed.recipientAddress || !parsed.claimPayload) return null;
    return parsed;
  } catch {
    return null;
  }
}
