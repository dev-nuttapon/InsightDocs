import type { Language } from '../../i18n/messages';

export type UserStatus = 'Pending' | 'Active' | 'Disabled' | 'Deleted';
export type UserStatusValue = UserStatus | 0 | 1 | 2 | 3;

export type AppUser = {
  id: string;
  username: string;
  email: string;
  displayName: string;
  firstName: string | null;
  lastName: string | null;
  status: UserStatusValue;
  createdAt: string;
  approvedAt: string | null;
  approvedBy: string | null;
  roles: string[];
};

export type CreateUserInput = {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  roles: string[];
};

export type UpdateUserInput = {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password?: string;
  roles: string[];
};

type ProjectRole =
  | 'insightdocs:admin'
  | 'insightdocs:audit_reader'
  | 'insightdocs:document_controller'
  | 'insightdocs:manager'
  | 'insightdocs:signer'
  | 'insightdocs:user_admin'
  | 'insightdocs:viewer';

export const AVAILABLE_PROJECT_ROLES: ProjectRole[] = [
  'insightdocs:admin',
  'insightdocs:audit_reader',
  'insightdocs:document_controller',
  'insightdocs:manager',
  'insightdocs:signer',
  'insightdocs:user_admin',
  'insightdocs:viewer',
];

export function formatBusinessRole(role: string, language: Language = 'th') {
  return formatProjectRoleLabel(normalizeProjectRole(role), language);
}

