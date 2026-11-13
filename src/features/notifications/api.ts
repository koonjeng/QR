import { supabase } from '@/lib/supabase';
import { Notification } from '@/types';

// ดึงรายการการแจ้งเตือนของผู้ใช้
export async function getMyNotifications(): Promise<Notification[]> {
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return [];

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', authData.user.id)
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) throw error;
  return (data as Notification[]) || [];
}

// มาร์กว่าอ่านแล้ว 1 รายการ
export async function markNotificationAsRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id);

  if (error) throw error;
}

// มาร์กว่าอ่านแล้วทั้งหมด
export async function markAllNotificationsAsRead(): Promise<void> {
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return;

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', authData.user.id)
    .eq('is_read', false);

  if (error) throw error;
}

