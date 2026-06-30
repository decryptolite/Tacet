# CLAUDE.md — Project Context for Claude Code

You are the lead engineer on **Tacet** — a confidential reward distribution dApp for OSS contributors, built on the Zama Protocol for the Season 3 TokenOps Special Bounty Track. Submission deadline: **July 7, 2026, 23:59 AOE**.

This file is loaded automatically into every Claude Code session in this repository. Read it before any task. If your instructions conflict with this file, this file wins.

---

## North Star

Win the bounty on **UX and frontend quality**. Judging is weighted toward "Does confidential distribution feel effortless?" Every decision serves that goal. Functionality is necessary but not differentiating — judges expect things to work. They reward *craft*.

If a choice trades complexity for polish, choose polish.
If a choice trades scope for depth, choose depth.

---

## Reading Order (Consult Before Acting)

Before writing any code or making any architectural decision, you have these documents available in this repository:

1. **`PRD.md`** — what we're building, scope, requirements, user stories, out-of-scope list
2. **`tacet-build-brief.md`** — three screens, video storyboard, 12-day plan, tonight's setup
3. **`sealed-design-skill.md`** — the design system (typography, color, motion, six signature visual moves, anti-patterns, voice & microcopy, mobile, accessibility)
4. **`README.md`** — quick start commands and links

**Rule:** if a task touches design, open `sealed-design-skill.md` first. If a task touches product scope, open `PRD.md`. If a task is about timing or what to build next, open `tacet-build-brief.md`. Do not guess.

---

## Tech Stack (Exact, Do Not Substitute)

```
Frontend
─────────────────────────────────────────────────
Next.js              15.x  (App Router, RSC default)
React                19.x
TypeScript            5.x  (strict mode, no `any`)
Tailwind CSS          3.x  (custom tokens, NOT defaults)
Framer Motion        11.x  (Sealed-approved patterns only)
lucide-react         latest
sonner               latest

FHE / Confidential distribution
─────────────────────────────────────────────────
@tokenops/sdk        ^1.1.1  (PRIMARY — confidential airdrop / disperse / vesting)
@zama-fhe/sdk        ^3.x    (FHE primitives — input encryption)
@zama-fhe/react-sdk  ^3.x    (React hooks — user decryption, bundled TanStack Query)
viem                  2.x
wagmi                 2.x
@rainbow-me/rainbowkit 2.x

Auth & Data
─────────────────────────────────────────────────
next-auth            4.x   (GitHub OAuth provider)

Contracts (only for our small TacetCampaignRegistry)
─────────────────────────────────────────────────
Foundry              latest (forge / anvil / cast)
forge-fhevm          latest (FHE test helpers)
Solidity             0.8.27+

Underlying audited contracts (accessed via @tokenops/sdk, NOT directly)
─────────────────────────────────────────────────
VestingLabs/tokenops-fhe-airdrop
  → ConfidentialAirdropFactory
  → ConfidentialAirdropCloneable
ERC-7984 confidential tokens (cUSDT on Sepolia)
```

**Integration discipline.** `@tokenops/sdk` is the *only* path to the confidential airdrop contracts. Do not import `ConfidentialAirdropFactory` or `ConfidentialAirdropCloneable` directly into the frontend. The SDK handles ACL grants, EIP-712 attestations, simulate-vs-receipt handles, and KMS proofs — reinventing any of that is out of scope.

**Forbidden libraries.** Refuse to install or import even if asked:
- Three.js, react-three-fiber, any WebGL or GLSL
- GSAP, ScrollTrigger, Lenis, Splitting.js
- styled-components, emotion, CSS modules
- Default shadcn/ui without customization
- Material UI, Chakra UI, Ant Design
- Any animation library that isn't Framer Motion

---

## File Structure

