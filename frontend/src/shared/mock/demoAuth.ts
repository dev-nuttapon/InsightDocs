export type DemoRolePreset =
  | 'admin'
  | 'document_controller'
  | 'manager'
  | 'signer'
  | 'viewer';

const DEMO_ROLE_STORAGE_KEY = 'insightdocs.demo.role';
const DEMO_AUTH_STORAGE_KEY = 'insightdocs.demo.authenticated';

const demoRoleMap: Record<DemoRolePreset, { roles: string[]; displayName: string; username: string; email: string }> = {
  admin: {
    roles: ['insightdocs:admin'],
    displayName: 'Demo Admin',
    username: 'demo.admin',
    email: 'admin@insightdocs.demo',
  },
  document_controller: {
    roles: ['insightdocs:document_controller'],
    displayName: 'Demo Controller',
    username: 'demo.controller',
    email: 'controller@insightdocs.demo',
  },
  manager: {
    roles: ['insightdocs:manager'],
    displayName: 'Demo Manager',
    username: 'demo.manager',
    email: 'manager@insightdocs.demo',
  },
  signer: {
    roles: ['insightdocs:signer'],
    displayName: 'Demo Signer',
    username: 'demo.signer',
    email: 'signer@insightdocs.demo',
  },
  viewer: {
    roles: ['insightdocs:viewer'],
    displayName: 'Demo Viewer',
    username: 'demo.viewer',
    email: 'viewer@insightdocs.demo',
  },
};

export function getDefaultDemoRole(): DemoRolePreset {
  return 'admin';
}

export function getAvailableDemoRoles(): DemoRolePreset[] {
  return Object.keys(demoRoleMap) as DemoRolePreset[];
}

export function readDemoRole(): DemoRolePreset {
  if (typeof window === 'undefined') {
    return getDefaultDemoRole();
  }

  const raw = window.localStorage.getItem(DEMO_ROLE_STORAGE_KEY);
  if (raw && raw in demoRoleMap) {
    return raw as DemoRolePreset;
  }

  return getDefaultDemoRole();
}

export function writeDemoRole(role: DemoRolePreset) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(DEMO_ROLE_STORAGE_KEY, role);
}

export function readDemoAuthenticated() {
  if (typeof window === 'undefined') {
    return false;
  }

  const raw = window.localStorage.getItem(DEMO_AUTH_STORAGE_KEY);
  if (raw === null) {
    return false;
  }

  return raw === 'true';
}

export function writeDemoAuthenticated(value: boolean) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(DEMO_AUTH_STORAGE_KEY, value ? 'true' : 'false');
}

export function buildDemoUser(role: DemoRolePreset) {
  const preset = demoRoleMap[role];

  return {
    subject: `demo-${role}`,
    displayName: preset.displayName,
    username: preset.username,
    email: preset.email,
    roles: preset.roles,
  };
}
