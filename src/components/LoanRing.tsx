const SIZE = 120;
const STROKE = 10;
const RADIUS = (SIZE - STROKE) / 2;

export function LoanRing({
  percentRemaining,
  size = SIZE,
}: {
  percentRemaining: number;
  size?: number;
}) {
  const clamped = Math.max(0, Math.min(100, percentRemaining));
  const scale = size / SIZE;
  const radius = RADIUS * scale;
  const stroke = STROKE * scale;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-muted)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 400ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-semibold tabular-nums">
          {Math.round(clamped)}%
        </span>
        <span className="text-[10px] text-muted-foreground">left</span>
      </div>
    </div>
  );
}
