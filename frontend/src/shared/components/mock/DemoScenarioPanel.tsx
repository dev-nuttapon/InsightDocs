import { Link } from 'react-router-dom';

import { getDemoScenarioStages, type DemoScenarioState } from '../../mock/demoScenario';
import { useTranslation } from '../../../i18n/useTranslation';

type DemoScenarioPanelProps = {
  eyebrow?: string;
  state: DemoScenarioState;
  secondaryAction?: {
    label: string;
    to: string;
  };
  compact?: boolean;
};

export function DemoScenarioPanel({
  eyebrow,
  state,
  secondaryAction,
  compact = false,
}: DemoScenarioPanelProps) {
  const { language, t } = useTranslation();
  const stages = getDemoScenarioStages(language);

  return (
    <section className={`demo-scenario${compact ? ' demo-scenario--compact' : ''}`}>
      <div className="demo-scenario__hero">
        <div className="demo-scenario__copy">
          <span className="sidebar__eyebrow">{eyebrow ?? t('demo.scenarioEyebrow')}</span>
          <span className="status-pill status-pill--subtle">{state.badge}</span>
          <h3 className="demo-scenario__title">{state.headline}</h3>
          <p className="demo-scenario__description">{state.nextStep}</p>
          <div className="demo-scenario__actions">
            <Link className="button" to={state.primaryAction.to}>{state.primaryAction.label}</Link>
            {secondaryAction ? (
              <Link className="button button--secondary" to={secondaryAction.to}>{secondaryAction.label}</Link>
            ) : null}
          </div>
        </div>

        <div className="demo-scenario__focus">
          <span className="demo-scenario__focus-label">{t('demo.currentFocus')}</span>
          <strong>{state.focus}</strong>
          <span className="muted">{t('demo.stepProgress', { current: state.currentStep, total: stages.length })}</span>
        </div>
      </div>

      <div className="demo-scenario__stages">
        {stages.map((stage, index) => {
          const stepNumber = index + 1;
          const status =
            stepNumber < state.currentStep ? 'done' : stepNumber === state.currentStep ? 'active' : 'upcoming';

          return (
            <div key={stage.key} className={`demo-scenario__stage demo-scenario__stage--${status}`}>
              <div className="demo-scenario__stage-index">{stepNumber}</div>
              <div className="demo-scenario__stage-copy">
                <strong>{stage.title}</strong>
                <span>{stage.detail}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
