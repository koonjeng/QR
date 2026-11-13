import { Database, UserRole, WoStatus, ProblemType, PriorityLevel, EquipmentStatus } from './database';

export * from './database';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Location = Database['public']['Tables']['locations']['Row'];
export type Equipment = Database['public']['Tables']['equipment']['Row'];
export type WorkOrder = Database['public']['Tables']['work_orders']['Row'];
export type WorkOrderLog = Database['public']['Tables']['work_order_logs']['Row'];
export type Attachment = Database['public']['Tables']['attachments']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type AuditLog = Database['public']['Tables']['audit_logs']['Row'];

// ข้อความภาษาไทยสำหรับ Enums ต่างๆ
export const ROLE_LABELS: Record<UserRole, string> = {
  operator: 'พนักงานฝ่ายผลิต (Operator)',
  technician: 'ช่างซ่อมบำรุง (Technician)',
  supervisor: 'หัวหน้างาน (Supervisor)',
  admin: 'ผู้ดูแลระบบ (Admin)',
};

export const STATUS_LABELS: Record<WoStatus, string> = {
  reported: 'แจ้งซ่อมแล้ว',
  accepted: 'รับงานแล้ว',
  in_progress: 'กำลังซ่อม',
  waiting_parts: 'รออะไหล่',
  inspection: 'รอทดสอบ/ตรวจสอบ',
  closed: 'ปิดงานแล้ว',
  cancelled: 'ยกเลิก',
};

export const STATUS_COLORS: Record<WoStatus, { bg: string; text: string; badge: string }> = {
  reported: { bg: 'bg-amber-50', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-800 border-amber-200' },
  accepted: { bg: 'bg-blue-50', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800 border-blue-200' },
  in_progress: { bg: 'bg-indigo-50', text: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  waiting_parts: { bg: 'bg-orange-50', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-800 border-orange-200' },
  inspection: { bg: 'bg-purple-50', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-800 border-purple-200' },
  closed: { bg: 'bg-emerald-50', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  cancelled: { bg: 'bg-zinc-100', text: 'text-zinc-600', badge: 'bg-zinc-200 text-zinc-700 border-zinc-300' },
};

export const PROBLEM_TYPE_LABELS: Record<ProblemType, string> = {
  mechanical: 'เครื่องกล (Mechanical)',
  electrical: 'ระบบไฟฟ้า (Electrical)',
  pneumatic: 'ระบบลม/นิวเมติก (Pneumatic)',
  hydraulic: 'ไฮดรอลิก (Hydraulic)',
  other: 'อื่นๆ (Other)',
};

export const PRIORITY_LABELS: Record<PriorityLevel, string> = {
  low: 'ต่ำ (Low)',
  medium: 'ปานกลาง (Medium)',
  high: 'สูง (High)',
  critical: 'วิกฤต/เร่งด่วนที่สุด (Critical)',
};

export const PRIORITY_COLORS: Record<PriorityLevel, { text: string; badge: string }> = {
  low: { text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  medium: { text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800 border-blue-200' },
  high: { text: 'text-amber-700', badge: 'bg-amber-100 text-amber-800 border-amber-200' },
  critical: { text: 'text-rose-700', badge: 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse' },
};

export const EQUIPMENT_STATUS_LABELS: Record<EquipmentStatus, string> = {
  active: 'พร้อมใช้งาน (Active)',
  inactive: 'งดใช้งาน/ชำรุด (Inactive)',
  retired: 'ปลดระวาง (Retired)',
};

