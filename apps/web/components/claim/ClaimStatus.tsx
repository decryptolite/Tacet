import type { ReactNode } from "react";
import DotLeaderRow from "@/components/design/DotLeaderRow";
import { formatShortDate, type Campaign } from "@/lib/campaign";

interface ClaimStatusProps {
  campaign: Campaign;
  status: ReactNode;
}

/** Receipt-style metadata rows — signature move #3. */
export default function ClaimStatus({ campaign, status }: ClaimStatusProps) {
  return (
    <div className="mt-32 text-left">
      <p className="mb-8 font-mono text-[9px] uppercase tracking-[1px] text-ink-400">
        Campaign details
      </p>
      <DotLeaderRow label="Campaign" value={campaign.title} />
      <DotLeaderRow label="Deadline" value={formatShortDate(campaign.deadline)} mono />
      <DotLeaderRow label="Status" value={status} />
    </div>
  );
}
