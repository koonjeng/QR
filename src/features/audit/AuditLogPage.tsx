import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AuditLog, AuditAction } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/states';
import { formatDate } from '@/lib/utils';
import { ShieldCheck, History, Clock, Database, ChevronDown, ChevronUp } from 'lucide-react';

const ACTION_COLORS: Record<AuditAction, { badge: string; label: string }> = {
  insert: { badge: 'bg-emerald-100 text-emerald-800 border-emerald-300', label: 'สร้าง (INSERT)' },
  update: { badge: 'bg-blue-100 text-blue-800 border-blue-300', label: 'แก้ไข (UPDATE)' },
  delete: { badge: 'bg-rose-100 text-rose-800 border-rose-300', label: 'ลบ (DELETE)' },
};

export function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs((data as AuditLog[]) || []);
    } catch (err: any) {
      setError(err.message || 'ไม่สามารถโหลดประวัติ Audit Log ได้');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">บันทึกประวัติการเปลี่ยนแปลง (Audit Logs)</h2>
          <p className="text-xs text-slate-500">
            ระบบบันทึกเหตุการณ์ระดับ Database Trigger (เฉพาะ Admin)
          </p>
        </div>
        <Badge variant="outline" className="font-mono text-xs gap-1">
          <History className="w-3.5 h-3.5" />
          {logs.length} รายการ
        </Badge>
      </div>

      {isLoading ? (
        <LoadingState message="กำลังโหลดประวัติ Audit Logs..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchLogs} />
      ) : logs.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="w-12 h-12 stroke-[1.5]" />}
          title="ไม่มีข้อมูล Audit Log"
          description="ยังไม่มีประวัติการเปลี่ยนแปลงในตารางที่ถูกบันทึก"
        />
      ) : (
        <div className="space-y-2.5">
          {logs.map((log) => {
            const actInfo = ACTION_COLORS[log.action] || {
              badge: 'bg-slate-100 text-slate-800 border-slate-300',
              label: log.action,
            };
            const isExpanded = expandedId === log.id;

            return (
              <Card key={log.id} className="overflow-hidden">
                <CardContent className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded border">
                        {log.table_name}
                      </span>
                      <Badge className={`text-[10px] font-bold ${actInfo.badge}`}>
                        {actInfo.label}
                      </Badge>
                    </div>

                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {formatDate(log.created_at)}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 font-mono truncate">
                    Record ID: {log.record_id}
                  </div>

                  {/* Toggle JSON snapshot */}
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : log.id)}
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 pt-1"
                  >
                    <span>{isExpanded ? 'ซ่อน Snapshot JSON' : 'ดูข้อมูล JSON Snapshot'}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {isExpanded && (
                    <div className="p-2.5 bg-slate-900 text-slate-200 rounded-xl text-[11px] font-mono overflow-x-auto space-y-2 mt-1">
                      {log.old_data && (
                        <div>
                          <span className="text-amber-400 font-bold block mb-1">
                            -- OLD DATA --
                          </span>
                          <pre>{JSON.stringify(log.old_data, null, 2)}</pre>
                        </div>
                      )}
                      {log.new_data && (
                        <div>
                          <span className="text-emerald-400 font-bold block mb-1">
                            -- NEW DATA --
                          </span>
                          <pre>{JSON.stringify(log.new_data, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

