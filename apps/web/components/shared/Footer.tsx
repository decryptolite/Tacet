export default function Footer() {
  return (
    <footer className="border-t border-ink-150 mt-32">
      <div className="max-w-content mx-auto px-8 md:px-16 py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="font-serif italic text-[1.5rem] leading-none text-ink-1000">
          tacet<span className="not-italic text-accent">.</span>
        </div>

        <div className="font-mono text-code text-ink-400 space-y-1 text-right">
          <div>
            Built on{" "}
            <a href="https://www.zama.ai/" target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:text-ink-1000 hover:underline">
              Zama Protocol
            </a>{" "}
            ·{" "}
            <a href="https://docs.tokenops.xyz/" target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:text-ink-1000 hover:underline">
              TokenOps SDK
            </a>{" "}
            ·{" "}
            <a href="https://eips.ethereum.org/EIPS/eip-7984" target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:text-ink-1000 hover:underline">
              ERC-7984
            </a>{" "}
            ·{" "}
            <a href="https://sepolia.etherscan.io/address/0x7b8b93f7be58fc677d6fd97addeb4740a97d65cc" target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:text-ink-1000 hover:underline">
              Deployed on Sepolia
            </a>
          </div>
          <div>
            <a href="https://github.com/decryptolite/Tacet" target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:text-ink-1000 hover:underline">
              Source on GitHub
            </a>{" "}
            · Season 3 bounty submission
          </div>
        </div>
      </div>
    </footer>
  );
}
