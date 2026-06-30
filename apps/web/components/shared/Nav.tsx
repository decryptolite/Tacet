"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Nav() {
  return (
    <header className="sticky top-0 z-40 bg-ink-50/90 backdrop-blur-sm border-b border-ink-100">
      <div className="max-w-content mx-auto px-8 md:px-16 h-14 flex items-center justify-between">
        <Link href="/" className="font-serif text-[1.125rem] text-ink-1000 tracking-tight">
          Tacet
        </Link>

        <nav className="flex items-center gap-3">
          <ConnectButton.Custom>
            {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
              const connected = mounted && account && chain;
              return (
                <div
                  {...(!mounted && {
                    "aria-hidden": true,
                    style: { opacity: 0, pointerEvents: "none", userSelect: "none" },
                  })}
                >
                  {connected ? (
                    <button
                      onClick={openAccountModal}
                      className="font-mono text-code text-ink-600 border border-ink-200 rounded-pill px-3 py-1.5 hover:border-ink-600 transition-colors"
                    >
                      {account.displayName}
                    </button>
                  ) : (
                    <button
                      onClick={openConnectModal}
                      className="font-sans text-[13px] font-medium text-ink-600 border border-ink-200 rounded-pill px-4 py-1.5 hover:border-ink-600 hover:text-ink-1000 transition-colors"
                    >
                      Connect wallet
                    </button>
                  )}
                </div>
              );
            }}
          </ConnectButton.Custom>

          <Link
            href="/app"
            className="font-sans text-[13px] font-medium bg-ink-1000 text-ink-50 rounded-pill px-4 py-1.5 hover:bg-ink-800 transition-colors"
          >
            Launch app
          </Link>
        </nav>
      </div>
    </header>
  );
}
