import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/context';
import {
  getWorkOrders,
  acceptWorkOrder,
  WorkOrderWithDetails,
  WorkOrderFilters,
} from './api';
import {
  WoStatus,
  PriorityLevel,
  STATUS_LABELS,
  STATUS_COLORS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  PROBLEM_TYPE_LABELS,
} from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/states';
import { Pagination } from '@/components/ui/pagination';
import { formatDate } from '@/lib/utils';
import {
  Search,
  Filter,
  ClipboardList,
  Wrench,
  Clock,
  User,
  CheckCircle,
  ChevronRight,
  AlertCircle,
  Plus,
} from 'lucide-react';

export function WorkOrdersPage() {
  const { user, role, isTechnician } = useAuth();
  const navigate = useNavigate();

  const [workOrders, setWorkOrders] = useState<WorkOrderWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [tabFilter, setTabFilter] = useState<'all' | 'open' | 'my' | 'closed'>('all');
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setCurrentPage(1); // รีเซ็ตหน้ากลับเป็นหน้า 1 เมื่อเงื่อนไขเปลี่ยน

      const filters: WorkOrderFilters = {
        search: search.trim() || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter : undefined,
      };

      if (tabFilter === 'open') {
        // เฉพาะงานที่ยังไม่เสร็จ
      } else if (tabFilter === 'my') {
        filters.assigned_to = user?.id;
      } else if (tabFilter === 'closed') {
        filters.status = 'closed';
      }

      const list = await getWorkOrders(filters);

      // กรองฝั่ง client เพิ่มเติมสำหรับ tab 'open'
      let filtered = list;
      if (tabFilter === 'open') {
        filtered = list.filter((wo) => wo.status !== 'closed' && wo.status !== 'cancelled');
      }

      setWorkOrders(filtered);
    } catch (err: any) {
      setError(err.message || 'ไม่สามารถโหลดรายการใบแจ้งซ่อมได้');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, priorityFilter, tabFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleQuickAccept = async (e: React.MouseEvent, workOrderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setAcceptingId(workOrderId);
      await acceptWorkOrder(workOrderId);
      await loadData();
    } catch (err: any) {
      alert('ไม่สามารถรับงานได้: ' + (err.message || 'เกิดข้อผิดพลาด'));
    } finally {
      setAcceptingId(null);
    }
  };

  // คำนวณข้อมูลสำหรับ Pagination
  const totalPages = Math.ceil(workOrders.length / pageSize) || 1;
  const paginatedWorkOrders = workOrders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-3.5 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {role === 'operator' ? 'งานแจ้งซ่อมของฉัน' : 'รายการใบแจ้งซ่อม (Work Orders)'}
          </h2>
          <p className="text-xs text-slate-500">
            {role === 'operator' ? 'ติดตามความคืบหน้างัดซ่อม' : 'จัดการและติดตามงานซ่อมบำรุง'}
          </p>
        </div>

        <Link to="/scan-qr">
          <Button size="sm" className="gap-1.5 text-xs font-semibold shadow-xs">
            <Plus className="w-4 h-4" />
            แจ้งซ่อม
          </Button>
        </Link>
      </div>

      {/* Quick Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600 gap-1">
        <button
          onClick={() => setTabFilter('all')}
          className={`flex-1 py-1.5 rounded-lg transition-colors ${
            tabFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
          }`}
        >
          ทั้งหมด
        </button>
        <button
          onClick={() => setTabFilter('open')}
          className={`flex-1 py-1.5 rounded-lg transition-colors ${
            tabFilter === 'open' ? 'bg-white text-primary shadow-xs' : 'hover:text-slate-900'
          }`}
        >
          งานค้างอยู่
        </button>
        {isTechnician && (
          <button
            onClick={() => setTabFilter('my')}
            className={`flex-1 py-1.5 rounded-lg transition-colors ${
              tabFilter === 'my' ? 'bg-white text-primary shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            งานของฉัน
          </button>
        )}
        <button
          onClick={() => setTabFilter('closed')}
          className={`flex-1 py-1.5 rounded-lg transition-colors ${
            tabFilter === 'closed' ? 'bg-white text-emerald-700 shadow-xs' : 'hover:text-slate-900'
          }`}
        >
          ปิดงานแล้ว
        </button>
      </div>

      {/* Search & Filters */}
      <div className="space-y-2">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <Input
              type="text"
              placeholder="ค้นหาเลข WO, อาการ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-11 text-sm bg-white"
            />
          </div>
          <Button type="submit" variant="secondary" className="h-11 px-4 text-xs font-semibold">
            ค้นหา
          </Button>
        </form>

        <div className="grid grid-cols-2 gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">ทุกสถานะงาน</option>
            <option value="reported">แจ้งซ่อมแล้ว (Reported)</option>
            <option value="accepted">รับงานแล้ว (Accepted)</option>
            <option value="in_progress">กำลังซ่อม (In Progress)</option>
            <option value="waiting_parts">รออะไหล่ (Waiting Parts)</option>
            <option value="inspection">รอตรวจรับ (Inspection)</option>
            <option value="closed">ปิดงานแล้ว (Closed)</option>
            <option value="cancelled">ยกเลิก (Cancelled)</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">ทุกความเร่งด่วน</option>
            <option value="critical">วิกฤต (Critical)</option>
            <option value="high">สูง (High)</option>
            <option value="medium">ปานกลาง (Medium)</option>
            <option value="low">ต่ำ (Low)</option>
          </select>
        </div>
      </div>

      {/* Work Order Cards List */}
      {isLoading ? (
        <LoadingState message="กำลังโหลดรายการใบแจ้งซ่อม..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : workOrders.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="w-12 h-12 stroke-[1.5]" />}
          title="ไม่พบรายการใบแจ้งซ่อม"
          description={
            search ? 'ไม่พบใบงานที่ตรงกับเงื่อนไขค้นหา' : 'ยังไม่มีประวัติใบแจ้งซ่อมในระบบ'
          }
          action={
            <Link to="/scan-qr">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                สแกนแจ้งซ่อมเครื่อง
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {paginatedWorkOrders.map((wo) => {
            const statusColor = STATUS_COLORS[wo.status];
            const priorityColor = PRIORITY_COLORS[wo.priority];
            const isUnassigned = !wo.assigned_to;
            const canSelfAccept = isTechnician && isUnassigned && wo.status === 'reported';

            return (
              <Link key={wo.id} to={`/work-orders/${wo.id}`} className="block">
                <Card className="hover:border-primary/50 transition-all active:scale-[0.99] overflow-hidden shadow-xs">
                  <CardContent className="p-4 space-y-2.5">
                    {/* Top Row: WO Number + Priority + Status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-sm text-slate-900 tracking-tight">
                          {wo.wo_no}
                        </span>
                        <Badge className={`text-[10px] px-1.5 py-0 font-bold ${priorityColor.badge}`}>
                          {PRIORITY_LABELS[wo.priority].split(' ')[0]}
                        </Badge>
                      </div>

                      <Badge className={`text-[11px] font-bold px-2 py-0.5 ${statusColor.badge}`}>
                        {STATUS_LABELS[wo.status]}
                      </Badge>
                    </div>

                    {/* Machine info & Problem */}
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <Wrench className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-bold text-slate-800">{wo.equipment?.name || 'ไม่ทราบชื่อเครื่อง'}</span>
                        <span className="font-mono text-[10px] bg-slate-100 px-1 py-0.2 rounded">
                          {wo.equipment?.code}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 font-semibold line-clamp-2 mt-1">
                        <span className="text-primary font-bold">[{PROBLEM_TYPE_LABELS[wo.problem_type]}]</span>{' '}
                        {wo.description}
                      </p>
                    </div>

                    {/* Footer Info: Reporter, Assignee, Time & Quick Action */}
                    <div className="pt-2 border-t flex items-center justify-between text-[11px] text-slate-500">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>ผู้รับผิดชอบ: </span>
                          <span className={`font-semibold ${isUnassigned ? 'text-amber-600' : 'text-slate-800'}`}>
                            {wo.assignee?.full_name || 'ยังไม่มีผู้รับงาน'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                          <Clock className="w-3 h-3" />
                          {formatDate(wo.reported_at)}
                        </div>
                      </div>

                      {/* ปุ่มด่วนสำหรับช่าง "กดรับงาน" จากหน้าการ์ด */}
                      {canSelfAccept ? (
                        <Button
                          size="sm"
                          disabled={acceptingId === wo.id}
                          onClick={(e) => handleQuickAccept(e, wo.id)}
                          className="h-8 px-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white gap-1 shrink-0"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          {acceptingId === wo.id ? 'กำลังรับ...' : 'รับงานนี้'}
                        </Button>
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}

          {/* Pagination Controls */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={workOrders.length}
            pageSize={pageSize}
            onPageChange={(p) => {
              setCurrentPage(p);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
            pageSizeOptions={[5, 10, 20, 50]}
          />
        </div>
      )}
    </div>
  );
}

