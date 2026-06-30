# Tacet — Build Brief

> Confidential rewards for open-source contributors. Built on Zama Protocol + TokenOps SDK. Submission for the Zama Developer Program Mainnet Season 3 — TokenOps Special Bounty.

---

## What We're Building

Tacet is a confidential rewards platform for open-source maintainers, DAOs, and grant programs. A maintainer ranks contributors and ships a campaign — each contributor receives a *sealed* allocation that only they can decrypt and claim. The chain never sees the amounts. Other contributors don't see each other's payouts. The product makes "fair OSS compensation" possible without making "everyone's salary public."

Real-world analog: Gitcoin Grants, Optimism RetroPGF, GitHub Sponsors — all of which currently make payouts publicly. Tacet is what those flows would look like if they treated recipient amounts the way payroll treats salaries.

---

## What We're NOT Building (Scope Discipline)

This is the hardest part. Twelve days, one designer-engineer, one demo to ship. The submission is judged in 90 seconds. Build one excellent campaign, not a "platform."

Out of scope, refuse to add even if tempted:

- Multi-campaign dashboard for the operator (show the active campaign only)
- Recurring / scheduled distributions (one-shot only)
- Vesting (TokenOps supports it; we're using airdrop only)
- Multi-token support (cUSDT only)
- Email or push notifications
- Public claim leaderboard (defeats the point)
- Admin role management (the maintainer is god)
- Tax exports, accounting integrations
- A docs site (the README + landing page do this)
- Audit trail UI (the data is in events; we don't need a viewer)

If you find yourself reaching for any of these to feel "complete," you are losing time you need for polish on the three screens that matter.

---

## The Product in Three Screens

These are the only three screens that get full design treatment. Everything else (empty states, error states, settings) follows Sealed defaults.

### Screen 1 — The Maintainer's Composer (Operator)

The most complex screen. A three-step flow that turns "a list of contributors" into "an encrypted, deployed campaign." Document-style top header showing campaign reference + date.

- **Step 1: Recipients.** Paste a GitHub repo URL → the app calls the public GitHub Contributors API → contributors populate as a list with avatar, handle, commit count, additions/deletions. CSV upload as a fallback path. Toggle individual rows on/off.
- **Step 2: Allocations.** Set total budget in cUSDT. Pick a formula: flat split / weighted by commits / manual. The list re-renders with each contributor's amount in Geist Mono (tabulated, right-aligned). The maintainer sees every amount — this is the operator lens. The encrypted-total stays sealed onchain.
- **Step 3: Review and seal.** Final list, totals, deploy button. A confirmation modal explains what's about to happen. The deploy button copy: "Seal and deploy."

**The video moment on this screen:** the allocation slider dragging while numbers tabulate in real time, then the maintainer clicking "Seal and deploy," wallet signing, and a small "Sealed" stamp animating onto the campaign card. Restrained, document-grade celebration. No confetti.

### Screen 2 — The Contributor's Claim (Recipient) — Mobile First

The money shot. The screen judges open on their phone after watching the video.

- Document header (campaign name, ref, date)
- Body: "You have a sealed allocation from [maintainer name]."
- A redacted big number in the middle (solid ink-1000 rectangle where the amount would be)
- Primary action: "Reveal my share"
- On tap: the choreographed decryption reveal (1.6–2.4s, three beats per Sealed §Motion)
- Post-reveal: amount in Instrument Serif display + ciphertext companion caption beneath
- Receipt-style dot-leader rows: campaign · deadline · status
- Sticky bottom CTA: "Claim 8,200 cUSDT"
- Post-claim: "Claimed. Receipt saved." + a small "View receipt" link

**The video moment on this screen:** the reveal choreography itself. This is your shareable Twitter screenshot. Design it like a 2-second film, not a UI transition.

### Screen 3 — The Landing Page

Already drafted in our earlier hero mockup ("Paid. Not published."). Same shape:

- Quiet nav with the Tacet wordmark and a small "Launch app" pill
- Editorial hero with serif headline + period-as-emphasis
- The three-lens live demo block as the hero *art* — operator, recipient, public, same campaign, animated focus cycling between lenses
- One section below the fold explaining the flow in three steps with one screenshot each
- Footer with "Built on Zama Protocol · TokenOps SDK · ERC-7984"

That's the entire site. No pricing page. No about page. No blog. The README on GitHub is the docs.

---

## The 3-Minute Video Storyboard

Locked timeline. Voiceover in calm, neutral register — no hype, no music drops, no whip transitions.

| Time | Scene |
|---|---|
| 0:00–0:10 | Cold open. Single line on screen, no music: *"Open-source compensation is public by default. Tacet changes that."* |
| 0:10–0:25 | Landing page reveal. Slow pan across hero. Three-lens block animates with focus cycling. Music enters quietly. |
| 0:25–0:55 | Maintainer composer. Pasting GitHub repo URL → contributors populate → dragging an allocation slider → numbers tabulating → clicking "Seal and deploy" → wallet sign → "Sealed" stamp animates onto the campaign card. |
| 0:55–1:50 | Contributor claim on a phone. Receiving the link → landing on the claim page → tapping "Reveal my share" → **the reveal choreography plays in full at hero size** → revealed amount holds on screen for three seconds → tap claim → wallet sign → "Claimed. Receipt saved." → a beat on the small receipt artifact. |
| 1:50–2:20 | Three lenses side by side. Same campaign, three perspectives. Operator sees all. Recipient sees their share. Public sees ciphertext only. Music swells slightly. |
| 2:20–2:45 | Rapid text on screen, one line at a time: *"Public chains leak payouts."* / *"OSS compensation gets gamed."* / *"Recipients deserve privacy."* / *"Maintainers deserve clean ranking."* / *"Sealed. Onchain. Verifiable."* |
| 2:45–3:00 | URL on screen. "Built on Zama Protocol + TokenOps SDK." One last frame of the claim moment. Cut to black. |

---

## The X Thread (5 Posts)

**Post 1 (hook + video):** "We just shipped Tacet — confidential rewards for open-source contributors, built on the @zama_fhe Protocol. The chain sees ciphertext. Each contributor decrypts only their own allocation. Here's what that looks like in 30 seconds ↓" [3-min video attached, cropped to 30s teaser]

**Post 2 (problem):** "Right now, when Gitcoin or RetroPGF pays out to 50 contributors, every amount is public. That's nice for vanity. Terrible for negotiation, anchoring, and contributors in jurisdictions where token-income visibility creates real problems."

**Post 3 (mechanic):** "Tacet uses the TokenOps SDK and ERC-7984 confidential tokens. A maintainer ranks contributors, signs an EIP-712 attestation per recipient, and deploys a campaign. Each contributor's allocation lives onchain as a ciphertext handle. Only their wallet can decrypt it."

**Post 4 (screenshot):** "Three lenses, one campaign. Operator sees the full distribution. Recipients see only their share. The public sees ciphertext. Same chain, three truths." [screenshot of three-lens block]

**Post 5 (CTA):** "Live on Sepolia. Open source. Fork it and run a campaign for your repo this weekend → [URL]. Built for the Zama Developer Program Mainnet Season 3. Feedback welcome."

---

## The 12-Day Plan

Today is Friday, June 26. Submission closes Tuesday, July 7 at 23:59 AOE (effectively July 8 noon UTC).

| Day | Date | Focus |
|---|---|---|
| 1 | Fri Jun 26 | **Setup.** Clone `fhevm-hardhat-template`. Initialize Next.js 14 app with Tailwind. Install TokenOps SDK + wagmi + Framer Motion. Configure Sealed design tokens. Load Instrument Serif, Geist, Geist Mono. Deploy a hello-world contract to Sepolia. |
| 2 | Sat Jun 27 | **Contract architecture.** Design Tacet's contract surface — a thin wrapper around TokenOps `fhe-airdrop` that stores campaign metadata (title, repo, deadline). Write contract + tests. |
| 3 | Sun Jun 28 | **Contract deploy + integration test.** Deploy to Sepolia. Verify on Etherscan. Create a dummy campaign via Hardhat task. Confirm EIP-712 signing flow end to end. |
| 4 | Mon Jun 29 | **Design system components.** Build the reusable primitives per Sealed: `Button`, `Card`, `DotLeaderRow`, `RedactionBar`, `CipherCompanion`, `ThreeLensToggle`, `RevealSequence`. Storybook them in a `/components` page. |
| 5 | Tue Jun 30 | **Composer Steps 1 + 2.** GitHub Contributors API integration. CSV upload fallback. Allocation formulas + sliders. Live tabulated preview. |
| 6 | Wed Jul 1 | **Composer Step 3 + deploy.** Review screen. TokenOps SDK integration. Generate EIP-712 signatures per recipient. Deploy a real campaign to Sepolia. Test end to end with two wallets. |
| 7 | Thu Jul 2 | **Claim flow.** Build the `/c/[campaignId]` route. Read campaign metadata. Sealed state UI. Build the reveal choreography in Framer Motion. Test on a real phone. |
| 8 | Fri Jul 3 | **Claim execution + receipt.** Wire `claim()` through TokenOps. Post-claim receipt UI. Generate a downloadable receipt PDF. Multi-wallet end-to-end test. |
| 9 | Sat Jul 4 | **Landing page.** Build the hero, the live three-lens block, the three-step explainer section, the footer. Deploy to Vercel with a clean domain. Aim for Lighthouse > 90. |
| 10 | Sun Jul 5 | **Polish day.** Empty / error / loading states. Mobile QA on real Android phone. Microcopy pass against Sealed §Voice. Animation refinement. Visual audit against the skill. |
| 11 | Mon Jul 6 | **Video + X thread.** Record screen captures for each scene. Edit. Add quiet music (Epidemic Sound free trial or Pixabay). Export 1080p. Write the X thread. |
| 12 | Tue Jul 7 | **Submission day.** Final QA. Write the README. Submit before 23:59 AOE. |

Built-in slack: Day 9 and Day 10 are partly buffer. If anything slips earlier, eat into landing or polish first — never into claim flow or video.

---

## Tonight — The First 90 Minutes

Concrete sequence to get momentum before sleep:

1. `git clone https://github.com/zama-ai/fhevm-hardhat-template tacet-contracts`
2. `npx create-next-app@latest tacet --typescript --tailwind --app` in a sibling folder
3. In the Next.js app: `pnpm add @tokenops/sdk wagmi viem @rainbow-me/rainbowkit framer-motion lucide-react`
4. Drop the Sealed design tokens into `tailwind.config.ts` (ink scale, accent, fonts)
5. Add the three font imports to `app/layout.tsx` head
6. Create one `<HelloFHE />` component that connects a wallet and reads a value from a hello-world contract on Sepolia
7. Deploy the hello-world contract from the Hardhat template to confirm your relayer + RPC setup works
8. `git init`, first commit: "scaffold: tacet setup"

If all eight steps work by tonight, Day 1 is done early and you've already absorbed half of Day 2's risk.

---

## What I Need From You To Keep Building

To go deeper, I need one of two answers:

- **"Start the composer"** — I'll generate the operator composer screen in full React + Tailwind + Framer Motion against Sealed. You drop it in and wire the TokenOps SDK calls.
- **"Start the claim"** — I'll generate the recipient claim screen, including the reveal choreography. This is the screen the video hinges on, so it's the higher-leverage one to nail first.

My recommendation: build the claim screen first. The reveal moment is the single shareable artifact your whole submission rests on, and building it early means every other screen gets designed in conversation with it.
