"use client";

import { useRef, useState } from "react";
import { Download } from "lucide-react";
import DotLeaderRow from "@/components/design/DotLeaderRow";
import { truncate } from "@/lib/design-tokens";
import { downloadReceiptImage } from "@/lib/receipt";
import { formatShortDate, type Campaign } from "@/lib/campaign";

interface ClaimReceiptProps {
  campaign: Campaign;
  amount: string;
  txHash: string;
  claimedAt: number;
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
    <div ref={cardRef} className="border-0.5 border-ink-200 rounded-card bg-ink-100/40 p-16">
      <div className="doc-header mb-12">Receipt · {campaign.title}</div>
      <DotLeaderRow label="Amount" value={`${amount} ${campaign.token}`} mono />
      <DotLeaderRow label="From" value={campaign.maintainer} />
      <DotLeaderRow label="Claimed" value={formatShortDate(claimedAt)} />
      <DotLeaderRow label="Transaction" value={truncate(txHash)} mono />
      <button
        onClick={handleDownload}
        disabled={exporting}
        data-html2canvas-ignore="true"
        className="mt-12 flex min-h-[44px] items-center gap-6 text-small text-ink-600 transition-colors hover:text-ink-1000 disabled:opacity-50"
      >
        <Download className="h-[14px] w-[14px]" strokeWidth={1.5} />
        {exporting ? "Preparing image…" : "Download receipt"}
      </button>
    </div>
  );
}
