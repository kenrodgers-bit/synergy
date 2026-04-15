import { formatCurrency, formatNumber } from "../utils/formatters";

export default function StatCard({ label, value, type = "number", hint }) {
  const displayValue =
    type === "currency" ? formatCurrency(value) : type === "weight" ? `${formatNumber(value)} kg` : formatNumber(value);

  return (
    <article className="stat-card">
      <span>{label}</span>
      <strong>{displayValue}</strong>
      {hint ? <small>{hint}</small> : null}
    </article>
  );
}