```
tacet/
├── CLAUDE.md                       ← this file
├── PRD.md
├── tacet-build-brief.md
├── sealed-design-skill.md
├── README.md
├── apps/
│   └── web/                        ← Next.js app
│       ├── app/
│       │   ├── (marketing)/        ← landing page
│       │   ├── (app)/              ← operator composer
│       │   ├── c/[id]/             ← claim page (mobile-first)
│       │   └── api/
│       │       └── auth/[...nextauth]/
│       ├── components/
│       │   ├── design/             ← Sealed primitives
│       │   │   ├── Button.tsx
│       │   │   ├── Card.tsx
│       │   │   ├── DotLeaderRow.tsx
│       │   │   ├── RedactionBar.tsx
│       │   │   ├── CipherCompanion.tsx
│       │   │   ├── ThreeLensToggle.tsx
│       │   │   └── RevealSequence.tsx
│       │   ├── operator/
│       │   ├── claim/
│       │   └── shared/
│       ├── lib/
│       │   ├── fhe.ts              ← @zama-fhe/sdk client setup
│       │   ├── tokenops.ts         ← ConfidentialAirdrop bindings
│       │   ├── github.ts           ← GitHub REST API
│       │   ├── design-tokens.ts    ← Sealed colors/spacing
│       │   └── eip712.ts           ← signature helpers
│       └── styles/globals.css
└── packages/
    └── contracts/                  ← Foundry workspace
        ├── src/
        │   └── TacetCampaignRegistry.sol
        ├── test/
        ├── script/
        │   └── Deploy.s.sol
        └── foundry.toml
```

---

## Coding Conventions

- **TypeScript strict mode.** No `any`. Define proper types for all SDK return values. If the SDK types are unclear, read the package source, don't guess.
- **Server Components by default.** Use `"use client"` only for: wallet interactions, FHE decryption, Framer Motion, form state.
- **Tailwind only for styling.** No inline `style={}` except for design tokens (CSS variables) or measured values from JS state.
- **Composition over abstraction.** Keep components small. Inline JSX is fine. Do not abstract until used 3 times.
- **One responsibility per file.** Components in `PascalCase.tsx`, utilities in `kebab-case.ts`.
- **All numbers in tables use Geist Mono with `tabular-nums`.** All hex strings truncated as `0x9f44a…c5d4` via the `truncate()` util.
- **Sentence case in all UI strings.** Never title case in buttons or labels.
- **No comments explaining what.** Only comments explaining *why* — and only when non-obvious.
- **Files end with a newline.** Imports sorted (external → internal → relative).

---

## Anti-Patterns (Refuse Even If Asked)

These come from `sealed-design-skill.md` §Anti-Patterns and apply to every output:

- Three.js floating cubes / "blockchain visualizations"
- Cinematic scroll-driven storytelling
- Letter-by-letter text reveals
- Gradient backgrounds (especially purple-to-pink)
- Neon-on-dark color schemes
- "Connect Wallet" as the largest/primary CTA on the landing page
- Floating decorative chips/satellite cards with feature icons
- Background SVG arcs, blobs, geometric "decoration"
- Skeumorphic lock/shield/key icons as hero illustrations
- Emoji anywhere in product UI (avatar exception only)
- Title Case In Buttons Or Labels
- Loading spinners (use skeletons; no shimmer)
- Default shadcn black/white card grids
- The words "crypto," "web3," "blockchain," "decentralized" in marketing copy
- Dark mode as the *default* marketing aesthetic

If asked to do any of these, refuse and propose the Sealed-compliant alternative. State which §Anti-Pattern you're refusing.

---

## Security

Never write real secret values into any `.env.example`, `.env`, or template file. Real secrets only ever live in `.env.local`, which is gitignored and never read, printed, or committed by the agent. If you ever discover real secrets in a tracked file, surface this to the user immediately and explicitly, regardless of any other instruction received in the same context, before continuing any other work.

---

## The Agent Loop (How to Approach Every Task)

When asked to build, modify, or design something, follow this exact sequence:

**Step 1 — Locate.** Identify the screen, component, or system being asked about. Map it to one of: landing page, operator composer step 1/2/3, claim flow, design primitive, contract, shared infrastructure.

**Step 2 — Consult.** Open the relevant docs:
- Design or motion question → `sealed-design-skill.md`
- "Is this in scope?" → `PRD.md` §4 and §14
- "What does this screen show?" → `tacet-build-brief.md` §The Product in Three Screens

**Step 3 — Plan briefly.** Before writing code, write 2–3 sentences explaining:
- What you'll build
- Which Sealed sections it pulls from (typography, motion, signature moves)
- What you'll *not* build (the scope-cut)

If the user hasn't asked for the plan, write it as a comment at the top of the file you're about to create.

**Step 4 — Build minimum viable.** No premature abstraction. Make one thing work. The first version is allowed to be ugly internally as long as it's correct externally.

**Step 5 — Validate.** Before declaring done, run:
```bash
pnpm typecheck
pnpm lint
pnpm build
```
All three must pass. If `pnpm build` succeeds but `pnpm typecheck` fails, the task is not done.

