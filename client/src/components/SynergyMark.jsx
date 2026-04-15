export default function SynergyMark({
  compact = false,
  title = "Synergy",
  subtitle = "Waste Paper Initiative"
}) {
  const altText = subtitle ? `${title} logo - ${subtitle}` : `${title} logo`;

  return (
    <div className={`synergy-mark${compact ? " compact" : ""}`}>
      <img className="synergy-mark__image" src="/synergy-logo.png" alt={altText} />
    </div>
  );
}
