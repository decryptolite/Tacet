interface RedactionBarProps {
  width?: string | number;
  className?: string;
}

/** Renders a solid ink-1000 redaction bar — the primary "sealed data" signal. */
export default function RedactionBar({ width = 80, className = "" }: RedactionBarProps) {
  const widthVal = typeof width === "number" ? `${width}px` : width;

  return (
    <span
      className={["inline-block h-[14px] rounded-redaction bg-ink-1000 align-middle", className].join(" ")}
      style={{ width: widthVal }}
      aria-label="sealed"
      role="img"
    />
  );
}
