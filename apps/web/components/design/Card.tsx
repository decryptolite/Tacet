interface CardProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

export default function Card({ children, className = "", as: Tag = "div" }: CardProps) {
  return (
    <Tag
      className={[
        "border border-ink-200 rounded-card bg-ink-50 p-24",
        className,
      ].join(" ")}
    >
      {children}
    </Tag>
  );
}
