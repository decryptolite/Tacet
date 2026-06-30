# Tacet — Product Requirements Document

> Confidential rewards for open-source contributors. Built on the Zama Protocol using the TokenOps confidential airdrop contracts and the Zama React SDK. Submission for the **Zama Developer Program Mainnet Season 3 — TokenOps Special Bounty Track**. Deadline: July 7, 2026, 23:59 AOE.

---

## 1. Overview

Tacet is a confidential reward distribution platform for open-source maintainers, DAOs, and grant programs. A maintainer connects a GitHub repository, the system ranks contributors by activity, the maintainer sets reward amounts, and each contributor receives a *sealed* allocation. The chain stores ciphertext only; recipients decrypt and claim privately. Maintainers see the full distribution; the public sees handles.

The product makes "fair OSS compensation" possible without making "everyone's salary public."

---

## 2. Problem Statement

Current OSS reward platforms (Gitcoin Grants, Optimism RetroPGF, GitHub Sponsors, Drips) publish payout amounts on-chain. Public payouts cause four real problems:

1. **Anchoring & negotiation** — public top-of-list amounts become the ceiling everyone else is benchmarked against
2. **Gaming** — contributors optimize for visible-leaderboard metrics, not value
3. **Jurisdictional risk** — token income visibility creates compliance and personal-safety problems for contributors in certain regions
4. **Salary leakage** — colleagues at the same project see each other's compensation; new hires negotiate from public anchors

FHE solves this by encrypting amounts at the chain level while preserving the ability to verify, distribute, and claim trustlessly.

---

## 3. Target Users

### Primary: The Maintainer (Operator)
A core maintainer of an OSS project, DAO contributor lead, or grant program manager. They run quarterly or one-time reward campaigns with a budget in stablecoin (cUSDT), need to rank contributors fairly, and want privacy for both ethical and competitive reasons.

### Primary: The Contributor (Recipient)
A developer or community member who has contributed code, reviews, issues, or other work. They have an Ethereum wallet, may or may not be familiar with FHE, care about receiving their reward quickly, and don't want their compensation to be public.

### Secondary: The Public Observer
Anyone viewing the chain. Sees the campaign exists, sees which addresses participate, cannot see allocation amounts.

---

## 4. Goals & Non-Goals

### Goals (MVP)

- Maintainer can create one confidential reward campaign from a GitHub repo end-to-end in under 5 minutes
- Contributors can claim their allocation in under 60 seconds from landing
- The three lenses (operator / recipient / public) are visually distinct and load with real Sepolia data
- Production-deployed demo on Sepolia
- 3-minute video pitch + X thread submitted before deadline

### Non-goals (refuse even if asked during build)

- Multi-campaign dashboard for the maintainer
- Recurring / scheduled distributions
- Multiple token support (cUSDT only)
- Email or push notifications
- Public leaderboard / social features
- Tax exports
- Audit log viewer
- Maintainer-side analytics
- Multi-chain (Sepolia only)
- Delegated decryption for auditors (compelling v2 differentiator — see §15)

---

## 5. User Stories

### Maintainer flow

| ID | Story |
|---|---|
| US-1 | As a maintainer, I can connect my wallet so I can sign distribution transactions |
| US-2 | As a maintainer, I can connect my GitHub account so the app can read repo contributors |
| US-3 | As a maintainer, I can paste a GitHub repo URL and see a list of contributors with activity metrics |
| US-4 | As a maintainer, I can choose an allocation formula (flat, commits-weighted, manual) and see live per-recipient amounts in operator lens |
| US-5 | As a maintainer, I can review the full encrypted distribution before deploying |
| US-6 | As a maintainer, I can deploy the campaign with one signature + one transaction |
| US-7 | As a maintainer, I can share a claim link with my contributors |

### Contributor flow

| ID | Story |
|---|---|
| US-8 | As a contributor, I can land on a campaign page from a shared link |
| US-9 | As a contributor, I can connect my wallet and see I have a sealed allocation |
| US-10 | As a contributor, I can reveal my allocation amount privately via FHE user-decryption |
| US-11 | As a contributor, I can claim my allocation in one transaction |
| US-12 | As a contributor, I can save a receipt of my claim |

### Public observer

