import { Link } from 'react-router-dom';

type FeatureHeroStat = {
  label: string;
  value: string | number;
  detail?: string;
};

type FeatureHeroAction = {
  label: string;
  to: string;
  tone?: 'primary' | 'secondary';
};

type FeatureHeroPanelProps = {
  eyebrow: string;
  title: string;
  description: string;
  stats: FeatureHeroStat[];
  actions?: FeatureHeroAction[];
};

export function FeatureHeroPanel({
  eyebrow,
  title,
  description,
  stats,
  actions = [],
}: FeatureHeroPanelProps) {
  return (
    <section className="feature-hero">
      <div className="feature-hero__copy">
        <span className="sidebar__eyebrow">{eyebrow}</span>
        <h3>{title}</h3>
        <p className="muted">{description}</p>
        {actions.length > 0 ? (
          <div className="feature-hero__actions">
            {actions.map((action) => (
              <Link
                key={`${action.to}-${action.label}`}
                className={`button${action.tone === 'secondary' ? ' button--secondary' : ''}`}
                to={action.to}
              >
                {action.label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      <div className="feature-hero__stats">
        {stats.map((stat) => (
          <article key={stat.label} className="feature-hero__stat">
            <span className="card__label">{stat.label}</span>
            <strong>{stat.value}</strong>
            {stat.detail ? <p>{stat.detail}</p> : null}
          </article>
        ))}
      </div>
    </section>
  );
}
