import type { DemoRolePreset } from '../../../shared/mock/demoAuth';

export type CurrentUser = {
  subject: string | null;
  displayName: string | null;
  username: string | null;
  email: string | null;
  roles: string[];
};

export type AuthState = 'loading' | 'anonymous' | 'authenticated' | 'expired';

export type AuthContextValue = {
  accessToken: string | null;
  authState: AuthState;
  error: string | null;
  isAuthenticated: boolean;
  isReady: boolean;
  isLoading: boolean;
  user: CurrentUser | null;
  isDemoSession: boolean;
  demoRole: DemoRolePreset | null;
  login: (returnTo?: string) => Promise<void>;
  logout: () => Promise<void>;
  setDemoRole: (role: DemoRolePreset) => void;
};
