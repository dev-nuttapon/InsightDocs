export type RoleKey =
  | 'admin'
  | 'audit_reader'
  | 'document_controller'
  | 'manager'
  | 'signer'
  | 'user_admin'
  | 'viewer';

type AccessProfile = {
  normalizedRoles: RoleKey[];
  isAdmin: boolean;
  canManageDocuments: boolean;
  canSubmitReview: boolean;
  canReviewDocuments: boolean;
  canManageSignatures: boolean;
  canSignDocuments: boolean;
  canAccessAdmin: boolean;
  canAccessUsers: boolean;
  canAccessPasswordResetAdmin: boolean;
  canAccessAuditLogs: boolean;
};

const roleAliases: Record<RoleKey, string[]> = {
  admin: ['Admin', 'admin', 'realm-admin', 'insightdocs-admin', 'insightdocs:admin'],
  audit_reader: ['AuditReader', 'auditreader', 'insightdocs:audit_reader'],
  document_controller: ['DocumentController', 'documentcontroller', 'insightdocs:document_controller'],
  manager: ['Manager', 'manager', 'insightdocs:manager'],
  signer: ['Signer', 'signer', 'insightdocs:signer'],
  user_admin: ['UserAdmin', 'useradmin', 'insightdocs:user_admin'],
  viewer: ['Viewer', 'viewer', 'insightdocs:viewer'],
};

export function buildAccessProfile(roles: string[]): AccessProfile {
  const hasAdmin = hasAnyRole(roles, 'admin');
  const hasAuditReader = hasAnyRole(roles, 'audit_reader');
  const hasDocumentController = hasAnyRole(roles, 'document_controller');
  const hasManager = hasAnyRole(roles, 'manager');
  const hasSigner = hasAnyRole(roles, 'signer');
  const hasUserAdmin = hasAnyRole(roles, 'user_admin');

  const normalizedRoles = (Object.keys(roleAliases) as RoleKey[]).filter((role) => hasAnyRole(roles, role));

  return {
    normalizedRoles,
    isAdmin: hasAdmin,
    canManageDocuments: hasAdmin || hasDocumentController || hasManager,
    canSubmitReview: hasAdmin || hasDocumentController,
    canReviewDocuments: hasAdmin || hasManager,
    canManageSignatures: hasAdmin || hasDocumentController || hasManager,
    canSignDocuments: hasAdmin || hasSigner,
    canAccessAdmin: hasAdmin || hasUserAdmin || hasAuditReader,
    canAccessUsers: hasAdmin || hasUserAdmin,
    canAccessPasswordResetAdmin: hasAdmin || hasUserAdmin,
    canAccessAuditLogs: hasAdmin || hasAuditReader,
  };
}

export function hasAnyRole(roles: string[], role: RoleKey) {
  const candidates = new Set(roleAliases[role].map((candidate) => candidate.toLowerCase()));
  return roles.some((entry) => candidates.has(entry.toLowerCase()));
}

export function formatRoleLabel(role: RoleKey) {
  switch (role) {
    case 'admin':
      return 'Admin';
    case 'audit_reader':
      return 'Audit Reader';
    case 'document_controller':
      return 'Document Controller';
    case 'manager':
      return 'Manager';
    case 'signer':
      return 'Signer';
    case 'user_admin':
      return 'User Admin';
    case 'viewer':
      return 'Viewer';
    default:
      return role;
  }
}

export function canAccessPath(access: ReturnType<typeof buildAccessProfile>, path: string) {
  if (path.startsWith('/users')) {
    return access.canAccessUsers;
  }

  if (path.startsWith('/admin/password-reset-requests')) {
    return access.canAccessPasswordResetAdmin;
  }

  if (path.startsWith('/audit-logs')) {
    return access.canAccessAuditLogs;
  }

  if (path.startsWith('/approvals')) {
    return access.canReviewDocuments;
  }

  if (path.startsWith('/signatures')) {
    return access.canSignDocuments;
  }

  if (
    path.startsWith('/dashboard') ||
    path.startsWith('/documents') ||
    path.startsWith('/search') ||
    path.startsWith('/me')
  ) {
    return true;
  }

  return true;
}

export function resolveDefaultAuthorizedPath(access: ReturnType<typeof buildAccessProfile>) {
  if (access.canReviewDocuments) {
    return '/approvals';
  }

  if (access.canSignDocuments) {
    return '/signatures';
  }

  if (access.canManageDocuments) {
    return '/documents';
  }

  return '/dashboard';
}
