import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/context';
import {
  getWorkOrderById,
  acceptWorkOrder,
  assignWorkOrder,
  updateWorkOrderStatus,
  getTechnicians,
  WorkOrderWithDetails,
} from './api';
import {
  WoStatus,
  STATUS_LABELS,
  STATUS_COLORS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  PROBLEM_TYPE_LABELS,
  Profile,
} from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { LoadingState, ErrorState } from '@/components/ui/states';
import { formatDate } from '@/lib/utils';
import {
  ArrowLeft,
  Wrench,
  User,
  Clock,
  Camera,
  CheckCircle,
  AlertTriangle,
  PlayCircle,
  PauseCircle,
  CheckCheck,
  XCircle,
  UserCheck,
  FileText,
  X,
  History,
  Image as ImageIcon,
} from 'lucide-react';

export function WorkOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isTechnician, isSupervisor, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [workOrder, setWorkOrder] = useState<WorkOrderWithDetails | null>(null);
  const [technicians, setTechnicians] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Action States
  const [isUpdating, setIsUpdating] = useState(false);
  const [assigneeId, setAssigneeId] = useState('');
  const [assignNote, setAssignNote] = useState('');

  // Form สำหรับช่างบันทึกสาเหตุ/วิธีแก้
  const [cause, setCause] = useState('');
  const [solution, setSolution] = useState('');
  const [logNote, setLogNote] = useState('');
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const loadData = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);
      const [wo, techs] = await Promise.all([
        getWorkOrderById(id),
        isSupervisor ? getTechnicians() : Promise.resolve([]),
      ]);

      if (!wo) {
        setError('ไม่พบใบแจ้งซ่อม หรือคุณไม่มีสิทธิ์เข้าถึงใบงานนี้');
      } else {
        setWorkOrder(wo);
        setCause(wo.cause || '');
        setSolution(wo.solution || '');
        if (wo.assigned_to) setAssigneeId(wo.assigned_to);
        setTechnicians(techs);
      }
    } catch (err: any) {
      setError(err.message || 'ไม่สามารถโหลดข้อมูลใบแจ้งซ่อมได้');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // ช่างกดรับงาน
  const handleAccept = async () => {
    if (!workOrder) return;
    try {
      setIsUpdating(true);
      await acceptWorkOrder(workOrder.id);
      await loadData();
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการรับงาน: ' + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // Supervisor มอบหมายงาน
  const handleAssign = async () => {
    if (!workOrder || !assigneeId) return;
    try {
      setIsUpdating(true);
      await assignWorkOrder(workOrder.id, assigneeId, assignNote);
      setAssignNote('');
      await loadData();
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการมอบหมายงาน: ' + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // ช่าง หรือ Supervisor เปลี่ยนสถานะงาน
  const handleStatusChange = async (nextStatus: WoStatus) => {
    if (!workOrder) return;
    try {
      setIsUpdating(true);
      await updateWorkOrderStatus(workOrder.id, nextStatus, {
        cause,
        solution,
        note: logNote || undefined,
        newImages,
      });

      setLogNote('');
      setNewImages([]);
      setNewImagePreviews([]);
      await loadData();
    } catch (err: any) {
      alert('ไม่สามารถอัปเดตสถานะงานได้: ' + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setNewImages((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  if (isLoading) {
    return <LoadingState message="กำลังโหลดรายละเอียดใบแจ้งซ่อม..." />;
  }

  if (error || !workOrder) {
    return <ErrorState message={error || 'ไม่พบใบงาน'} onRetry={loadData} />;
  }

  const statusColor = STATUS_COLORS[workOrder.status];
  const priorityColor = PRIORITY_COLORS[workOrder.priority];
  const isAssignedToMe = workOrder.assigned_to === user?.id;
  const isUnassigned = !workOrder.assigned_to;
  const isClosedOrCancelled = workOrder.status === 'closed' || workOrder.status === 'cancelled';

  return (
    <div className="space-y-4 pb-24">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/work-orders')}
          className="gap-1.5 -ml-2 text-slate-600"
        >
          <ArrowLeft className="w-4 h-4" />
          กลับรายการใบงาน
        </Button>
      </div>

      {/* Main Info Card */}
      <Card className="border-slate-200 overflow-hidden shadow-xs">
        <CardHeader className="p-4 pb-2 bg-slate-50/70 border-b">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-base text-slate-900 tracking-tight">
                  {workOrder.wo_no}
                </span>
                <Badge className={`text-[10px] font-bold ${priorityColor.badge}`}>
                  {PRIORITY_LABELS[workOrder.priority]}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                แจ้งเมื่อ: {formatDate(workOrder.reported_at)}
              </p>
            </div>

            <Badge className={`text-xs font-bold px-2.5 py-1 ${statusColor.badge}`}>
              {STATUS_LABELS[workOrder.status]}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          {/* ข้อมูลเครื่องจักร */}
          <div className="p-3 bg-slate-50 rounded-xl border flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                อุปกรณ์ที่แจ้งซ่อม
              </span>
              <h4 className="font-bold text-sm text-slate-900 mt-0.5">
                {workOrder.equipment?.name || 'ไม่ทราบชื่อเครื่อง'}
              </h4>
              <span className="font-mono text-xs text-primary font-bold">
                รหัส: {workOrder.equipment?.code}
              </span>
            </div>
            {workOrder.equipment?.id && (
              <Link to={`/equipment/${workOrder.equipment.id}`}>
                <Button variant="outline" size="sm" className="text-xs h-8">
                  ดูเครื่อง
                </Button>
              </Link>
            )}
          </div>

          {/* รายละเอียดอาการและปัญหา */}
          <div>
            <span className="text-xs font-bold text-slate-700 block mb-1">
              ประเภทปัญหา: <span className="text-primary">{PROBLEM_TYPE_LABELS[workOrder.problem_type]}</span>
            </span>
            <div className="p-3 rounded-xl bg-slate-50 border text-xs text-slate-800 font-medium leading-relaxed">
              {workOrder.description}
            </div>
          </div>

          {/* ผู้เกี่ยวข้อง */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-xl border">
              <span className="text-slate-400 block text-[10px]">ผู้แจ้งซ่อม</span>
              <span className="font-bold text-slate-800 mt-0.5 block">
                {workOrder.reporter?.full_name || 'ไม่ระบุ'}
              </span>
              <span className="text-[10px] text-slate-500">{workOrder.reporter?.department}</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border">
              <span className="text-slate-400 block text-[10px]">ช่างผู้รับผิดชอบ</span>
              <span className={`font-bold mt-0.5 block ${isUnassigned ? 'text-amber-600' : 'text-slate-800'}`}>
                {workOrder.assignee?.full_name || 'ยังไม่มีผู้รับงาน'}
              </span>
              <span className="text-[10px] text-slate-500">
                {workOrder.accepted_at ? `รับเมื่อ: ${formatDate(workOrder.accepted_at)}` : '-'}
              </span>
            </div>
          </div>

          {/* สาเหตุ & วิธีแก้ไข (ถ้ามีบันทึกแล้ว) */}
          {(workOrder.cause || workOrder.solution) && (
            <div className="space-y-2 pt-2 border-t text-xs">
              {workOrder.cause && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
                  <span className="font-bold text-amber-900 block mb-0.5">สาเหตุที่พบ (Cause):</span>
                  <p className="text-slate-700">{workOrder.cause}</p>
                </div>
              )}
              {workOrder.solution && (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                  <span className="font-bold text-emerald-900 block mb-0.5">วิธีแก้ไข (Solution):</span>
                  <p className="text-slate-700">{workOrder.solution}</p>
                </div>
              )}
            </div>
          )}

          {/* แกลเลอรี่รูปภาพแนบ */}
          {workOrder.attachments && workOrder.attachments.length > 0 && (
            <div className="pt-2 border-t">
              <span className="text-xs font-bold text-slate-700 block mb-2 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-slate-400" />
                รูปถ่ายที่แนบในใบงาน ({workOrder.attachments.length} รูป)
              </span>
              <div className="grid grid-cols-3 gap-2">
                {workOrder.attachments.map((att) => (
                  <button
                    key={att.id}
                    type="button"
                    onClick={() => setSelectedImage(att.file_path)}
                    className="aspect-square rounded-xl overflow-hidden border bg-slate-100 hover:opacity-90 transition-opacity"
                  >
                    <img src={att.file_path} alt="Attachment" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ACTION PANEL 1: สำหรับช่าง (Technician Action) */}
      {!isClosedOrCancelled && (isTechnician || isSupervisor) && (
        <Card className="border-primary/40 ring-1 ring-primary/20 shadow-md">
          <CardHeader className="p-4 pb-2 bg-primary/5 border-b">
            <CardTitle className="text-sm font-bold text-primary flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              การดำเนินการของช่างซ่อมบำรุง
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3.5">
            {/* ปุ่มกดรับงาน (ถ้ายังไม่มีใครรับ) */}
            {isUnassigned && workOrder.status === 'reported' && (
              <Button
                size="lg"
                disabled={isUpdating}
                onClick={handleAccept}
                className="w-full font-bold gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <CheckCircle className="w-5 h-5" />
                {isUpdating ? 'กำลังรับงาน...' : 'กดรับงานนี้ด้วยตนเอง'}
              </Button>
            )}

            {/* อัปเดตสถานะการซ่อม */}
            {(isAssignedToMe || isSupervisor) && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    เปลี่ยนสถานะการดำเนินงาน
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={workOrder.status === 'in_progress' ? 'default' : 'outline'}
                      disabled={isUpdating}
                      onClick={() => handleStatusChange('in_progress')}
                      className="text-xs h-10 gap-1 font-semibold"
                    >
                      <PlayCircle className="w-3.5 h-3.5 text-indigo-500" />
                      กำลังซ่อม
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant={workOrder.status === 'waiting_parts' ? 'default' : 'outline'}
                      disabled={isUpdating}
                      onClick={() => handleStatusChange('waiting_parts')}
                      className="text-xs h-10 gap-1 font-semibold"
                    >
                      <PauseCircle className="w-3.5 h-3.5 text-amber-500" />
                      รออะไหล่
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant={workOrder.status === 'inspection' ? 'default' : 'outline'}
                      disabled={isUpdating}
                      onClick={() => handleStatusChange('inspection')}
                      className="text-xs h-10 gap-1 font-semibold"
                    >
                      <CheckCheck className="w-3.5 h-3.5 text-purple-500" />
                      รอตรวจรับ
                    </Button>
                  </div>
                </div>

                {/* สาเหตุ & วิธีแก้ไข */}
                <div className="space-y-2 pt-2 border-t">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      สาเหตุของปัญหา (Cause)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="เช่น แบริ่งสึกหรอ, สายพานหย่อน..."
                      value={cause}
                      onChange={(e) => setCause(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      วิธีการแก้ไข / เปลี่ยนอะไหล่ (Solution)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="เช่น ปรับตั้งความตึงสายพาน, เปลี่ยนแบริ่งใหม่..."
                      value={solution}
                      onChange={(e) => setSolution(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* แนบรูปภาพเพิ่มเติม */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5 text-slate-500" />
                    ถ่ายรูป/แนบรูปผลการซ่อม
                  </label>
                  <div className="flex flex-wrap gap-2 items-center">
                    {newImagePreviews.map((preview, idx) => (
                      <div key={idx} className="w-12 h-12 rounded-lg border overflow-hidden relative">
                        <img src={preview} alt="New" className="w-full h-full object-cover" />
                      </div>
                    ))}
                    <label className="w-12 h-12 rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 text-slate-400">
                      <Camera className="w-4 h-4" />
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        multiple
                        onChange={handleAddPhotos}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <Button
                  size="default"
                  disabled={isUpdating}
                  onClick={() => handleStatusChange(workOrder.status)}
                  className="w-full text-xs font-bold gap-2"
                >
                  {isUpdating ? 'กำลังบันทึก...' : 'บันทึกสาเหตุ/วิธีแก้ไข/รูปถ่าย'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ACTION PANEL 2: สำหรับหัวหน้างาน (Supervisor / Admin Action) */}
      {!isClosedOrCancelled && isSupervisor && (
        <Card className="border-slate-200">
          <CardHeader className="p-4 pb-2 bg-slate-50/70 border-b">
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-primary" />
              การจัดการของหัวหน้างาน (Supervisor)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {/* มอบหมายงาน */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">มอบหมายงานให้ช่าง</label>
              <div className="flex gap-2">
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="flex-1 text-xs h-10 rounded-xl border border-slate-300 bg-white px-2.5 font-medium"
                >
                  <option value="">-- เลือกช่างผู้รับผิดชอบ --</option>
                  {technicians.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name} ({t.department || 'ช่างซ่อมบำรุง'})
                    </option>
                  ))}
                </select>
                <Button
                  size="sm"
                  disabled={!assigneeId || isUpdating}
                  onClick={handleAssign}
                  className="h-10 text-xs px-3 font-semibold shrink-0"
                >
                  มอบหมาย
                </Button>
              </div>
            </div>

            {/* ปุ่มปิดงาน และ ยกเลิกงาน */}
            <div className="pt-2 border-t grid grid-cols-2 gap-2">
              <Button
                variant="default"
                disabled={isUpdating}
                onClick={() => {
                  const confirmClose = window.confirm('คุณต้องการปิดงานซ่อมนี้ใช่หรือไม่?');
                  if (confirmClose) handleStatusChange('closed');
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-11 gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                อนุมัติและปิดงาน (Close)
              </Button>

              <Button
                variant="destructive"
                disabled={isUpdating}
                onClick={() => {
                  const confirmCancel = window.confirm('คุณต้องการยกเลิกใบงานนี้ใช่หรือไม่?');
                  if (confirmCancel) handleStatusChange('cancelled');
                }}
                className="font-bold text-xs h-11 gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                ยกเลิกใบงาน
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TIMELINE: ประวัติ Work Order Logs */}
      <Card className="border-slate-200">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <History className="w-4 h-4 text-primary" />
            ประวัติการเปลี่ยนสถานะและเหตุการณ์ (Timeline)
          </CardTitle>
          <CardDescription className="text-xs">
            บันทึกการกระทำทุกขั้นตอนตามระบบ Audit Trail
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-1">
          <div className="relative pl-6 space-y-4 border-l-2 border-slate-200 ml-2 py-2">
            {workOrder.logs && workOrder.logs.length > 0 ? (
              workOrder.logs.map((log, index) => (
                <div key={log.id} className="relative group">
                  {/* Dot */}
                  <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-white border-2 border-primary ring-4 ring-white" />

                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800">{log.action}</span>
                      <span className="text-[10px] text-slate-400">{formatDate(log.created_at)}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>{log.user?.full_name || 'ผู้ใช้งาน'}</span>
                      {log.to_status && (
                        <span className="text-[10px] font-mono text-primary font-bold">
                          [{STATUS_LABELS[log.to_status]}]
                        </span>
                      )}
                    </div>

                    {log.note && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border mt-1">
                        {log.note}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400">ยังไม่มีบันทึกประวัติการกระทำ</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal ดูรูปภาพขนาดใหญ่ */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-lg max-h-[85vh] bg-black rounded-2xl overflow-hidden">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-3 right-3 p-2 bg-black/60 text-white rounded-full hover:bg-black"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={selectedImage} alt="Large preview" className="max-w-full max-h-[85vh] object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}

