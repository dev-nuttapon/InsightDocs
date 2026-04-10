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

export function formatBusinessRole(role: string) {
  return formatProjectRoleLabel(normalizeProjectRole(role));
}

export function formatBusinessRoleDescription(role: string) {
  switch (normalizeProjectRole(role)) {
    case 'insightdocs:admin':
      return 'สิทธิ์ผู้ดูแลระบบเต็มรูปแบบสำหรับ InsightDocs สามารถจัดการผู้ใช้ บทบาท การอนุมัติคำขอรีเซ็ตรหัสผ่าน ตรวจสอบ audit log และควบคุมการทำงานข้ามทุกโมดูลของระบบได้';
    case 'insightdocs:audit_reader':
      return 'สามารถเข้าดูข้อมูล audit log เพื่อการตรวจสอบด้าน compliance และการติดตามการทำงานของระบบ โดยไม่มีสิทธิ์บริหารจัดการส่วนอื่น';
    case 'insightdocs:document_controller':
      return 'สามารถสร้างเอกสาร จัดการข้อมูลเอกสาร อัปโหลดไฟล์ PDF เวอร์ชันใหม่ และส่งเอกสารเข้าสู่กระบวนการตรวจสอบอนุมัติได้';
    case 'insightdocs:manager':
      return 'สามารถตรวจสอบเอกสารในคิวอนุมัติ และดำเนินการอนุมัติหรือปฏิเสธเอกสาร พร้อมบันทึกความเห็นประกอบใน workflow ได้';
    case 'insightdocs:signer':
      return 'สามารถเข้าถึงงานลงนามที่ได้รับมอบหมาย ตรวจสอบเอกสารที่ผ่านการอนุมัติแล้ว และดำเนินการลงนามหรือปฏิเสธการลงนามตามลำดับขั้นที่กำหนดได้';
    case 'insightdocs:user_admin':
      return 'สามารถจัดการข้อมูลผู้ใช้ การอนุมัติผู้ใช้ และการกำหนดบทบาทในระบบได้ โดยไม่จำเป็นต้องมีสิทธิ์ผู้ดูแลระบบเต็มรูปแบบ';
    case 'insightdocs:viewer':
      return 'สิทธิ์สำหรับการเข้าดูข้อมูลเป็นหลัก สามารถดู dashboard ค้นหาเอกสาร และเปิดดูรายละเอียดเอกสารตามสิทธิ์ที่ระบบอนุญาตได้';
    default:
      return 'บทบาทสำหรับกำหนดสิทธิ์การใช้งานใน InsightDocs';
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

export function getProjectRoleLabels(roles: string[]) {
  return getProjectRoles(roles).map(formatProjectRoleLabel);
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

function formatProjectRoleLabel(role: ProjectRole | null) {
  switch (role) {
    case 'insightdocs:admin':
      return 'ผู้ดูแลระบบ';
    case 'insightdocs:audit_reader':
      return 'ผู้อ่าน Audit Log';
    case 'insightdocs:document_controller':
      return 'ผู้ควบคุมเอกสาร';
    case 'insightdocs:manager':
      return 'ผู้อนุมัติ';
    case 'insightdocs:signer':
      return 'ผู้ลงนาม';
    case 'insightdocs:user_admin':
      return 'ผู้ดูแลผู้ใช้';
    case 'insightdocs:viewer':
      return 'ผู้ใช้งานทั่วไป';
    default:
      return 'ไม่ระบุบทบาท';
  }
}
