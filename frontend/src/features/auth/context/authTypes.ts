export type CurrentUser = {
  subject: string | null;
  username: string | null;
  email: string | null;
  roles: string[];
};

export type TokenSet = {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresAt: number;
};

export type AuthContextValue = {
  accessToken: string | null;
  error: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  user: CurrentUser | null;
  login: (returnTo?: string) => Promise<void>;
  logout: () => Promise<void>;
  completeLoginCallback: (callbackUrl: string) => Promise<void>;
};
