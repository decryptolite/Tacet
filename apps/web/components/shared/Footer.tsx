export default function Footer() {
  return (
    <footer className="border-t border-ink-200 mt-32">
      <div className="max-w-content mx-auto px-8 md:px-16 py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="font-serif text-[1.125rem] text-ink-1000">Tacet</div>

        <div className="font-mono text-code text-ink-400 space-y-1 text-right">
          <div>Built on Zama Protocol · TokenOps SDK · ERC-7984</div>
          <div>Sepolia testnet · Season 3 bounty submission</div>
        </div>
      </div>
    </footer>
  );
}