| ID | Story |
|---|---|
| US-13 | As any visitor, I can see the campaign exists and is verifiable on Sepolia Etherscan |
| US-14 | As any visitor, I see ciphertext handles in place of amounts |

---

## 6. Functional Requirements

### FR-1: Maintainer onboarding
- Wallet connection via wagmi + RainbowKit
- GitHub OAuth via NextAuth.js
- Both required before campaign creation
- GitHub scope: `public_repo` for public repos; `repo` if private support added later

### FR-2: Repository import
- Paste public GitHub repo URL → fetch top N contributors via GitHub REST API `/repos/{owner}/{repo}/contributors`
- Display: avatar, handle, commits, additions, deletions, PR count (separate API call)
- CSV upload as alternative path (columns: address, github_handle, commits)
- Per-row toggle to include/exclude

### FR-3: Allocation composer
- Set total budget in cUSDT (enforce wallet balance check)
- Three formula options:
  - **Flat**: equal split across all included recipients
  - **Commit-weighted**: proportional to commit count
  - **Manual**: per-row sliders, validates sum ≤ budget
- Live update of per-recipient amounts in operator lens (the only viewer who sees all amounts)
- Encrypted total preview ("sealed" status indicator)

### FR-4: Campaign deployment
- Client-side: encrypt amounts using `@zama-fhe/sdk` to produce `externalEuint64` ciphertexts + ZK proofs
- Pass the encrypted handles + recipient addresses to the `@tokenops/sdk` airdrop deploy flow
- The SDK signs EIP-712 attestations per recipient and deploys a `ConfidentialAirdropCloneable` clone via the factory
- Register the deployed airdrop address in our `TacetCampaignRegistry` along with title, repo URL, deadline
- Surface the Sepolia Etherscan link in the success state

### FR-5: Claim experience
- Route: `/c/{campaignId}`
- Recipient lands → reads campaign metadata from `TacetCampaignRegistry` → resolves airdrop contract address
- Shows sealed state with redaction bar over the amount
- "Reveal my share" → calls `useUserDecryption` from `@zama-fhe/react-sdk` against the recipient's encrypted handle → shows decrypted amount with the choreographed reveal sequence (1.6–2.4s, per Sealed §Motion)
- Show ciphertext companion caption below the decrypted amount
- "Claim X cUSDT" → calls the `@tokenops/sdk` claim flow, which submits the EIP-712-signed attestation to the airdrop contract
- Post-claim receipt screen with a downloadable PNG receipt (html2canvas capture of the rendered card, 2x scale)

### FR-6: Three Lenses
- Persistent toggle component showing same campaign through three views
- Operator: full list with amounts in mono
- Recipient: only their own row (others redacted) — requires recipient wallet connected to render
- Public: ciphertext handles only, no amounts

---

## 7. Non-Functional Requirements

- **Performance:** First Contentful Paint < 1.2s on Lagos LTE (~7 Mbps); Time to Interactive < 2.5s
- **Lighthouse:** > 90 on Performance, Accessibility, Best Practices, SEO
- **Mobile:** recipient claim flow must work flawlessly on mobile Safari and Chrome below 768px
- **Accessibility:** WCAG AA contrast (Sealed neutral ramp clears this at 14.3:1); keyboard navigation; `prefers-reduced-motion` removes all motion > 200ms
- **Browser support:** Latest 2 versions of Chrome, Safari, Firefox, Edge
- **Bundle size:** < 250kb gzipped initial JS (excluding FHE WASM)

---

## 8. Technical Architecture

### SDK layer (primary integration)
- **`@tokenops/sdk` v1.1.1+** — the typed, viem-first SDK that wraps Zama's FHEVM stack for confidential vesting, airdrops, and disperse. This is the primary integration path. Handles ACL grants, EIP-712 signatures, simulate-vs-receipt parsing, KMS proofs, and scaled integers behind a clean typed surface.
- For Tacet's MVP we use the `fhe-airdrop` flow: deploy a campaign clone, sign per-recipient `{recipient, encryptedAmount}` attestations, recipients call claim.
- Per-recipient amounts are `euint64` ciphertexts with per-recipient ACL grants.

