export default function ChartPanel({ title, subtitle, children, actions }) {
  return (
    <section className="panel">
      <div className="panel__header">
        <div>
          <h3>{title}</h3>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {actions ? <div className="panel__actions">{actions}</div> : null}
      </div>
      <div className="panel__body">{children}</div>
    </section>
  );
}

