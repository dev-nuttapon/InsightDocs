import { useState } from 'react';
import { useAuth } from '../../../features/auth/context/useAuth';
import { useTranslation } from '../../../i18n/useTranslation';
import {
  getAvailableDemoRoles,
  getDemoRoleColorToken,
  getDemoRoleTranslationKey,
  DemoRolePreset,
} from '../../mock/demoAuth';
import { Icons } from '../ui/Icons';

export function DemoRoleSwitcher() {
  const { demoRole, setDemoRole, isDemoSession } = useAuth();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  if (!isDemoSession) return null;

  const roles = getAvailableDemoRoles();

  const handleRoleSwitch = (role: DemoRolePreset) => {
    if (role === demoRole) return;
    
    setIsSwitching(true);
    setDemoRole(role);
    
    // Artificial delay for "Switching persona..." effect
    setTimeout(() => {
      setIsSwitching(false);
      setIsOpen(false);
    }, 800);
  };

  const getRoleIcon = (role: DemoRolePreset) => {
    switch (role) {
      case 'admin': return Icons.Settings;
      case 'document_controller': return Icons.Documents;
      case 'manager': return Icons.Approval;
      case 'signer': return Icons.Signature;
      case 'viewer': return Icons.Search;
      default: return Icons.Users;
    }
  };

  const currentRole = demoRole ?? 'admin';
  const currentRoleName = t(`demo.role${getDemoRoleTranslationKey(currentRole)}`);

  return (
    <div className={`demo-switcher ${isOpen ? 'demo-switcher--open' : ''}`}>
      {isSwitching && (
        <div className="demo-switcher__overlay">
          <div className="demo-switcher__overlay-content">
            <div className="spinner" />
            <p>{t('demo.personaSwitching')}</p>
            <strong>{currentRoleName}</strong>
          </div>
        </div>
      )}

      <button 
        className="demo-switcher__trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Demo Controls"
        style={{ '--role-color': `var(--color-role-${getDemoRoleColorToken(currentRole)})` } as any}
      >
        <div className="demo-switcher__trigger-icon">
          {isOpen ? <Icons.Plus style={{ transform: 'rotate(45deg)' }} /> : <Icons.Users />}
        </div>
        {!isOpen && <span className="demo-switcher__trigger-label">{currentRoleName}</span>}
      </button>

      <div className="demo-switcher__panel">
        <div className="demo-switcher__header">
          <h4>{t('demo.controlCenterTitle')}</h4>
          <p className="muted">{t('demo.controlCenterDescription')}</p>
        </div>

        <div className="demo-switcher__list">
          {roles.map((role) => {
            const isActive = demoRole === role;
            const Icon = getRoleIcon(role);
            const roleKey = getDemoRoleTranslationKey(role);

            return (
              <button
                key={role}
                className={`demo-switcher__item ${isActive ? 'demo-switcher__item--active' : ''}`}
                onClick={() => handleRoleSwitch(role)}
                style={{ '--role-color': `var(--color-role-${getDemoRoleColorToken(role)})` } as any}
              >
                <div className="demo-switcher__item-icon">
                  <Icon size={20} />
                </div>
                <div className="demo-switcher__item-copy">
                  <strong>{t(`demo.role${roleKey}`)}</strong>
                  <span className="muted">{t(`demo.role${roleKey}Desc`)}</span>
                </div>
                {isActive && <div className="demo-switcher__item-check">✓</div>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
