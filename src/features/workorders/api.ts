import { supabase } from '@/lib/supabase';
import {
  WorkOrder,
  WorkOrderLog,
  Attachment,
  ProblemType,
  PriorityLevel,
  WoStatus,
  Profile,
  Equipment,
} from '@/types';
import { compressImage } from '@/lib/imageCompression';

export interface WorkOrderWithDetails extends WorkOrder {
  equipment?: Equipment | null;
  reporter?: Profile | null;
  assignee?: Profile | null;
  logs?: (WorkOrderLog & { user?: Profile | null })[];
  attachments?: Attachment[];
}

export interface CreateWorkOrderInput {
  equipment_id: string;
  problem_type: ProblemType;
  priority?: PriorityLevel;
  description?: string;
}

export interface WorkOrderFilters {
  status?: string;
  priority?: string;
  equipment_id?: string;
  assigned_to?: string;
  search?: string;
}

// 1. ดึงรายการใบแจ้งซ่อมตามเงื่อนไข Filters
export async function getWorkOrders(filters?: WorkOrderFilters): Promise<WorkOrderWithDetails[]> {
  let query = supabase
    .from('work_orders')
    .select(`
      *,
      reporter:profiles!work_orders_reported_by_fkey(*),
      assignee:profiles!work_orders_assigned_to_fkey(*),
      equipment(*)
    `)
    .order('created_at', { ascending: false });

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status as WoStatus);
  }

  if (filters?.priority && filters.priority !== 'all') {
    query = query.eq('priority', filters.priority as PriorityLevel);
  }

  if (filters?.equipment_id && filters.equipment_id !== 'all') {
    query = query.eq('equipment_id', filters.equipment_id);
  }

  if (filters?.assigned_to && filters.assigned_to !== 'all') {
    if (filters.assigned_to === 'unassigned') {
      query = query.is('assigned_to', null);
    } else {
      query = query.eq('assigned_to', filters.assigned_to);
    }
  }

  if (filters?.search) {
    const s = `%${filters.search}%`;
    query = query.or(`wo_no.ilike.${s},description.ilike.${s}`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as any) || [];
}

// 2. ดึงงานซ่อมของเครื่องจักรนั้นๆ
export async function getWorkOrdersByEquipment(equipmentId: string): Promise<WorkOrderWithDetails[]> {
  const { data, error } = await supabase
    .from('work_orders')
    .select(`
      *,
      reporter:profiles!work_orders_reported_by_fkey(*),
      assignee:profiles!work_orders_assigned_to_fkey(*),
      equipment(*)
    `)
    .eq('equipment_id', equipmentId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as any) || [];
}

// 3. ดึงรายละเอียดใบแจ้งซ่อมตาม ID พร้อม Logs และ Attachments
export async function getWorkOrderById(id: string): Promise<WorkOrderWithDetails | null> {
  const { data: wo, error: woError } = await supabase
    .from('work_orders')
    .select(`
      *,
      reporter:profiles!work_orders_reported_by_fkey(*),
      assignee:profiles!work_orders_assigned_to_fkey(*),
      equipment(*)
    `)
    .eq('id', id)
    .single();

  if (woError) {
    if (woError.code === 'PGRST116') return null;
    throw woError;
  }

  // ดึง logs และ attachments พร้อม user profile
  const [logsRes, attsRes] = await Promise.all([
    supabase
      .from('work_order_logs')
      .select('*, user:profiles(*)')
      .eq('work_order_id', id)
      .order('created_at', { ascending: true }),
    supabase
      .from('attachments')
      .select('*')
      .eq('work_order_id', id)
      .order('created_at', { ascending: false }),
  ]);

  return {
    ...(wo as any),
    logs: (logsRes.data as any) || [],
    attachments: (attsRes.data as any) || [],
  };
}

// 4. ดึงรายชื่อช่างและหัวหน้างาน สำหรับ Dropdown มอบหมายงาน
export async function getTechnicians(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .in('role', ['technician', 'supervisor', 'admin'])
    .eq('is_active', true)
    .order('full_name', { ascending: true });

  if (error) throw error;
  return (data as Profile[]) || [];
}

