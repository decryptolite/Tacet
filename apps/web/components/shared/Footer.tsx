export default function Footer() {
  return (
    <footer className="border-t border-ink-150 mt-32">
      <div className="max-w-content mx-auto px-8 md:px-16 py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="font-serif italic text-[1.5rem] leading-none text-ink-1000">
          tacet<span className="not-italic text-accent">.</span>
        </div>

        <div className="font-mono text-code text-ink-400 space-y-1 text-right">
          <div>Built on Zama Protocol · TokenOps SDK · ERC-7984 · Deployed on Sepolia</div>
          <div>Season 3 bounty submission</div>
        </div>
      </div>
    </footer>
  );
}
