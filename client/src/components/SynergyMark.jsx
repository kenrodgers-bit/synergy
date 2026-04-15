export default function SynergyMark({
  compact = false,
  title = "Synergy",
  subtitle = "Turning waste into value"
}) {
  return (
    <div className={`synergy-mark${compact ? " compact" : ""}`}>
      <div className="synergy-mark__glyph" aria-hidden="true">
        <span />
        <span />
      </div>
      <div>
        <strong>{title}</strong>
        {!compact ? <span>{subtitle}</span> : null}
      </div>
    </div>
  );
}