// 5. สร้างใบแจ้งซ่อมใหม่ (Quick Report)
export async function createWorkOrder(
  input: CreateWorkOrderInput,
  imageFiles: File[] = []
): Promise<WorkOrder> {
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id;
  if (!userId) throw new Error('ผู้ใช้ยังไม่ได้เข้าสู่ระบบ');

  const finalDescription = input.description?.trim() || 'แจ้งซ่อมด่วนผ่าน QR Code หน้าเครื่อง';

  const { data: newWo, error: woError } = await supabase
    .from('work_orders')
    .insert({
      equipment_id: input.equipment_id,
      reported_by: userId,
      problem_type: input.problem_type,
      priority: input.priority || 'medium',
      status: 'reported',
      description: finalDescription,
      reported_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (woError) throw woError;

  const workOrderId = newWo.id;

  // Initial Log
  await supabase.from('work_order_logs').insert({
    work_order_id: workOrderId,
    user_id: userId,
    action: 'เปิดใบแจ้งซ่อม',
    from_status: null,
    to_status: 'reported',
    note: finalDescription,
  });

  // Attachments
  if (imageFiles.length > 0) {
    await uploadWoAttachments(workOrderId, input.equipment_id, userId, imageFiles);
  }

  // แจ้งเตือนทีมงาน
  try {
    const { data: staff } = await supabase
      .from('profiles')
      .select('id')
      .in('role', ['technician', 'supervisor', 'admin']);

    if (staff && staff.length > 0) {
      const notifs = staff.map((s) => ({
        user_id: s.id,
        title: `มีใบแจ้งซ่อมใหม่ (${newWo.wo_no})`,
        body: `ความเร่งด่วน: ${input.priority || 'medium'} - ${finalDescription.slice(0, 50)}`,
        ref: `/work-orders/${workOrderId}`,
        is_read: false,
      }));
      await supabase.from('notifications').insert(notifs);
    }
  } catch (err) {
    console.error('Failed to send notification:', err);
  }

  return newWo;
}

// 6. ช่างกดรับงานด้วยตัวเอง (Self-Accept)
export async function acceptWorkOrder(workOrderId: string): Promise<void> {
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id;
  if (!userId) throw new Error('ผู้ใช้ยังไม่ได้เข้าสู่ระบบ');

  const { data: currentWo, error: fetchErr } = await supabase
    .from('work_orders')
    .select('status')
    .eq('id', workOrderId)
    .single();

  if (fetchErr) throw fetchErr;

  const fromStatus = currentWo.status;

  const { error: updateErr } = await supabase
    .from('work_orders')
    .update({
      assigned_to: userId,
      status: 'accepted',
      accepted_at: new Date().toISOString(),
    })
    .eq('id', workOrderId);

  if (updateErr) throw updateErr;

  await supabase.from('work_order_logs').insert({
    work_order_id: workOrderId,
    user_id: userId,
    action: 'ช่างกดรับงานด้วยตนเอง',
    from_status: fromStatus,
    to_status: 'accepted',
    note: 'ช่างได้รับมอบหมายงานและเตรียมเข้าตรวจสอบ',
  });
}

// 7. Supervisor / Admin มอบหมายงานให้ช่าง
export async function assignWorkOrder(
  workOrderId: string,
  technicianId: string,
  note?: string
): Promise<void> {
  const { data: authData } = await supabase.auth.getUser();
  const currentUserId = authData?.user?.id;
  if (!currentUserId) throw new Error('ผู้ใช้ยังไม่ได้เข้าสู่ระบบ');

  const { data: currentWo, error: fetchErr } = await supabase
    .from('work_orders')
    .select('status, assigned_to')
    .eq('id', workOrderId)
    .single();

  if (fetchErr) throw fetchErr;

  const fromStatus = currentWo.status;
  const newStatus = fromStatus === 'reported' ? 'accepted' : fromStatus;

  const { error: updateErr } = await supabase
    .from('work_orders')
    .update({
      assigned_to: technicianId,
      status: newStatus,
      accepted_at: currentWo.status === 'reported' ? new Date().toISOString() : undefined,
    })
    .eq('id', workOrderId);

  if (updateErr) throw updateErr;

  await supabase.from('work_order_logs').insert({
    work_order_id: workOrderId,
    user_id: currentUserId,
    action: 'มอบหมายงานให้ช่าง',
    from_status: fromStatus,
    to_status: newStatus,
    note: note || 'มอบหมายงานให้ช่างผู้รับผิดชอบ',
  });

  // แจ้งเตือนช่างที่ได้รับมอบหมาย
  try {
    await supabase.from('notifications').insert({
      user_id: technicianId,
      title: 'คุณได้รับมอบหมายงานซ่อมใหม่',
      body: note || 'กรุณาตรวจสอบใบงานและเตรียมเข้าซ่อมบำรุง',
      ref: `/work-orders/${workOrderId}`,
      is_read: false,
    });
  } catch (err) {
    console.error('Failed to notify assigned technician:', err);
  }
}

// 8. อัปเดตสถานะงาน, บันทึกสาเหตุ/วิธีแก้, แนบรูปหลักฐาน
export async function updateWorkOrderStatus(
  workOrderId: string,
  nextStatus: WoStatus,
  options?: {
    cause?: string;
    solution?: string;
    note?: string;
    newImages?: File[];
  }
): Promise<void> {
  const { data: authData } = await supabase.auth.getUser();
  const currentUserId = authData?.user?.id;
  if (!currentUserId) throw new Error('ผู้ใช้ยังไม่ได้เข้าสู่ระบบ');

  const { data: currentWo, error: fetchErr } = await supabase
    .from('work_orders')
    .select('status, equipment_id, cause, solution')
    .eq('id', workOrderId)
    .single();

  if (fetchErr) throw fetchErr;

  const fromStatus = currentWo.status;

  const updatePayload: any = {
    status: nextStatus,
  };

  if (options?.cause !== undefined) {
    updatePayload.cause = options.cause.trim() || null;
  }
  if (options?.solution !== undefined) {
    updatePayload.solution = options.solution.trim() || null;
  }
  if (nextStatus === 'closed') {
    updatePayload.closed_at = new Date().toISOString();
  }

  const { error: updateErr } = await supabase
    .from('work_orders')
    .update(updatePayload)
    .eq('id', workOrderId);

  if (updateErr) throw updateErr;

  // บันทึก Log การเปลี่ยนสถานะ
  const actionText =
    nextStatus === 'closed'
      ? 'ปิดงานซ่อมบำรุง (Closed)'
      : nextStatus === 'cancelled'
      ? 'ยกเลิกใบงาน (Cancelled)'
      : nextStatus === 'in_progress'
      ? 'กำลังดำเนินการซ่อม'
      : nextStatus === 'waiting_parts'
      ? 'รออะไหล่/ชิ้นส่วน'
      : nextStatus === 'inspection'
      ? 'ส่งตรวจรับ/ทดสอบระบบ'
      : `เปลี่ยนสถานะเป็น ${nextStatus}`;

  await supabase.from('work_order_logs').insert({
    work_order_id: workOrderId,
    user_id: currentUserId,
    action: actionText,
    from_status: fromStatus,
    to_status: nextStatus,
    note: options?.note || (options?.solution ? `วิธีแก้ไข: ${options.solution}` : null),
  });

  // อัปโหลดรูปภาพหลักฐานเพิ่มเติม
  if (options?.newImages && options.newImages.length > 0) {
    await uploadWoAttachments(
      workOrderId,
      currentWo.equipment_id,
      currentUserId,
      options.newImages
    );
  }
}

// Helper: อัปโหลดรูปภาพลง Bucket และบันทึกตาราง attachments
export async function uploadWoAttachments(
  workOrderId: string,
  equipmentId: string,
  userId: string,
  files: File[]
): Promise<void> {
  for (const rawFile of files) {
    try {
      const compressed = await compressImage(rawFile);
      const fileName = `${workOrderId}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('wo-attachments')
        .upload(fileName, compressed, { cacheControl: '3600', upsert: false });

      if (!uploadError) {
        const { data: publicData } = supabase.storage
          .from('wo-attachments')
          .getPublicUrl(fileName);

        await supabase.from('attachments').insert({
          work_order_id: workOrderId,
          equipment_id: equipmentId,
          file_path: publicData.publicUrl,
          file_type: compressed.type,
          file_size: compressed.size,
          uploaded_by: userId,
        });
      }
    } catch (err) {
      console.error('Error uploading wo attachment:', err);
    }
  }
}
