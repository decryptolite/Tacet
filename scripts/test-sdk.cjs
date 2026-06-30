"use strict";
/**
 * test-sdk.cjs — Standalone adapter + SDK surface test
 *
 * Tests three things without requiring React or browser WASM:
 *   1. toEncryptor adapter: verifies hex→Uint8Array conversion is correct
 *   2. encryptUint64 + signClaimAuthorization: API surface with RelayerCleartext
 *   3. Factory client: reads defaultGasFee from the live Sepolia factory
 *
 * NOT tested here (requires browser WebWorker WASM or NodeWorkerPool):
 *   - createAndFundConfidentialAirdropAndGetAddress on live chain
 *   - claim on live chain
 *
 * Run: node scripts/test-sdk.cjs
 * Requires: NEXT_PUBLIC_SEPOLIA_RPC and NEXT_PUBLIC_REGISTRY_ADDRESS in apps/web/.env.local
 */

const assert = require("assert");
const path = require("path");
const fs = require("fs");

// ── Load .env.local ──────────────────────────────────────────────────────────
const envPath = path.join(__dirname, "../apps/web/.env.local");
if (!fs.existsSync(envPath)) {
  console.error("Missing apps/web/.env.local — cannot read NEXT_PUBLIC_SEPOLIA_RPC");
  process.exit(1);
}
for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m) process.env[m[1]] = m[2].trim();
}

const RPC = process.env.NEXT_PUBLIC_SEPOLIA_RPC;
if (!RPC) { console.error("NEXT_PUBLIC_SEPOLIA_RPC not set"); process.exit(1); }

// ── Imports (CJS) ────────────────────────────────────────────────────────────
const { createPublicClient, createWalletClient, http, hexToBytes, bytesToHex } = require("viem");
const { privateKeyToAccount } = require("viem/accounts");
const { sepolia } = require("viem/chains");

const {
  encryptUint64,
  signClaimAuthorization,
  createConfidentialAirdropFactoryClient,
} = require("@tokenops/sdk/fhe-airdrop");

// RelayerCleartext is the test-mode relayer — returns fake handles without
// running real WASM FHE. Useful for type/API-surface tests only.
const { RelayerCleartext } = require("@zama-fhe/sdk/cleartext");
const { sepolia: sepoliaFhe } = require("@zama-fhe/sdk/chains");

// ── Test wallet (no real funds needed for the non-broadcast tests) ────────────
// Derived from a well-known test key — never use on mainnet.
const TEST_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const account = privateKeyToAccount(TEST_PRIVATE_KEY);
console.log("Test wallet:", account.address);

