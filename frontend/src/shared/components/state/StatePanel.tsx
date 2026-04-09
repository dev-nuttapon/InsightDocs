type StatePanelProps = {
  eyebrow?: string;
  title: string;
  description: string;
  tone?: 'default' | 'danger';
};

export function StatePanel({ eyebrow = 'Status', title, description, tone = 'default' }: StatePanelProps) {
  return (
    <section className="panel">
      <span className="sidebar__eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      <p className={tone === 'danger' ? 'callout callout--danger' : 'muted'}>{description}</p>
    </section>
  );
}
