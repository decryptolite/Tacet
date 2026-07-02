"use strict";
/**
 * mint-tokens.cjs — Mint CTTT test tokens to the deployer wallet via the
 * TokenOps testnet faucet (open, permissionless, Sepolia only).
 *
 * Run: node scripts/mint-tokens.cjs
 * Requires: DEPLOYER_PRIVATE_KEY and NEXT_PUBLIC_SEPOLIA_RPC in apps/web/.env.local
 */

const path = require("path");
const fs = require("fs");

// ── Load .env.local ──────────────────────────────────────────────────────────
const envPath = path.join(__dirname, "../.env.local");
if (!fs.existsSync(envPath)) {
  console.error("Missing apps/web/.env.local — cannot read env vars");
  process.exit(1);
}
for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m) process.env[m[1]] = m[2].trim();
}

const RPC = process.env.NEXT_PUBLIC_SEPOLIA_RPC;
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;
if (!RPC) { console.error("NEXT_PUBLIC_SEPOLIA_RPC not set"); process.exit(1); }
if (!PRIVATE_KEY) { console.error("DEPLOYER_PRIVATE_KEY not set"); process.exit(1); }

const { createPublicClient, createWalletClient, http } = require("viem");
const { privateKeyToAccount } = require("viem/accounts");
const { sepolia } = require("viem/chains");
const { TestnetFaucetClient } = require("@tokenops/sdk/testnet-faucet");

const MINT_AMOUNT = BigInt(1000) * BigInt(10) ** BigInt(6); // 1000 CTTT, 6-decimal units

async function main() {
  const account = privateKeyToAccount(PRIVATE_KEY.startsWith("0x") ? PRIVATE_KEY : `0x${PRIVATE_KEY}`);
  console.log("Deployer wallet:", account.address);

  const publicClient = createPublicClient({ chain: sepolia, transport: http(RPC) });
  const walletClient = createWalletClient({ account, chain: sepolia, transport: http(RPC) });

  const faucet = new TestnetFaucetClient({ publicClient, walletClient });

  console.log(`Minting ${MINT_AMOUNT.toString()} raw units (1000 CTTT) to ${account.address}...`);
  const result = await faucet.mintConfidential({ amount: MINT_AMOUNT });

  console.log("\n✓ Mint succeeded");
  console.log("  Transaction hash:", result.hash);
  console.log("  Recipient:", result.to);
  console.log("  Amount (CTTT, raw units):", result.amount.toString());
  console.log("  Underlying TTT minted (raw units):", result.underlyingMinted.toString());
}

main().catch((err) => {
  console.error("\n✗ MINT FAILED:", err.message || err);
  process.exit(1);
});
