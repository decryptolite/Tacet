interface RedactionBarProps {
  width?: string | number;
  height?: string | number;
  /** Signature variant: ink fill, amber left rule, cipher glyphs. */
  cipher?: boolean;
  className?: string;
}

const GLYPHS = "████████████";

/** The primary "sealed data" signal. Plain bar inline; cipher variant is the hero seal. */
export default function RedactionBar({ width = 80, height, cipher = false, className = "" }: RedactionBarProps) {
  const widthVal = typeof width === "number" ? `${width}px` : width;

  if (cipher) {
    const heightVal = height === undefined ? "48px" : typeof height === "number" ? `${height}px` : height;
    return (
      <span
        className={["inline-flex items-center overflow-hidden align-middle", className].join(" ")}
        style={{
          width: widthVal,
          height: heightVal,
          background: "var(--ink)",
          borderLeft: "3px solid var(--amber)",
          borderRadius: "4px",
          paddingInline: "14px",
        }}
        aria-label="sealed"
        role="img"
      >
        <span
          className="select-none"
          style={{ fontFamily: "var(--mono)", fontSize: "13px", letterSpacing: "3px", color: "var(--cipher)" }}
          aria-hidden
        >
          {GLYPHS}
        </span>
      </span>
    );
  }

  const heightVal = height === undefined ? "14px" : typeof height === "number" ? `${height}px` : height;
  return (
    <span
      className={["inline-block rounded-redaction align-middle", className].join(" ")}
      style={{ width: widthVal, height: heightVal, background: "var(--ink)" }}
      aria-label="sealed"
      role="img"
    />
  );
}