### FHE primitives layer
- **`@zama-fhe/sdk` ^3.x** — core. Used for client-side input encryption (encrypting allocation amounts before passing them to the TokenOps SDK).
- **`@zama-fhe/react-sdk` ^3.x** — React hooks. Used for user-decryption on the recipient side (EIP-712-gated decryption requests via the Zama relayer). Bundles TanStack Query for caching.

### Underlying audited contracts (reference, not direct calls)
The TokenOps SDK abstracts these — we do not call them directly:
- `ConfidentialAirdropFactory` (deploys clones via CREATE3)
- `ConfidentialAirdropCloneable.sol` (per-campaign instance, EIP-712 verification)
- Audited by OpenZeppelin (January 2026)
- Each campaign distributes one ERC-7984 confidential token (cUSDT on Sepolia)

### Custom contract (one thin contract we own)
A small registry contract sits next to the TokenOps airdrop to store off-chain-discoverable metadata that TokenOps doesn't need but Tacet does:

```solidity
// TacetCampaignRegistry.sol — stores metadata that maps to TokenOps airdrop instances
contract TacetCampaignRegistry {
  struct Campaign {
    address airdropAddress;   // address returned by @tokenops/sdk on deploy
    address maintainer;
    string title;             // "Q3 OSS rewards"
    string repoUrl;
    uint256 deadline;
    uint256 createdAt;
  }
  mapping(bytes32 => Campaign) public campaigns;
  event CampaignRegistered(bytes32 indexed id, address indexed airdrop, address indexed maintainer);
}
```

### Frontend stack (exact)
```
Next.js 15 (App Router) + TypeScript 5
Tailwind CSS (custom tokens per Sealed)
@tokenops/sdk ^1.1.1       ← primary confidential distribution SDK
@zama-fhe/sdk ^3.x         ← FHE primitives (encrypt inputs)
@zama-fhe/react-sdk ^3.x   ← React hooks (user decryption)
viem ^2.x + wagmi ^2.x + RainbowKit ^2.x
next-auth ^4.x             ← GitHub OAuth
framer-motion ^11.x        ← Sealed-approved motion patterns only
lucide-react               ← icons
sonner                     ← toasts
```

### Contract tooling (for the Tacet registry contract only)
```
Foundry (forge / anvil / cast)
forge-fhevm for testing
Solidity 0.8.27+
```

### Off-chain
- GitHub REST API for contributor data
- Vercel deployment (free tier)
- No custom backend — Next.js API routes handle GitHub OAuth callbacks
- Campaign metadata stored in the on-chain `TacetCampaignRegistry`; off-chain caching via TanStack Query

---

## 9. Data Model

### Campaign (on-chain registry + ConfidentialAirdrop)
```ts
type Campaign = {
  id: string;                     // bytes32 keccak hash
  airdropAddress: Address;        // ConfidentialAirdropCloneable
  registryAddress: Address;       // TacetCampaignRegistry
  maintainer: Address;
  title: string;
  repoUrl: string;
  deadline: number;               // unix
  createdAt: number;
  recipients: Recipient[];        // off-chain only
};

type Recipient = {
  address: Address;
  githubHandle: string;
  encryptedAmountHandle: string;  // ciphertext handle 0x...
  eip712Signature: string;        // operator's sig
  claimed: boolean;
};
```

### On-chain state (ConfidentialAirdrop)
- `factory`, `admin`, `signer`, `token` (ERC-7984)
- `claimed[address]` mapping
- Per-recipient verification via EIP-712 signature recovery

---

## 10. User Flows

### Maintainer (10 steps)
1. Land on `/`
2. Click "Launch app"
3. Connect wallet (RainbowKit)
4. Connect GitHub (NextAuth)
5. Click "New distribution"
6. Step 1: Paste repo URL → contributors load → select/deselect rows
7. Step 2: Set budget + formula → live allocation preview
8. Step 3: Review → click "Seal and deploy"
9. Sign EIP-712 attestations + execute deploy tx
10. See success screen with claim link to share

### Contributor (10 steps)
1. Receive claim link
2. Land on `/c/{id}`
3. Connect wallet
4. See "You have a sealed allocation from [maintainer]"
5. Click "Reveal my share"
6. FHE user-decryption (~2–6s, with reveal choreography masking the wait)
7. See decrypted amount in editorial display + ciphertext caption
8. Click "Claim X cUSDT"
9. Sign claim transaction
10. See "Claimed. Receipt saved." + downloadable PDF receipt

