export type Framing = {
  left: number;
  center: number;
  right: number;
};

export function BiasMeter({
  framing,
  compact = false,
}: {
  framing: Framing;
  compact?: boolean;
}) {
  const description = `AI-estimated framing: ${framing.left}% left, ${framing.center}% center, ${framing.right}% right`;

  return (
    <div aria-label={description} role="img">
      <div className="mb-2 flex items-center justify-between text-[10px] font-medium text-secondary">
        <strong className="font-semibold text-foreground">
          AI-estimated framing
        </strong>
        {!compact && <span>{framing.center}% center</span>}
      </div>
      <div className="flex min-h-6 overflow-hidden rounded-sm bg-center">
        {(
          [
            ["left", framing.left, "bg-left text-white"],
            ["center", framing.center, "bg-center text-foreground"],
            ["right", framing.right, "bg-right text-white"],
          ] as const
        ).map(([label, value, colors]) => (
          <span
            className={`grid min-w-0 place-items-center px-0.75 text-[9px] font-semibold whitespace-nowrap ${colors}`}
            key={label}
            style={{ width: `${value}%` }}
          >
            {value}%
          </span>
        ))}
      </div>
    </div>
  );
}
