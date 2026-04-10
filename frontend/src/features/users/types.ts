export type UserStatus = 'Pending' | 'Active' | 'Disabled';

export type AppUser = {
  id: string;
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
  username: string;
  email: string;
  displayName: string;
  password: string;
};

type ProjectRole =
  | 'insightdocs:admin'
  | 'insightdocs:document_controller'
  | 'insightdocs:manager'
  | 'insightdocs:signer'
  | 'insightdocs:viewer';

export function formatBusinessRole(role: string) {
  return formatProjectRoleLabel(normalizeProjectRole(role));
}

export function getProjectRoles(roles: string[]) {
  return Array.from(
    new Set(
      roles
        .map(normalizeProjectRole)
        .filter((role): role is ProjectRole => role !== null),
    ),
  );
}

export function getProjectRoleLabels(roles: string[]) {
  return getProjectRoles(roles).map(formatProjectRoleLabel);
}

function normalizeProjectRole(role: string) {
  switch (role) {
    case 'Admin':
    case 'admin':
    case 'realm-admin':
    case 'insightdocs-admin':
    case 'insightdocs:admin':
      return 'insightdocs:admin';
    case 'DocumentController':
    case 'documentcontroller':
    case 'insightdocs:document_controller':
      return 'insightdocs:document_controller';
    case 'Manager':
    case 'manager':
    case 'insightdocs:manager':
      return 'insightdocs:manager';
    case 'Signer':
    case 'signer':
    case 'insightdocs:signer':
      return 'insightdocs:signer';
    case 'Viewer':
    case 'viewer':
    case 'insightdocs:viewer':
      return 'insightdocs:viewer';
    default:
      return null;
  }
}

function formatProjectRoleLabel(role: ProjectRole | null) {
  switch (role) {
    case 'insightdocs:admin':
      return 'ผู้ดูแลระบบ';
    case 'insightdocs:document_controller':
      return 'ผู้ควบคุมเอกสาร';
    case 'insightdocs:manager':
      return 'ผู้อนุมัติ';
    case 'insightdocs:signer':
      return 'ผู้ลงนาม';
    case 'insightdocs:viewer':
      return 'ผู้ใช้งานทั่วไป';
    default:
      return 'ไม่ระบุบทบาท';
  }
}