export function formatBusinessRoleDescription(role: string, language: Language = 'th') {
  switch (normalizeProjectRole(role)) {
    case 'insightdocs:admin':
      return language === 'th'
        ? 'สิทธิ์ผู้ดูแลระบบเต็มรูปแบบสำหรับ InsightDocs สามารถจัดการผู้ใช้ บทบาท การอนุมัติคำขอรีเซ็ตรหัสผ่าน ตรวจสอบ audit log และควบคุมการทำงานข้ามทุกโมดูลของระบบได้'
        : 'Full administrative access to InsightDocs across users, roles, password reset approvals, audit review, and cross-module operations.';
    case 'insightdocs:audit_reader':
      return language === 'th'
        ? 'สามารถเข้าดูข้อมูล audit log เพื่อการตรวจสอบด้าน compliance และการติดตามการทำงานของระบบ โดยไม่มีสิทธิ์บริหารจัดการส่วนอื่น'
        : 'Read-only access to audit logs for compliance and operational traceability without broader administrative permissions.';
    case 'insightdocs:document_controller':
      return language === 'th'
        ? 'สามารถสร้างเอกสาร จัดการข้อมูลเอกสาร อัปโหลดไฟล์ PDF เวอร์ชันใหม่ และส่งเอกสารเข้าสู่กระบวนการตรวจสอบอนุมัติได้'
        : 'Can create documents, manage metadata, upload new PDF versions, and submit documents into the approval workflow.';
    case 'insightdocs:manager':
      return language === 'th'
        ? 'สามารถตรวจสอบเอกสารในคิวอนุมัติ และดำเนินการอนุมัติหรือปฏิเสธเอกสาร พร้อมบันทึกความเห็นประกอบใน workflow ได้'
        : 'Can review approval queue items and make approve or reject decisions with workflow comments.';
    case 'insightdocs:signer':
      return language === 'th'
        ? 'สามารถเข้าถึงงานลงนามที่ได้รับมอบหมาย ตรวจสอบเอกสารที่ผ่านการอนุมัติแล้ว และดำเนินการลงนามหรือปฏิเสธการลงนามตามลำดับขั้นที่กำหนดได้'
        : 'Can access assigned signature tasks, review approved documents, and sign or reject in the configured sequence.';
    case 'insightdocs:user_admin':
      return language === 'th'
        ? 'สามารถจัดการข้อมูลผู้ใช้ การอนุมัติผู้ใช้ และการกำหนดบทบาทในระบบได้ โดยไม่จำเป็นต้องมีสิทธิ์ผู้ดูแลระบบเต็มรูปแบบ'
        : 'Can manage user records, approval states, and role assignments without requiring full system administration.';
    case 'insightdocs:viewer':
      return language === 'th'
        ? 'สิทธิ์สำหรับการเข้าดูข้อมูลเป็นหลัก สามารถดู dashboard ค้นหาเอกสาร และเปิดดูรายละเอียดเอกสารตามสิทธิ์ที่ระบบอนุญาตได้'
        : 'Read-oriented access for dashboards, document search, and document detail views where permitted.';
    default:
      return language === 'th'
        ? 'บทบาทสำหรับกำหนดสิทธิ์การใช้งานใน InsightDocs'
        : 'Role used to determine access inside InsightDocs.';
  }
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

export function getProjectRoleLabels(roles: string[], language: Language = 'th') {
  return getProjectRoles(roles).map((role) => formatProjectRoleLabel(role, language));
}

export function normalizeUserStatus(status: UserStatusValue): UserStatus {
  switch (status) {
    case 0:
      return 'Pending';
    case 1:
      return 'Active';
    case 2:
      return 'Disabled';
    case 3:
      return 'Deleted';
    default:
      return status;
  }
}

export function resolveUserStatus(status: UserStatusValue, approvedAt?: string | null): UserStatus {
  const normalizedStatus = normalizeUserStatus(status);

  if (normalizedStatus === 'Disabled' && !approvedAt) {
    return 'Pending';
  }

  return normalizedStatus;
}

export function formatUserStatus(status: UserStatusValue, approvedAt?: string | null) {
  switch (resolveUserStatus(status, approvedAt)) {
    case 'Active':
      return 'ใช้งาน';
    case 'Disabled':
      return 'ปิดการใช้งาน';
    case 'Deleted':
      return 'ลบ';
    case 'Pending':
      return 'รออนุมัติ';
    default:
      return status;
  }
}

export function canEnableUser(status: UserStatusValue, approvedAt?: string | null) {
  const resolvedStatus = resolveUserStatus(status, approvedAt);
  return resolvedStatus !== 'Active' && resolvedStatus !== 'Deleted';
}

export function canDisableUser(status: UserStatusValue, approvedAt?: string | null) {
  return resolveUserStatus(status, approvedAt) === 'Active';
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
    case 'AuditReader':
    case 'auditreader':
    case 'insightdocs:audit_reader':
      return 'insightdocs:audit_reader';
    case 'Manager':
    case 'manager':
    case 'insightdocs:manager':
      return 'insightdocs:manager';
    case 'Signer':
    case 'signer':
    case 'insightdocs:signer':
      return 'insightdocs:signer';
    case 'UserAdmin':
    case 'useradmin':
    case 'insightdocs:user_admin':
      return 'insightdocs:user_admin';
    case 'Viewer':
    case 'viewer':
    case 'insightdocs:viewer':
      return 'insightdocs:viewer';
    default:
      return null;
  }
}

function formatProjectRoleLabel(role: ProjectRole | null, language: Language = 'th') {
  switch (role) {
    case 'insightdocs:admin':
      return language === 'th' ? 'ผู้ดูแลระบบ' : 'Administrator';
    case 'insightdocs:audit_reader':
      return language === 'th' ? 'ผู้อ่าน Audit Log' : 'Audit Reader';
    case 'insightdocs:document_controller':
      return language === 'th' ? 'ผู้ควบคุมเอกสาร' : 'Document Controller';
    case 'insightdocs:manager':
      return language === 'th' ? 'ผู้อนุมัติ' : 'Manager';
    case 'insightdocs:signer':
      return language === 'th' ? 'ผู้ลงนาม' : 'Signer';
    case 'insightdocs:user_admin':
      return language === 'th' ? 'ผู้ดูแลผู้ใช้' : 'User Administrator';
    case 'insightdocs:viewer':
      return language === 'th' ? 'ผู้ใช้งานทั่วไป' : 'Viewer';
    default:
      return language === 'th' ? 'ไม่ระบุบทบาท' : 'Unassigned role';
  }
}
