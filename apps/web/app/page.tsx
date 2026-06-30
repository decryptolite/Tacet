import Nav from "@/components/shared/Nav";
import Footer from "@/components/shared/Footer";
import ThreeLensHero from "@/components/landing/ThreeLensHero";
import HowItWorks from "@/components/landing/HowItWorks";

export default function LandingPage() {
  return (
    <>
      <Nav />
      <main id="main">
        <Hero />
        <HowItWorks />
      </main>
      <Footer />
    </>
  );
}

function Hero() {
  return (
    <section className="max-w-content mx-auto px-8 md:px-16 pt-24 pb-32">
      {/* Editorial headline — signature move #6: period-as-emphasis */}
      <div className="max-w-[36rem] mb-16">
        <h1 className="font-serif text-h1 text-ink-1000 leading-[1.1] tracking-tight">
          Paid. Not published.
        </h1>
        <p className="mt-8 text-body text-ink-600 max-w-prose">
          A maintainer ranks contributors. Each receives a sealed allocation.
          The chain stores ciphertext. Only the recipient decrypts their share.
        </p>
        <div className="mt-12 flex items-center gap-4">
          <a
            href="/app"
            className="inline-flex items-center justify-center rounded-pill bg-ink-1000 px-[18px] py-[10px] text-[13px] font-sans font-medium text-ink-50 hover:bg-ink-800 transition-colors duration-standard ease-sealed"
          >
            Launch app
          </a>
          <a
            href="#how-it-works"
            className="inline-flex items-center justify-center rounded-pill border border-ink-200 px-[18px] py-[10px] text-[13px] font-sans font-medium text-ink-1000 hover:border-ink-600 transition-colors duration-standard ease-sealed"
          >
            See how it works
          </a>
        </div>
      </div>

      {/* Three-lens live demo — the hero art */}
      <div className="mt-4">
        <p className="font-mono text-code text-ink-400 mb-4">
          Same campaign · three lenses
        </p>
        <ThreeLensHero />
      </div>
    </section>
  );
}
