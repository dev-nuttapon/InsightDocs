type ModuleMockupMetric = {
  label: string;
  value: string;
};

type ModuleMockupProps = {
  eyebrow: string;
  title: string;
  description: string;
  highlights: string[];
  steps: string[];
  metrics: ModuleMockupMetric[];
};

export function ModuleMockup({
  eyebrow,
  title,
  description,
  highlights,
  steps,
  metrics,
}: ModuleMockupProps) {
  return (
    <section className="module-mockup">
      <div className="module-mockup__hero">
        <div className="module-mockup__copy">
          <span className="sidebar__eyebrow">{eyebrow}</span>
          <h3 className="module-mockup__title">{title}</h3>
          <p className="module-mockup__description">{description}</p>

          <div className="module-mockup__chips">
            {highlights.map((highlight) => (
              <span key={highlight} className="module-mockup__chip">
                {highlight}
              </span>
            ))}
          </div>
        </div>

        <div className="module-mockup__metrics">
          {metrics.map((metric) => (
            <div key={metric.label} className="module-mockup__metric">
              <span className="module-mockup__metric-label">{metric.label}</span>
              <strong className="module-mockup__metric-value">{metric.value}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="module-mockup__timeline">
        {steps.map((step, index) => (
          <div key={step} className="module-mockup__step">
            <span className="module-mockup__step-index">{index + 1}</span>
            <span className="module-mockup__step-text">{step}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
