import { Link, useLocation } from 'react-router-dom';

import { useTranslation } from '../../../i18n/useTranslation';
import {
  getDemoScenarioState,
  getDemoShowcaseDocument,
  resetDemoScenario,
} from '../../mock/demoScenario';

type DemoControlPanelProps = {
  currentDocumentId?: string;
  compact?: boolean;
};

export function DemoControlPanel({
  currentDocumentId,
  compact = false,
}: DemoControlPanelProps) {
  const { language, t } = useTranslation();
  const location = useLocation();
  const scenarioState = getDemoScenarioState(currentDocumentId, language);
  const primaryDocument = getDemoShowcaseDocument('demo-contract-001', language);
  const approvalDocument = getDemoShowcaseDocument('demo-policy-014', language);
  const draftDocument = getDemoShowcaseDocument('demo-hr-008', language);

  const journeyLinks = [
    {
      title: t('demo.controlRegistryTitle'),
      detail: t('demo.controlRegistryDescription'),
      to: '/documents',
    },
    {
      title: t('demo.controlPrimaryTitle'),
      detail: primaryDocument?.title ?? t('demo.controlPrimaryDescription'),
      to: '/documents/demo-contract-001',
    },
    {
      title: t('demo.controlApprovalTitle'),
      detail: approvalDocument?.title ?? t('demo.controlApprovalDescription'),
      to: '/approvals',
    },
    {
      title: t('demo.controlSignatureTitle'),
      detail: t('demo.controlSignatureDescription'),
      to: '/signatures',
    },
    {
      title: t('demo.controlAuditTitle'),
      detail: t('demo.controlAuditDescription'),
      to: '/audit-logs',
    },
  ];

  const roleLenses = [
    {
      title: t('demo.controlControllerTitle'),
      detail: draftDocument?.title ?? t('demo.controlControllerDescription'),
      to: '/documents/demo-hr-008',
    },
    {
      title: t('demo.controlManagerTitle'),
      detail: approvalDocument?.title ?? t('demo.controlManagerDescription'),
      to: '/approvals',
    },
    {
      title: t('demo.controlSignerTitle'),
      detail: primaryDocument?.title ?? t('demo.controlSignerDescription'),
      to: '/signatures',
    },
  ];

  function handleResetDemo() {
    resetDemoScenario();
    window.location.assign(location.pathname);
  }

  return (
    <section className={`demo-control${compact ? ' demo-control--compact' : ''}`}>
      <div className="demo-control__hero">
        <div className="demo-control__copy">
          <span className="sidebar__eyebrow">{t('demo.controlEyebrow')}</span>
          <h3>{t('demo.controlTitle')}</h3>
          <p className="muted">{t('demo.controlDescription')}</p>
          <div className="demo-control__actions">
            <Link className="button" to={scenarioState.primaryAction.to}>
              {scenarioState.primaryAction.label}
            </Link>
            <button className="button button--secondary" type="button" onClick={handleResetDemo}>
              {t('demo.controlReset')}
            </button>
          </div>
        </div>

        <div className="demo-control__status">
          <div className="demo-control__status-card">
            <span className="card__label">{t('demo.controlCurrentStage')}</span>
            <strong>{scenarioState.badge}</strong>
            <span className="muted">{scenarioState.headline}</span>
          </div>
          <div className="demo-control__status-card">
            <span className="card__label">{t('demo.controlNextCue')}</span>
            <strong>{scenarioState.focus}</strong>
            <span className="muted">{scenarioState.nextStep}</span>
          </div>
        </div>
      </div>

      <div className="demo-control__grid">
        <section className="demo-control__panel">
          <div className="section-heading">
            <span className="sidebar__eyebrow">{t('demo.controlJourneyEyebrow')}</span>
            <h4>{t('demo.controlJourneyTitle')}</h4>
          </div>
          <div className="demo-control__links">
            {journeyLinks.map((item) => (
              <Link key={item.to} className="demo-control__link" to={item.to}>
                <div className="demo-control__link-copy">
                  <strong>{item.title}</strong>
                  <span>{item.detail}</span>
                </div>
                <span className="demo-control__link-arrow" aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        </section>

        {!compact ? (
          <section className="demo-control__panel">
            <div className="section-heading">
              <span className="sidebar__eyebrow">{t('demo.controlRoleEyebrow')}</span>
              <h4>{t('demo.controlRoleTitle')}</h4>
            </div>
            <div className="demo-control__lenses">
              {roleLenses.map((lens) => (
                <Link key={lens.to} className="demo-control__lens" to={lens.to}>
                  <strong>{lens.title}</strong>
                  <span>{lens.detail}</span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </section>
  );
}
