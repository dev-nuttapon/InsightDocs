import { Link } from 'react-router-dom';

import { useTranslation } from '../../../i18n/useTranslation';
import { getDemoShowcaseDocument } from '../../mock/demoScenario';

type DemoWorkflowContextProps = {
  eyebrow: string;
  title: string;
  description: string;
  documentId: string;
  primaryActionLabel: string;
  primaryActionTo: string;
  secondaryActionLabel: string;
  secondaryActionTo: string;
  stats: Array<{
    label: string;
    value: string | number;
    detail: string;
  }>;
};

export function DemoWorkflowContext({
  eyebrow,
  title,
  description,
  documentId,
  primaryActionLabel,
  primaryActionTo,
  secondaryActionLabel,
  secondaryActionTo,
  stats,
}: DemoWorkflowContextProps) {
  const { language, t } = useTranslation();
  const document = getDemoShowcaseDocument(documentId, language);

  if (!document) {
    return null;
  }

  return (
    <section className="workflow-context">
      <div className="workflow-context__hero">
        <div className="workflow-context__copy">
          <span className="sidebar__eyebrow">{eyebrow}</span>
          <h3>{title}</h3>
          <p className="muted">{description}</p>

          <div className="workflow-context__meta">
            <span>{document.category}</span>
            <span>{document.currentVersion}</span>
            <span>{document.nextAction}</span>
          </div>

          <div className="workflow-context__actions">
            <Link className="button" to={primaryActionTo}>
              {primaryActionLabel}
            </Link>
            <Link className="button button--secondary" to={secondaryActionTo}>
              {secondaryActionLabel}
            </Link>
          </div>
        </div>

        <div className="workflow-context__summary">
          <span className="card__label">{t('demo.workflowContextSummary')}</span>
          <strong>{document.title}</strong>
          <span className="muted">{document.owner} · {document.controller}</span>
        </div>
      </div>

      <div className="workflow-context__stats">
        {stats.map((stat) => (
          <article key={stat.label} className="workflow-context__stat">
            <span className="card__label">{stat.label}</span>
            <strong>{stat.value}</strong>
            <p>{stat.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
