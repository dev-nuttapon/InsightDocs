export type CurrentUser = {
  subject: string | null;
  username: string | null;
  email: string | null;
  roles: string[];
};

export type AuthState = 'loading' | 'anonymous' | 'authenticated' | 'expired';

export type TokenSet = {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresAt: number;
};

export const cookieSessionToken = 'cookie-session';

export type AuthContextValue = {
  accessToken: string | null;
  authState: AuthState;
  error: string | null;
  isAuthenticated: boolean;
  isReady: boolean;
  isLoading: boolean;
  user: CurrentUser | null;
  login: (returnTo?: string) => Promise<void>;
  logout: () => Promise<void>;
  completeLoginCallback: (callbackUrl: string) => Promise<void>;
};
