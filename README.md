# Tacet

Confidential reward distribution for open-source contributors, built on the Zama Protocol and TokenOps confidential airdrop contracts. Submitted for the Zama Developer Program Mainnet Season 3 — TokenOps Special Bounty Track.

A maintainer connects a GitHub repository, ranks contributors by activity, sets a total budget, and deploys a campaign in one wallet signature. Each contributor's allocation is encrypted client-side using FHEVM before it ever hits the chain. The chain stores ciphertext handles only — no amounts are readable on-chain or by other participants. Each contributor connects their wallet, decrypts their own allocation, and claims in a single transaction. The rest of the distribution stays sealed.

The design is intentionally minimal: one campaign type (confidential airdrop), one token (cUSDT on Sepolia), three screens (maintainer composer, contributor claim, public landing). The claim screen's reveal choreography is the product's core moment — a 2-second transition from ciphertext handle to plaintext amount, visible only to the wallet that holds the decryption right.

---

## Tech

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript strict, Tailwind CSS, Framer Motion
- **FHE**: `@zama-fhe/sdk` for encryption, `@zama-fhe/react-sdk` for wallet-bound decryption
- **Contracts**: `@tokenops/sdk` (ConfidentialAirdropFactory + ConfidentialAirdropCloneable via SDK), `TacetCampaignRegistry` (thin metadata store, Solidity 0.8.27)
- **Chain**: Sepolia testnet
- **Auth**: NextAuth + GitHub OAuth (maintainer only)

---

## Running locally

**Prerequisites**: Node 20+, pnpm 9+, a Sepolia RPC URL, a GitHub OAuth app.

```bash
# 1. Install
pnpm install

# 2. Environment
cp apps/web/.env.example apps/web/.env.local
# Fill in: NEXTAUTH_SECRET, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, NEXT_PUBLIC_SEPOLIA_RPC

# 3. Dev server
pnpm dev
# → http://localhost:3000

# 4. Contracts (requires Foundry)
cd packages/contracts
forge build
forge test
forge script script/Deploy.s.sol:Deploy --rpc-url $SEPOLIA_RPC_URL --broadcast --verify
```

The demo campaign at `/c/demo` works without a wallet — it uses a seeded offline reveal that mirrors the relayer latency for the video recording.

---

## Architecture

```
apps/web/app/(marketing)/     landing page — static, no wallet required
apps/web/app/(app)/           maintainer composer — wallet + GitHub OAuth
apps/web/app/c/[id]/          contributor claim — wallet required, mobile-first
packages/contracts/           TacetCampaignRegistry (Foundry)
```

The `@tokenops/sdk` is the only path to the confidential airdrop contracts. The SDK handles ACL grants, EIP-712 attestations, and KMS proof verification. The `TacetCampaignRegistry` stores campaign metadata (title, repo URL, deadline) keyed by the airdrop contract address — it has no admin key and is immutable after registration.

---

## Deployed contracts (Sepolia)

| Contract | Address |
|---|---|
| TacetCampaignRegistry | _deploy and fill in_ |
| TokenOps ConfidentialAirdropFactory | see `@tokenops/sdk` |
| cUSDT (ERC-7984) | `0x258F9D60dc023870e4E3109c894D834D5377361a` |

---

## Built on

- [Zama Protocol](https://www.zama.ai/) — FHEVM
- [TokenOps SDK](https://docs.tokenops.xyz/) — confidential airdrop contracts (audited by OpenZeppelin)
- [ERC-7984](https://eips.ethereum.org/EIPS/eip-7984) — confidential token standard
