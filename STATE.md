# STATE.md — Current Truth (supersedes day-numbering everywhere else)

> Read this file FIRST, before CLAUDE.md, before PRD.md, before tacet-build-brief.md. This file states what is ACTUALLY true about the codebase right now. Other docs may contain stale assumptions, aspirational file trees, or day-numbered plans that no longer match reality. Where any other doc conflicts with this file, this file wins. Update this file's "Last verified" line whenever you change it.

**Last verified:** 2026-07-06 by Claude Code — post-72bd6a3, after a live end-to-end browser test on Sepolia confirmed the full operator→claim loop
**Deadline:** July 7, 2026, 23:59 AOE — ~1 day remaining

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
- **GitHub remote pushed**: `origin/main` exists and is up to date. The "push pending" note in older revisions of this file is obsolete.
- **Fund-on-create works** (`81cb4ca`): the factory is authorized as an ERC-7984 operator before the fund-on-create call, clearing the `0x79f2cb38` revert. Executed successfully against live Sepolia.
- **THE FULL OPERATOR→CLAIM LOOP IS VERIFIED END-TO-END** (post-`72bd6a3`, live browser test on Sepolia by the user):
  - Claim page renders the sealed allocation correctly (`fetchCampaignMeta` OK; real maintainer / title / deadline decoded)
  - Reveal runs the client-side FHE decrypt successfully — redaction bar resolved to a real number (40 cUSDT)
  - Claim transaction lands on-chain (tx `0x888f4…70500`), status "Claimed"
  - Receipt PNG saves and renders correctly
  - Confirmed with a second independent wallet, full end-to-end
  - **Do NOT touch or re-verify** the claim rendering, the decode, the reveal, or the FHE path — they work.

## What is BUILT BUT UNVERIFIED (highest risk, fix order priority)

**All three prior risks are BURNED DOWN as of the 2026-07-06 live browser test. Nothing remains in this section.**

1. ~~`toEncryptor` adapter with real Zama relayer~~ ✓ Exercised in the live reveal (FHE decrypt succeeded, real cleartext returned).
2. ~~Fund-on-create path~~ ✓ Works via `81cb4ca` (factory authorized as ERC-7984 operator). Executed on live Sepolia.
3. ~~The full end-to-end claim loop~~ ✓ VERIFIED end-to-end on live Sepolia with two independent wallets. See the verified-working section above for details.

## What does NOT exist yet

- **Vercel deployment**: `vercel --prod` from `apps/web/` (GitHub remote is now in place)
- **Error-state guard rails**: additive UI for strangers hitting wrong-wallet, already-claimed, expired, and no-gas states — does not exist yet, additive only, must not alter the working claim path
- **Two UX improvements**: recipient soft-cap warning, upfront signature-count notice, silent copy-link confirmation
- **Diagnostics cleanup**: strip `[tacet]` debug logging + the unused import
- **README + 3-min video + submission**

## What is OUT OF SCOPE — do not build, do not suggest, do not drift toward

- Multi-campaign dashboards, recurring distributions, multi-token support, NextAuth/GitHub OAuth flow (CSV + unauthenticated GitHub REST API is sufficient for the MVP and avoids OAuth complexity entirely)
- Any new third-party service, database, or backend beyond what's already wired
- Redesigning anything already implemented per the Sealed design system and the six finished Claude Design specs (Landing, Claim, ClaimFrame, Receipt, Operator, Showcase) — these are correct, do not second-guess them visually

## Fix order — do not reorder, do not skip ahead

1. ~~Commit + push to GitHub~~ ✓ Committed and pushed. `origin/main` is up to date.
2. ~~Fix the rendering bug definitively~~ ✓ Resolved: dev-mode timing only; production CSS is correct
3. ~~Script test of riskiest code paths~~ ✓ `apps/web/scripts/test-sdk.cjs` passes: adapter, encryptUint64, signClaimAuthorization, factory live read
4. ~~Walk the real UI end-to-end~~ ✓ VERIFIED on live Sepolia, two wallets, full operator→claim loop (2026-07-06). Core functionality is DONE.
5. **Now: error-state guard rails** — additive UI for wrong-wallet / already-claimed / expired / no-gas. Must not alter the working claim path.
6. Two UX improvements — recipient soft-cap warning, upfront signature-count notice, silent copy-link confirmation
7. Strip `[tacet]` diagnostics + unused import
8. Deploy to Vercel
9. README + 3-min video + submission
