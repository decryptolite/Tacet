# STATE.md — Current Truth (supersedes day-numbering everywhere else)

> Read this file FIRST, before CLAUDE.md, before PRD.md, before tacet-build-brief.md. This file states what is ACTUALLY true about the codebase right now. Other docs may contain stale assumptions, aspirational file trees, or day-numbered plans that no longer match reality. Where any other doc conflicts with this file, this file wins. Update this file's "Last verified" line whenever you change it.

**Last verified:** 2026-06-30 by Claude Code — post-commit, post-CSS-audit, post-SDK-script-pass
**Deadline:** July 7, 2026, 23:59 AOE — 7 days remaining

---

## Standing rule for this session and every session after

When given an instruction to fix, build, or test something: **attempt the fix in the same turn**, immediately. A status table describing what already exists is not a substitute for doing the work. Do not re-diagnose something already diagnosed in a previous turn — implement the fix already identified. Only stop and ask the user a question if genuinely blocked by something requiring their physical action (funding a wallet, clicking a UI element, supplying a credential) — state that single blocking need in one sentence and stop. Do not pad responses with analysis already given.

---

## What is VERIFIED WORKING right now

- `TacetCampaignRegistry` deployed and verified on Sepolia at the address in `apps/web/.env.local`'s `NEXT_PUBLIC_REGISTRY_ADDRESS`
- Contract compiles, 8/8 Foundry tests pass (as of last run — re-run to confirm if more than a few days have passed)
- `pnpm typecheck`, `pnpm lint`, `pnpm build` all pass clean (excluding two known-benign third-party warnings: `@react-native-async-storage/async-storage` from MetaMask SDK, `pino-pretty` from WalletConnect logger — both irrelevant to web builds, do not attempt to fix)
- `fetchContributors()` makes a real GitHub REST API call, no stub data
- `getClaimData()` reads real on-chain state from the registry, no demo fallback
- Claim authorization generation (`encryptUint64` + `signClaimAuthorization` per recipient) is implemented in `ReviewStep.tsx`'s deploy flow
- `ClaimExperience.tsx` has the correct raw-unit conversion (divide by 10^6 for ERC-7984 display)
- `app/c/[id]/error.tsx` exists as a Sealed-compliant error boundary
- **Production CSS is 100% correct**: `pnpm build` output (`apps/web/.next/static/css/app/layout.css`, 83KB) contains all custom classes: `.bg-ink-50`, `.text-ink-1000`, Instrument Serif, Geist fonts, amber accent — confirmed by direct inspection
- **`toEncryptor` adapter confirmed correct**: `RelayerCleartext.encrypt()` returns `{ encryptedValues: string[], inputProof: string }` (hex strings, NOT Uint8Arrays). The adapter correctly converts these to `{ handles: Uint8Array[], inputProof: Uint8Array }`. Tests pass: `apps/web/scripts/test-sdk.cjs`
- **`signClaimAuthorization` API surface confirmed**: Returns valid 65-byte EIP-712 sig with correct test wallet
- **Live Sepolia factory confirmed reachable**: `defaultGasFee: 3500000000000 wei`, implementation at `0x6FAb610C7218f208c68Cb106CD75e978FD42c86B`
- **Git repo initialized and committed**: Standalone git repo at `C:/Users/HP/Documents/Tacet`, 64 source files, commit `0ea325a`. `.env.local` confirmed absent from all commits.

## What is BUILT BUT UNVERIFIED (highest risk, fix order priority)

1. **`toEncryptor` adapter with real Zama relayer**: Confirmed correct for `RelayerCleartext` (hex → Uint8Array). The ACTUAL `useZamaSDK().relayer` (`RelayerDispatcher`) also returns `EncryptResult = { encryptedValues: EncryptedValue[], inputProof: Hex }` per type declarations — same format, adapter applies. Runtime test still needs a real browser session with Zama WASM WebWorker.
2. **Fund-on-create path** (`useCreateAndFundConfidentialAirdropAndGetAddress`) — never executed. Possible undocumented approval step requirement. Test requires real CTTT_SEPOLIA tokens.
3. **The full end-to-end claim loop** — has never been run once, by anyone, against real chain state. This is the single most important unresolved question in the entire project: does the product actually work?

## What does NOT exist yet

- **GitHub remote**: needs `git remote add origin <url> && git push -u origin main` — user must create the GitHub repo and run these commands
- **Vercel deployment**: needs GitHub remote first, then `vercel --prod` from `apps/web/`
- **Real end-to-end UI test**: requires wallet with ETH (~0.05 ETH for gas) + CTTT_SEPOLIA tokens

## What is OUT OF SCOPE — do not build, do not suggest, do not drift toward

- Multi-campaign dashboards, recurring distributions, multi-token support, NextAuth/GitHub OAuth flow (CSV + unauthenticated GitHub REST API is sufficient for the MVP and avoids OAuth complexity entirely)
- Any new third-party service, database, or backend beyond what's already wired
- Redesigning anything already implemented per the Sealed design system and the six finished Claude Design specs (Landing, Claim, ClaimFrame, Receipt, Operator, Showcase) — these are correct, do not second-guess them visually

## Fix order — do not reorder, do not skip ahead

1. ~~Commit + push to GitHub~~ ✓ Committed. **Pending: push** (user needs to create GitHub repo and run `git remote add origin` + `git push`)
2. ~~Fix the rendering bug definitively~~ ✓ Resolved: dev-mode timing only; production CSS is correct
3. ~~Script test of riskiest code paths~~ ✓ `apps/web/scripts/test-sdk.cjs` passes: adapter, encryptUint64, signClaimAuthorization, factory live read
4. **Now: walk the real UI end-to-end** — user physically present with two wallets, CTTT_SEPOLIA tokens obtained
5. Deploy to Vercel (needs GitHub remote first)
6. Polish, video, submission