async function main() {
  // ── TEST 1: toEncryptor adapter ──────────────────────────────────────────
  console.log("\n── TEST 1: toEncryptor adapter ──────────────────────────────");

  // Inline the adapter since we can't import the TypeScript file directly
  function toEncryptor(relayer) {
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

  const cleartext = new RelayerCleartext(sepoliaFhe);

  // Verify RelayerCleartext.encrypt() returns { encryptedValues: string[], inputProof: string }
  const rawResult = await cleartext.encrypt({
    values: [{ value: BigInt(1_000_000), type: "euint64" }],
    contractAddress: "0x0000000000000000000000000000000000000001",
    userAddress: account.address,
  });
  console.log("RelayerCleartext.encrypt() shape:", {
    hasEncryptedValues: Array.isArray(rawResult.encryptedValues),
    inputProofType: typeof rawResult.inputProof,
    encryptedValueType: typeof rawResult.encryptedValues[0],
    firstHandlePrefix: String(rawResult.encryptedValues[0]).substring(0, 6),
    inputProofPrefix: String(rawResult.inputProof).substring(0, 6),
  });

  // Now test the adapter
  const adapted = toEncryptor(cleartext);
  const adaptedResult = await adapted.encrypt({
    values: [{ value: BigInt(1_000_000), type: "euint64" }],
    contractAddress: "0x0000000000000000000000000000000000000001",
    userAddress: account.address,
  });

  assert(Array.isArray(adaptedResult.handles), "handles must be array");
  assert(adaptedResult.handles[0] instanceof Uint8Array, "handles[0] must be Uint8Array");
  assert(adaptedResult.inputProof instanceof Uint8Array, "inputProof must be Uint8Array");
  assert(adaptedResult.handles[0].length > 0, "handle must have bytes");
  assert(adaptedResult.inputProof.length > 0, "inputProof must have bytes");
  console.log("✓ toEncryptor adapter: Hex→Uint8Array conversion correct");
  console.log("  handle length:", adaptedResult.handles[0].length, "bytes");
  console.log("  inputProof length:", adaptedResult.inputProof.length, "bytes");
  // Verify round-trip: converting back to hex should give same value
  const roundTripped = bytesToHex(adaptedResult.handles[0]);
  assert.equal(roundTripped, rawResult.encryptedValues[0], "round-trip handle mismatch");
  console.log("✓ Round-trip Uint8Array→Hex matches original");

  // ── TEST 2: encryptUint64 + signClaimAuthorization ───────────────────────
  console.log("\n── TEST 2: encryptUint64 + signClaimAuthorization ────────────");

  const encryptor = toEncryptor(cleartext);
  const TEST_AIRDROP_ADDR = "0x0000000000000000000000000000000000000042";
  const TEST_RECIPIENT   = "0x0000000000000000000000000000000000000043";
  const TEST_AMOUNT = BigInt(50) * BigInt(10) ** BigInt(6); // 50 CTTT in raw units

  const encrypted = await encryptUint64({
    encryptor,
    contractAddress: TEST_AIRDROP_ADDR,
    userAddress: TEST_RECIPIENT,
    value: TEST_AMOUNT,
  });
  assert(encrypted, "encryptUint64 returned nothing");
  assert(encrypted.handle, "encrypted.handle missing");
  assert(encrypted.inputProof, "encrypted.inputProof missing");
  console.log("✓ encryptUint64 returned EncryptedInput");
  console.log("  handle type:", typeof encrypted.handle, "(expected Hex string)");
  console.log("  inputProof type:", typeof encrypted.inputProof, "(expected Hex string)");

  // signClaimAuthorization requires a real walletClient (EIP-712 signing)
  const publicClient = createPublicClient({ chain: sepolia, transport: http(RPC) });
  const walletClient = createWalletClient({ account, chain: sepolia, transport: http(RPC) });

  const signature = await signClaimAuthorization({
    walletClient,
    airdropAddress: TEST_AIRDROP_ADDR,
    recipient: TEST_RECIPIENT,
    encryptedAmountHandle: encrypted.handle,
  });
  assert(signature && signature.startsWith("0x"), "signature must be 0x-prefixed hex");
  assert(signature.length === 132, `expected 65-byte sig (132 hex chars), got ${signature.length}`);
  console.log("✓ signClaimAuthorization returned valid 65-byte EIP-712 signature");
  console.log("  sig prefix:", signature.substring(0, 10) + "…");

  // ── TEST 3: Factory contract read ────────────────────────────────────────
  console.log("\n── TEST 3: Factory client — live Sepolia read ────────────────");

  const factoryClient = createConfidentialAirdropFactoryClient({
    publicClient,
    chainId: sepolia.id,
  });

  const defaultFee = await factoryClient.defaultGasFee();
  assert(typeof defaultFee === "bigint", "defaultGasFee must be bigint");
  console.log("✓ Factory contract reachable on Sepolia");
  console.log("  defaultGasFee:", defaultFee.toString(), "wei");

  // Confirm the factory address is resolvable (throws DeploymentAddressUnavailableError if not)
  const implAddr = await factoryClient.implementation();
  assert(implAddr.startsWith("0x") && implAddr.length === 42, "implementation address invalid");
  console.log("  implementation:", implAddr);

  // ── SUMMARY ──────────────────────────────────────────────────────────────
  console.log("\n══════════════════════════════════════════════════════════════");
  console.log("ALL SCRIPT TESTS PASSED");
  console.log("══════════════════════════════════════════════════════════════");
  console.log("\nStill requires browser testing (needs real Zama WASM relayer):");
  console.log("  1. createAndFundConfidentialAirdropAndGetAddress");
  console.log("     — needs real FHE proof; RelayerCleartext handles will be rejected by FHE.fromExternal");
  console.log("     — fund wallet with: ETH for gas (~0.05 ETH) + CTTT_SEPOLIA for pool amount");
  console.log("     — CTTT_SEPOLIA faucet: https://faucet.tokenops.xyz (Sepolia, test mode)");
  console.log("  2. claim() by recipient");
  console.log("     — open generated /c/[id] link in second browser profile with recipient wallet");
  console.log("     — connect, reveal, claim");
  console.log("  3. getClaimAmount() decryption");
  console.log("     — verify the revealed amount matches the allocated amount");
}

main().catch((err) => {
  console.error("\n✗ TEST FAILED:", err.message || err);
  process.exit(1);
});
