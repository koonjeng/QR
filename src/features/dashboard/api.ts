import { supabase } from '@/lib/supabase';
import { WoStatus, PriorityLevel, ProblemType } from '@/types';

export interface DashboardMetrics {
  totalEquipment: number;
  totalWorkOrders: number;
  totalOpenOrders: number;
  totalClosedOrders: number;
  statusCounts: Record<WoStatus, number>;
  topBrokenEquipment: {
    id: string;
    code: string;
    name: string;
    location_name?: string;
    count: number;
  }[];
  urgentOpenOrders: {
    id: string;
    wo_no: string;
    equipment_name: string;
    equipment_code: string;
    priority: PriorityLevel;
    status: WoStatus;
    reported_at: string;
    description: string;
  }[];
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  // 1. ดึงอุปกรณ์ทั้งหมด
  const { count: eqCount } = await supabase
    .from('equipment')
    .select('*', { count: 'exact', head: true });

  // 2. ดึงใบแจ้งซ่อมทั้งหมดเพื่อคำนวณสถิติ
  const { data: allWos, error: woError } = await supabase
    .from('work_orders')
    .select(`
      id,
      wo_no,
      status,
      priority,
      description,
      reported_at,
      equipment_id,
      equipment(id, code, name, location:locations(name))
    `)
    .order('created_at', { ascending: false });

  if (woError) throw woError;

  const wos = allWos || [];

  const statusCounts: Record<WoStatus, number> = {
    reported: 0,
    accepted: 0,
    in_progress: 0,
    waiting_parts: 0,
    inspection: 0,
    closed: 0,
    cancelled: 0,
  };

  const eqCountMap: Record<
    string,
    { id: string; code: string; name: string; location_name?: string; count: number }
  > = {};

  const urgentOpenOrders: any[] = [];

  for (const w of wos) {
    // นับสถานะ
    if (statusCounts[w.status as WoStatus] !== undefined) {
      statusCounts[w.status as WoStatus]++;
    }

    // นับเครื่องที่เสียบ่อย
    const eq = w.equipment as any;
    if (eq) {
      if (!eqCountMap[eq.id]) {
        eqCountMap[eq.id] = {
          id: eq.id,
          code: eq.code,
          name: eq.name,
          location_name: eq.location?.name,
          count: 0,
        };
      }
      eqCountMap[eq.id].count++;
    }

    // งานเร่งด่วนที่ยังไม่ปิด (critical, high)
    const isOpen = w.status !== 'closed' && w.status !== 'cancelled';
    const isUrgent = w.priority === 'critical' || w.priority === 'high';
    if (isOpen && isUrgent) {
      urgentOpenOrders.push({
        id: w.id,
        wo_no: w.wo_no,
        equipment_name: eq?.name || 'ไม่ทราบเครื่อง',
        equipment_code: eq?.code || '-',
        priority: w.priority as PriorityLevel,
        status: w.status as WoStatus,
        reported_at: w.reported_at,
        description: w.description,
      });
    }
  }

  // จัดอันดับ Top 10 เครื่องเสียบ่อยสุด
  const topBrokenEquipment = Object.values(eqCountMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const totalOpenOrders =
    statusCounts.reported +
    statusCounts.accepted +
    statusCounts.in_progress +
    statusCounts.waiting_parts +
    statusCounts.inspection;

  return {
    totalEquipment: eqCount || 0,
    totalWorkOrders: wos.length,
    totalOpenOrders,
    totalClosedOrders: statusCounts.closed,
    statusCounts,
    topBrokenEquipment,
    urgentOpenOrders,
  };
}

