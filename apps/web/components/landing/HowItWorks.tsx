const steps = [
  {
    number: "01",
    title: "Rank your contributors",
    body: "Paste a GitHub repo URL. Contributors populate with commit counts and activity. Toggle rows on or off. Set a total budget and a formula — flat split, weighted by commits, or manual.",
  },
  {
    number: "02",
    title: "Seal and deploy",
    body: "Each allocation is encrypted client-side using Zama's FHEVM. The chain receives ciphertext handles, never amounts. One wallet signature deploys the campaign.",
  },
  {
    number: "03",
    title: "Recipients claim privately",
    body: "Share a link. Each contributor connects their wallet, decrypts their own share — and only their share — and claims in one transaction. No one sees anyone else's allocation.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-ink-200">
      <div className="max-w-content mx-auto px-8 md:px-16 py-24">
        {/* Section label — signature move #5 doc-header style */}
        <p className="font-mono text-code text-ink-400 mb-16">How it works</p>

        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
          {steps.map((step) => (
            <div key={step.number}>
              <div className="font-mono text-code text-ink-400 mb-8">{step.number}</div>
              <h3 className="font-sans text-h3 text-ink-1000 mb-4">{step.title}</h3>
              <p className="text-small text-ink-600 leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>

        {/* Rule divider */}
        <div className="rule mt-24 mb-16" />

        {/* Trust line */}
        <p className="font-mono text-code text-ink-400 text-center">
          Audited by OpenZeppelin · Deployed on Sepolia · Source on GitHub
        </p>
      </div>
    </section>
  );
}
