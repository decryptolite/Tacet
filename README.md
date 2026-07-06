# Tacet

**Paid. Not published.** — confidential OSS contributor rewards on the Zama Protocol.

A maintainer ranks their contributors, sets a private allocation for each, and funds and seals the whole distribution in a single flow via the TokenOps SDK. Every contributor opens a personal link, decrypts only their own share in the browser, and claims it. The amounts are encrypted on-chain as ERC-7984 ciphertext — no other contributor, and no observer, ever sees what anyone was paid.

**Live demo:** [tacet-web-seven.vercel.app](https://tacet-web-seven.vercel.app)

---

## How it uses the TokenOps SDK

Tacet builds entirely on the OpenZeppelin-audited **`ConfidentialAirdropCloneable`** contract — one minimal-proxy clone is deployed per campaign through `ConfidentialAirdropFactory`. The frontend never touches those contracts directly; `@tokenops/sdk` is the only integration surface.

Two SDK subpaths do the work:

- **`@tokenops/sdk/fhe-airdrop`** — the client factory (`createConfidentialAirdropClient`), the `Encryptor` interface, and the encrypted-input types.
- **`@tokenops/sdk/fhe-airdrop/react`** — the React hooks used across both flows.

The operator path:

- `useCreateAndFundConfidentialAirdropAndGetAddress` deploys the clone and funds it from the maintainer's balance in one create-and-fund call, returning the new campaign address.
- `encryptUint64` encrypts each recipient's allocation, bound to that recipient's address and the campaign contract.
- `useSignClaimAuthorization` produces a **per-recipient EIP-712 claim authorization** — the maintainer (who holds `DEFAULT_ADMIN_ROLE` on their own clone) signs the exact encrypted handle for each recipient. The signature commits to that handle; re-encrypting invalidates it.

The claim path uses `useGetClaimAmount` and `useClaim` to read the recipient's encrypted allocation and submit their signed authorization on-chain.

---

## Architecture

**Operator flow**

1. Import a GitHub repository and its contributors.
2. Allocate — flat, weighted by commits, or manual — against a total budget.
3. Authorize the factory as an ERC-7984 operator (`setOperator`, scoped to the campaign deadline) so the create-and-fund call can pull the confidential token.
4. Fund and seal: deploy the clone, then encrypt and sign one claim authorization per recipient.

**Claim flow**

1. Open the personal link.
2. Decrypt the allocation handle in the browser with the connected wallet (FHE user-decryption).
3. Claim by submitting the signed authorization.
4. See the receipt.

**No database, by design.** There is no backend store for claim payloads. Each `/c/[id]` link *is* the payload: a base64url-encoded blob carrying the campaign address, the recipient address, the encrypted input, and the maintainer's EIP-712 signature. The contract verifies the signature and tracks replay protection on-chain, so nothing needs to be persisted server-side. A thin, keyless `TacetCampaignRegistry` stores only public campaign metadata (title, repo URL, deadline) keyed by campaign address.

---

## Key engineering decisions

**Audited contract, not a custom one.** Confidential distribution is done through the OpenZeppelin-audited `ConfidentialAirdropCloneable`. Reimplementing ACL grants, attestations, and KMS proof verification would add risk without adding value; the small piece of original Solidity here is the registry, which holds no funds and has no admin key.

**Client-side FHE decryption.** Allocations are decrypted in the recipient's browser, never on a server. That requires the FHEVM WASM to run under cross-origin isolation, so the app sets `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp`. The decryption right is bound to the wallet — the same link opened by the wrong wallet reveals nothing.

**Stateless claim links.** Because the encrypted payload and signature travel inside the link, the system has no database, no server-side secrets to leak, and nothing to keep in sync. A campaign is fully described by what is on-chain plus what is in each recipient's URL.

---

## Roadmap & known limits

- **Recipient scale.** The maintainer signs one claim authorization per recipient today, which caps a practical campaign at roughly 30 recipients. The planned next step is Merkle-root batching, collapsing the whole campaign into a single signature.
- **Contributor import.** CSV upload (address, github_handle, commits) is the current entry path. GitHub-native contributor import with inline wallet entry is planned to replace it as the primary flow.

---

## Tech stack

- **Frontend** — Next.js 15 (App Router), React 19, TypeScript (strict), Tailwind CSS, Framer Motion
- **Chain** — viem, wagmi, RainbowKit; Sepolia testnet
- **FHE** — `@zama-fhe/sdk` (input encryption), `@zama-fhe/react-sdk` (wallet-bound user decryption)
- **Confidential distribution** — `@tokenops/sdk`
- **Contracts** — Foundry (`TacetCampaignRegistry`, Solidity 0.8.27)
- **Deployment** — Vercel (frontend), Sepolia (contracts)

---

## Run locally

**Prerequisites:** Node 20+, pnpm 9+, a Sepolia RPC URL, a GitHub OAuth app.

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local   # then fill in the values below
pnpm dev                                        # http://localhost:3000
```

Environment variables (`apps/web/.env.local`):

```
NEXTAUTH_URL
NEXTAUTH_SECRET
GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET
NEXT_PUBLIC_SEPOLIA_RPC
NEXT_PUBLIC_RELAYER_URL
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
NEXT_PUBLIC_REGISTRY_ADDRESS

# deploy-time only (contracts), never a main wallet
DEPLOYER_PRIVATE_KEY
ETHERSCAN_API_KEY
```

Contracts:

```bash
cd packages/contracts
forge build
forge test
forge script script/Deploy.s.sol:Deploy --rpc-url $SEPOLIA_RPC --broadcast --verify
```

---

## Deployed contracts (Sepolia)

| Contract | Address |
|---|---|
| `TacetCampaignRegistry` (verified) | `0x7b8b93f7be58fc677d6fd97addeb4740a97d65cc` |
| `ConfidentialAirdropFactory` (TokenOps) | `0xbE6A3B78B36684fFee48De77d47Bc3393F5Acd4c` |
| Confidential token, ERC-7984 (CTTT) | `0x258F9D60dc023870e4E3109c894D834D5377361a` |

---

## Built on

- [Zama Protocol](https://www.zama.ai/) — FHEVM
- [TokenOps SDK](https://docs.tokenops.xyz/) — confidential airdrop contracts, audited by OpenZeppelin
- [ERC-7984](https://eips.ethereum.org/EIPS/eip-7984) — confidential token standard
