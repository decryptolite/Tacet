"use client";

import { useRef, useState } from "react";
import { Download } from "lucide-react";
import { truncate } from "@/lib/design-tokens";
import { downloadReceiptImage } from "@/lib/receipt";
import { formatShortDate, type Campaign } from "@/lib/campaign";

interface ClaimReceiptProps {
  campaign: Campaign;
  amount: string;
  txHash: string;
  claimedAt: number;
}

function ReceiptRow({ label, value, valueSize = 12 }: { label: string; value: string; valueSize?: number }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1">
      <span className="font-mono text-[10px] uppercase tracking-[1px] text-ink-400">{label}</span>
      <span
        className="font-mono tabular-nums text-ink-1000 text-right"
        style={{ fontSize: `${valueSize}px` }}
      >
        {value}
      </span>
    </div>
  );
}

/** Settled-state artifact — the small receipt the video lingers on after a claim. */
export default function ClaimReceipt({ campaign, amount, txHash, claimedAt }: ClaimReceiptProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  async function handleDownload() {
    if (!cardRef.current || exporting) return;
    setExporting(true);
    try {
      await downloadReceiptImage(cardRef.current, campaign.id);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <div ref={cardRef} className="rounded-card border border-ink-100 bg-paper p-16">
        <div className="mb-12 flex items-center justify-between">
          <span className="font-serif text-[22px] italic leading-none text-ink-1000">
            tacet<span className="not-italic">.</span>
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[1px] text-ink-400">Claim receipt</span>
        </div>

        <div className="space-y-1">
          <ReceiptRow label="Amount" value={`${amount} ${campaign.token}`} valueSize={13} />
          <ReceiptRow label="Campaign" value={campaign.title} />
          <ReceiptRow label="Date" value={formatShortDate(claimedAt)} />
          <a
            href={`https://sepolia.etherscan.io/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-baseline justify-between gap-4 py-1 hover:opacity-70"
          >
            <span className="font-mono text-[10px] uppercase tracking-[1px] text-ink-400">Transaction</span>
            <span className="font-mono text-[12px] tabular-nums text-ink-1000 text-right underline-offset-4 hover:underline">
              {truncate(txHash)}
            </span>
          </a>
        </div>

        <p className="mt-16 text-center font-mono text-[9px] tracking-[0.5px] text-ink-400">
          Verified on Sepolia · Zama FHE · ERC-7984
        </p>
      </div>

      <button
        onClick={handleDownload}
        disabled={exporting}
        className="mt-12 flex min-h-[44px] items-center gap-6 text-small text-ink-600 transition-colors hover:text-ink-1000 disabled:opacity-50"
      >
        <Download className="h-[14px] w-[14px]" strokeWidth={1.5} />
        {exporting ? "Preparing image…" : "Download receipt"}
      </button>
    </div>
  );
}
