export type UserStatus = 'Pending' | 'Active' | 'Disabled';

export type AppUser = {
  id: string;
  keycloakUserId: string;
  username: string;
  email: string;
  displayName: string;
  status: UserStatus;
  createdAt: string;
  approvedAt: string | null;
  approvedBy: string | null;
  roles: string[];
};

export type CreateUserInput = {
  keycloakUserId: string;
  username: string;
  email: string;
  displayName: string;
};

export type UpdateUserInput = CreateUserInput;

export const businessRoles = ['Admin', 'DocumentController', 'Manager', 'Signer', 'Viewer'] as const;