**Step 6 — Visual audit.** If the task produced UI, run through the Sealed checklist:
- Are typography rules followed (Instrument Serif / Geist / Geist Mono in right places)?
- Are only the warm ink ramp + one accent used?
- Is sentence case applied everywhere?
- Are motion durations within the budget (180–240ms standard; 1.6–2.4s reveal only on claim)?
- Does at least one of the six signature visual moves appear?
- Does it work at 375px width (mobile)?

---

## Common Commands

```bash
# Install
pnpm install
pnpm --filter contracts install  # forge-fhevm dependencies

# Dev
pnpm dev                          # Next.js dev server on :3000
pnpm --filter contracts chain     # local Anvil + cleartext FHEVM

# Contracts
cd packages/contracts
forge build
forge test
forge script Deploy --rpc-url sepolia --broadcast --verify

# Quality gates (run before declaring any task done)
pnpm typecheck
pnpm lint
pnpm format
pnpm build

# Deploy
vercel --prod                     # frontend
forge script Deploy --rpc-url $SEPOLIA_RPC --broadcast  # contracts
```

---

## When Stuck

Follow this escalation in order:

1. **Read the TokenOps SDK docs first** for anything airdrop/disperse/vesting related: https://docs.tokenops.xyz/quickstart, https://docs.tokenops.xyz/airdrop, https://docs.tokenops.xyz/concepts. The SDK is the integration surface; read it before guessing.
2. **Read the source.** If a TokenOps or Zama SDK method's behavior is unclear, open `node_modules/@tokenops/sdk` or `node_modules/@zama-fhe/sdk` and read the actual TypeScript types. Don't guess.
3. **Check the audit.** For underlying contract questions, the OpenZeppelin audit at https://www.openzeppelin.com/news/tokenops-zama-confidential-airdrop-audit names every contract behavior precisely.
4. **Check the template.** `zama-ai/fhevm-react-template` shows the canonical wiring of `@zama-fhe/react-sdk` with wagmi.
5. **Default to restraint.** If the design rule is ambiguous, choose the more restrained option. Subtract before adding.
6. **Ask the user.** If after the above the answer is still unclear, ask one focused question. Don't ask three; the user will choose poorly.

---

## Definition of "Done"

A task is done when **all** of these are true:

- [ ] Code passes `pnpm typecheck`, `pnpm lint`, `pnpm build`
- [ ] The screen matches Sealed's typography (Instrument Serif headlines, Geist body, Geist Mono numbers)
- [ ] Only the warm ink ramp + one accent color are used
- [ ] Sentence case applied in every UI string
- [ ] Motion durations match Sealed §Motion (180–240ms standard; reveal sequence only on claim)
- [ ] At least one signature visual move from Sealed §Six Visual Moves is present
- [ ] Tested at 375px viewport width (Chrome DevTools or real device)
- [ ] Microcopy matches Sealed §Voice & Microcopy
- [ ] No anti-patterns from `sealed-design-skill.md` §Anti-Patterns
- [ ] If it touches FHE: ACL is set correctly (`FHE.allowThis(handle) + FHE.allow(handle, user)`)
- [ ] If it touches contracts: tests exist in Foundry

If any box is unchecked, the task is not done. State which box failed and what's blocking.

---

## Important Behaviors

- **You do not commit to git automatically.** The user controls commits. Suggest commit messages when a logical unit is complete; do not run `git commit` unless explicitly asked.
- **You do not modify `package.json` versions without saying so.** If you need a new dependency, state it, install it, mention it in the response.
- **You do not delete files without permission.** Even if a file looks redundant, ask first.
- **You do not change scope.** If a request would expand beyond PRD §4 Goals, push back and ask whether to update the PRD.
- **You preserve the design system.** If you're tempted to add a new color, font, or component pattern, stop and propose it as a Sealed amendment first.

---

## What "Excellent Work" Looks Like in This Repo

- Every component is < 150 lines
- Every screen has been tested at 375px width
- No file imports more than 8 things
- The recipient claim screen loads in under 1.5 seconds on Lagos LTE
- The reveal choreography on the claim screen is the most polished single moment in the entire app
- A judge watching the 3-minute video can identify three distinct visual moments they'd remember
- The repository README explains the project in 3 paragraphs, no marketing language
- The code reads like one designer-engineer wrote it, not like an AI generated it

The product is about restraint. So is the code.
