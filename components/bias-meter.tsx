export type Framing = {
  left: number;
  center: number;
  right: number;
};

export function BiasMeter({ framing }: { framing: Framing }) {
  const description = `AI-estimated framing: ${framing.left}% left, ${framing.center}% center, ${framing.right}% right`;

  return (
    <div className="bias-meter" aria-label={description} role="img">
      <div className="bias-meter__label">
        <strong>AI-estimated framing</strong>
        <span>{framing.center}% center</span>
      </div>
      <div className="bias-meter__track">
        <span
          className="bias-meter__segment bias-meter__segment--left"
          style={{ width: `${framing.left}%` }}
        >
          {framing.left}%
        </span>
        <span
          className="bias-meter__segment bias-meter__segment--center"
          style={{ width: `${framing.center}%` }}
        >
          {framing.center}%
        </span>
        <span
          className="bias-meter__segment bias-meter__segment--right"
          style={{ width: `${framing.right}%` }}
        >
          {framing.right}%
        </span>
      </div>
    </div>
  );
}
