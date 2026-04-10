export type UserStatus = 'Pending' | 'Active' | 'Disabled';

export type AppUser = {
  id: string;
  keycloakUserId: string;
  username: string;
  email: string;
  displayName: string;
  firstName: string | null;
  lastName: string | null;
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

export function formatBusinessRole(role: string) {
  switch (role) {
    case 'insightdocs:admin':
      return 'Admin';
    case 'insightdocs:document_controller':
      return 'Document Controller';
    case 'insightdocs:manager':
      return 'Manager';
    case 'insightdocs:signer':
      return 'Signer';
    case 'insightdocs:viewer':
      return 'Viewer';
    default:
      return role;
  }
}
