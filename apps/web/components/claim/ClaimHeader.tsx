import { truncate } from "@/lib/design-tokens";
import { formatDocDate } from "@/lib/campaign";

interface ClaimHeaderProps {
  airdropAddress: string;
  createdAt: number;
}

/** Document-style top strip — signature move #5. Reads as paperwork, not a page. */
export default function ClaimHeader({ airdropAddress, createdAt }: ClaimHeaderProps) {
  return (
    <div className="flex items-center justify-between doc-header">
      <span>Campaign · {truncate(airdropAddress)}</span>
      <span>{formatDocDate(createdAt)}</span>
    </div>
  );
}
