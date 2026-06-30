interface DotLeaderRowProps {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}

/** Receipt-style key–value row: "Status ·············· Claimable" */
export default function DotLeaderRow({ label, value, mono = false }: DotLeaderRowProps) {
  return (
    <div className="flex items-baseline gap-2 py-1.5">
      <span className="text-ink-600 text-small">{label}</span>
      <span className="flex-1 border-b border-dotted border-ink-200" />
      <span className={mono ? "font-mono text-code text-ink-1000" : "text-small text-ink-1000"}>
        {value}
      </span>
    </div>
  );
}
