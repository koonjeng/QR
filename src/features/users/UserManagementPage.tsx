import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Profile, UserRole, ROLE_LABELS } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/states';
import { Users, Shield, Check, UserCheck, AlertCircle } from 'lucide-react';

export function UserManagementPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles((data as Profile[]) || []);
    } catch (err: any) {
      setError(err.message || 'ไม่สามารถโหลดรายชื่อผู้ใช้ได้');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      setUpdatingId(userId);
      setSuccessMsg(null);
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      setProfiles((prev) =>
        prev.map((p) => (p.id === userId ? { ...p, role: newRole } : p))
      );
      setSuccessMsg('เปลี่ยนบทบาทสำเร็จ');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + (err.message || 'ไม่สามารถเปลี่ยนบทบาทได้'));
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleUserActive = async (userId: string, currentStatus: boolean) => {
    try {
      setUpdatingId(userId);
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      setProfiles((prev) =>
        prev.map((p) => (p.id === userId ? { ...p, is_active: !currentStatus } : p))
      );
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + (err.message || 'ไม่สามารถเปลี่ยนสถานะได้'));
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">จัดการผู้ใช้งานและสิทธิ์</h2>
          <p className="text-xs text-slate-500">กำหนดบทบาท (Role) ให้กับบุคลากรในโรงงาน</p>
        </div>
        <Badge variant="outline" className="gap-1 font-mono">
          <Users className="w-3.5 h-3.5" />
          {profiles.length} คน
        </Badge>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {isLoading ? (
        <LoadingState message="กำลังโหลดรายชื่อผู้ใช้..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchUsers} />
      ) : profiles.length === 0 ? (
        <EmptyState title="ไม่พบผู้ใช้งาน" description="ยังไม่มีผู้ใช้งานลงทะเบียนในระบบ" />
      ) : (
        <div className="space-y-3">
          {profiles.map((p) => (
            <Card key={p.id} className="overflow-hidden">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-base">{p.full_name}</h4>
                      {!p.is_active && (
                        <Badge variant="destructive" className="text-[10px]">
                          ระงับการใช้งาน
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      แผนก: {p.department || 'ไม่ระบุ'} • เบอร์โทร: {p.phone || '-'}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs font-semibold">
                    <Shield className="w-3 h-3 mr-1 text-primary" />
                    {ROLE_LABELS[p.role]}
                  </Badge>
                </div>

                <div className="pt-2 border-t flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-600">เปลี่ยนบทบาท:</span>
                    <select
                      value={p.role}
                      disabled={updatingId === p.id}
                      onChange={(e) => handleRoleChange(p.id, e.target.value as UserRole)}
                      className="text-xs font-medium rounded-lg border border-slate-300 bg-white px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="operator">Operator (พนักงาน)</option>
                      <option value="technician">Technician (ช่าง)</option>
                      <option value="supervisor">Supervisor (หัวหน้างาน)</option>
                      <option value="admin">Admin (ผู้ดูแลระบบ)</option>
                    </select>
                  </div>

                  <Button
                    variant={p.is_active ? 'outline' : 'secondary'}
                    size="sm"
                    disabled={updatingId === p.id}
                    onClick={() => toggleUserActive(p.id, p.is_active)}
                    className="text-xs h-8 px-2.5"
                  >
                    {p.is_active ? 'ระงับชั่วคราว' : 'เปิดใช้งาน'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

