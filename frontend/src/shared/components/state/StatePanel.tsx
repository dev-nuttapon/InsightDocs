type StatePanelProps = {
  eyebrow?: string;
  title: string;
  description: string;
  busy?: boolean;
  tone?: 'default' | 'danger';
};

export function StatePanel({ eyebrow = 'Status', title, description, busy = false, tone = 'default' }: StatePanelProps) {
  return (
    <div className={busy ? 'state-screen' : undefined}>
      <section className={`panel${busy ? ' panel--busy' : ''}`}>
        <span className="sidebar__eyebrow">{eyebrow}</span>
        {busy ? <span className="spinner" aria-hidden="true" /> : null}
        <h2>{title}</h2>
        <p className={tone === 'danger' ? 'callout callout--danger' : 'muted'}>{description}</p>
      </section>
    </div>
  );
}
