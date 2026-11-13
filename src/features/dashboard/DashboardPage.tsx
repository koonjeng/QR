import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardMetrics, DashboardMetrics } from './api';
import {
  WoStatus,
  STATUS_LABELS,
  STATUS_COLORS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
} from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingState, ErrorState } from '@/components/ui/states';
import { formatDate } from '@/lib/utils';
import {
  LayoutDashboard,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Wrench,
  TrendingUp,
  RefreshCw,
  Flame,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMetrics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getDashboardMetrics();
      setMetrics(data);
    } catch (err: any) {
      setError(err.message || 'ไม่สามารถโหลดข้อมูลสถิติได้');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  if (isLoading) {
    return <LoadingState message="กำลังประมวลผลข้อมูลแดชบอร์ด..." />;
  }

  if (error || !metrics) {
    return <ErrorState message={error || 'เกิดข้อผิดพลาดในการโหลดข้อมูล'} onRetry={loadMetrics} />;
  }

  const maxBrokenCount = metrics.topBrokenEquipment[0]?.count || 1;

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">แดชบอร์ดซ่อมบำรุง</h2>
          <p className="text-xs text-slate-500">สถิติและภาพรวมงานซ่อมในโรงงาน</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadMetrics}
          className="gap-1.5 text-xs h-8"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          รีเฟรช
        </Button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* งานค้างทั้งหมด */}
        <Card className="bg-amber-500/10 border-amber-200">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-900">งานค้างทั้งหมด</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-950 mt-1">
              {metrics.totalOpenOrders}
            </div>
            <span className="text-[10px] text-amber-700">กำลังดำเนินการ</span>
          </CardContent>
        </Card>

        {/* งานวิกฤต/เร่งด่วน */}
        <Card className="bg-rose-500/10 border-rose-200">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-rose-900">งานเร่งด่วนค้าง</span>
              <Flame className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-black text-rose-950 mt-1">
              {metrics.urgentOpenOrders.length}
            </div>
            <span className="text-[10px] text-rose-700">ด่วน & วิกฤต</span>
          </CardContent>
        </Card>

        {/* เครื่องจักรในระบบ */}
        <Card className="bg-blue-500/10 border-blue-200">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-blue-900">อุปกรณ์ทั้งหมด</span>
              <Wrench className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-blue-950 mt-1">
              {metrics.totalEquipment}
            </div>
            <span className="text-[10px] text-blue-700">เครื่องจักรที่ลงทะเบียน</span>
          </CardContent>
        </Card>

        {/* ปิดงานสำเร็จแล้ว */}
        <Card className="bg-emerald-500/10 border-emerald-200">
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-900">ปิดงานแล้ว</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-950 mt-1">
              {metrics.totalClosedOrders}
            </div>
            <span className="text-[10px] text-emerald-700">งานที่ซ่อมเสร็จสิ้น</span>
          </CardContent>
        </Card>
      </div>

      {/* สถิติตามขั้นตอนงาน (Status Distribution) */}
      <Card className="border-slate-200">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-bold text-slate-800">
            จำนวนงานแยกตามสถานะ
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-1 space-y-2">
          {(
            [
              'reported',
              'accepted',
              'in_progress',
              'waiting_parts',
              'inspection',
              'closed',
            ] as WoStatus[]
          ).map((st) => {
            const count = metrics.statusCounts[st] || 0;
            const color = STATUS_COLORS[st];
            const pct = metrics.totalWorkOrders > 0
              ? Math.round((count / metrics.totalWorkOrders) * 100)
              : 0;

            return (
              <div key={st} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-700">{STATUS_LABELS[st]}</span>
                  <span className="font-mono text-slate-900">
                    {count} ใบ ({pct}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      st === 'closed'
                        ? 'bg-emerald-500'
                        : st === 'reported'
                        ? 'bg-amber-500'
                        : st === 'in_progress'
                        ? 'bg-blue-600'
                        : 'bg-primary'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* งานเร่งด่วนที่ยังไม่ปิด (Urgent Open Work Orders) */}
      <Card className="border-rose-200 shadow-xs">
        <CardHeader className="p-4 pb-2 bg-rose-50/50 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-rose-950 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-rose-600" />
              งานเร่งด่วนที่ยังไม่ปิด ({metrics.urgentOpenOrders.length})
            </CardTitle>
            <Link to="/work-orders" className="text-xs text-rose-700 font-semibold hover:underline">
              ดูทั้งหมด
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-2 space-y-2">
          {metrics.urgentOpenOrders.length === 0 ? (
            <div className="text-center py-4 text-xs text-emerald-700 font-medium">
              ✓ เยี่ยมมาก! ไม่มีงานด่วนหรือวิกฤตค้างอยู่ในระบบ
            </div>
          ) : (
            metrics.urgentOpenOrders.map((wo) => {
              const pColor = PRIORITY_COLORS[wo.priority];
              const sColor = STATUS_COLORS[wo.status];
              return (
                <Link
                  key={wo.id}
                  to={`/work-orders/${wo.id}`}
                  className="block p-3 rounded-xl border border-rose-100 hover:border-rose-300 bg-white transition-all shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-xs text-slate-900">{wo.wo_no}</span>
                      <Badge className={`text-[10px] px-1 py-0 font-bold ${pColor.badge}`}>
                        {PRIORITY_LABELS[wo.priority]}
                      </Badge>
                    </div>
                    <Badge className={`text-[10px] font-semibold ${sColor.badge}`}>
                      {STATUS_LABELS[wo.status]}
                    </Badge>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{wo.equipment_name}</h4>
                  <p className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">{wo.description}</p>
                </Link>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* เครื่องที่เสียบ่อยสุด Top 10 */}
      <Card className="border-slate-200">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-primary" />
            เครื่องที่เสียบ่อยสุด Top 10 (Breakdown Ranking)
          </CardTitle>
          <CardDescription className="text-xs">
            จัดอันดับเครื่องจักรตามจำนวนครั้งที่เปิดใบแจ้งซ่อม
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-1 space-y-2.5">
          {metrics.topBrokenEquipment.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">ยังไม่มีสถิติเครื่องเสีย</p>
          ) : (
            metrics.topBrokenEquipment.map((item, index) => {
              const widthPct = Math.round((item.count / maxBrokenCount) * 100);
              return (
                <Link
                  key={item.id}
                  to={`/equipment/${item.id}`}
                  className="block p-2.5 rounded-xl border hover:border-primary/50 transition-colors bg-white group"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                        {index + 1}
                      </span>
                      <span className="font-mono font-bold text-slate-800">{item.code}</span>
                      <span className="text-slate-600 truncate max-w-[150px] font-medium">
                        {item.name}
                      </span>
                    </div>
                    <span className="font-bold text-rose-600 font-mono">
                      {item.count} ครั้ง
                    </span>
                  </div>

                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-500 rounded-full transition-all duration-500"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </Link>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