---

## 11. Screens

See `tacet-build-brief.md` for screen-level designs. Three screens get full design treatment per `sealed-design-skill.md`:

1. **Landing page** — three-lens hero, editorial headline, single primary CTA
2. **Operator composer** — three-step flow with live allocation preview
3. **Recipient claim** — mobile-first, reveal choreography, receipt artifact

Empty states, error states, settings follow Sealed defaults.

---

## 12. Edge Cases & Error Handling

| Case | Behavior |
|---|---|
| Wallet not connected | Block CTA, prompt to connect |
| GitHub OAuth fails | Fallback to CSV upload, message in Geist Mono |
| Repo has > 100 contributors | Paginate, default to top 50 by commits |
| Allocation total exceeds wallet balance | Block deploy, clear message in Sealed error pattern |
| Recipient claims twice | Contract reverts, frontend shows "Already claimed" |
| Campaign deadline passes | Claim disabled, "Campaign expired" state |
| User decryption fails | Retry button, technical error in Geist Mono caption |
| Slow FHE operations (> 1s) | Skeleton state, no spinner, optional progress bar |
| Wallet rejects signature | "Wallet rejected the signature" + retry |
| Network drop mid-deploy | Show "Reconnect to continue" with intermediate state preserved |

---

## 13. Success Metrics

### For winning the bounty
- 3-minute video tells a clear story in 3 acts (setup → reveal → three lenses)
- Demo works flawlessly end-to-end on first try
- Lighthouse > 90 across all categories
- X thread has 5 posts with at least one shareable screenshot
- Code is fully typed, documented, and passes lint + typecheck

### Real-world adoption signals (post-bounty)
- Time from "open repo" to "deployed campaign" < 5 minutes
- Time from "land on claim page" to "claimed" < 60 seconds
- Mobile claim completion rate > 80%
- Maintainer NPS via informal feedback after 5 real campaigns

---

## 14. Out of Scope (Explicit Refusal List)

These are valuable features that will not be built for this MVP. They are flagged here so Claude Code refuses to start building them mid-stream:

- Multi-chain deployment (Sepolia only)
- Multi-token support (cUSDT only)
- Recurring distributions
- Email/SMS notifications
- Public leaderboard or social features
- Maintainer-side analytics dashboard
- Audit log viewer
- Multi-signer governance
- Tax / accounting export
- Custom subdomain per maintainer
- Delegated decryption (see §15)

---

## 15. Open Questions & v2 Considerations

- **Delegated decryption** as a compliance differentiator: Zama supports delegating decryption to an auditor address. A maintainer could grant a regulator or accountant temporary decryption rights without revealing to recipients. **Strong v2 feature** — if Day 9 polish day finishes early, consider as a stretch goal.
- cUSDT faucet reliability on Sepolia — verify Day 1 before committing budget assumptions to demo
- Gas cost per claim — estimate and document in README
- IPFS vs Vercel KV for off-chain metadata storage — defer until Day 6

---

## 16. References

- Zama Protocol docs: https://docs.zama.org/protocol
- **TokenOps SDK docs (primary integration reference): https://docs.tokenops.xyz/**
- **TokenOps SDK Quickstart: https://docs.tokenops.xyz/quickstart**
- **TokenOps Airdrop product: https://docs.tokenops.xyz/airdrop**
- **TokenOps Concepts (three lenses, ACL, handles): https://docs.tokenops.xyz/concepts**
- TokenOps Testnet Faucet: https://docs.tokenops.xyz/testnet-faucet
- TokenOps deployed addresses + audits: https://docs.tokenops.xyz/resources
- TokenOps SDK npm: https://www.npmjs.com/package/@tokenops/sdk
- Zama SDK: https://github.com/zama-ai/sdk
- Underlying audited contracts: https://github.com/VestingLabs/tokenops-fhe-airdrop
- OpenZeppelin audit: https://www.openzeppelin.com/news/tokenops-zama-confidential-airdrop-audit
- FHEVM React template (boilerplate): https://github.com/zama-ai/fhevm-react-template
- Bounty page: https://www.zama.org/post/zama-developer-program-mainnet-season-3-composable-privacy-is-the-key
