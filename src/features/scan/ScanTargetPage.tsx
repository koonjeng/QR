import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getEquipmentById, getEquipmentByCode, EquipmentWithLocation } from '@/features/equipment/api';
import { getWorkOrdersByEquipment, createWorkOrder, WorkOrderWithDetails } from '@/features/workorders/api';
import {
  ProblemType,
  PriorityLevel,
  PROBLEM_TYPE_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
  EQUIPMENT_STATUS_LABELS,
} from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { LoadingState, ErrorState } from '@/components/ui/states';
import { formatDate } from '@/lib/utils';
import {
  Wrench,
  AlertTriangle,
  History,
  MapPin,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Camera,
  X,
  Zap,
  Wind,
  Droplets,
  HelpCircle,
  Cog,
  Clock,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

// ตัวเลือกประเภทปัญหาพร้อมไอคอนขนาดใหญ่ กดง่าย
const PROBLEM_OPTIONS: { type: ProblemType; label: string; icon: any; color: string }[] = [
  { type: 'mechanical', label: 'เครื่องกล', icon: Cog, color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { type: 'electrical', label: 'ระบบไฟฟ้า', icon: Zap, color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { type: 'pneumatic', label: 'ระบบลม/นิวเมติก', icon: Wind, color: 'bg-sky-100 text-sky-800 border-sky-300' },
  { type: 'hydraulic', label: 'ไฮดรอลิก', icon: Droplets, color: 'bg-cyan-100 text-cyan-800 border-cyan-300' },
  { type: 'other', label: 'อื่นๆ / ไม่แน่ชัด', icon: HelpCircle, color: 'bg-purple-100 text-purple-800 border-purple-300' },
];

export function ScanTargetPage() {
  const { equipmentId } = useParams<{ equipmentId: string }>();
  const navigate = useNavigate();

  const [equipment, setEquipment] = useState<EquipmentWithLocation | null>(null);
  const [workOrders, setWorkOrders] = useState<WorkOrderWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Quick Report State
  const [isReporting, setIsReporting] = useState(false);
  const [selectedProblemType, setSelectedProblemType] = useState<ProblemType>('mechanical');
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [description, setDescription] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isOptionalOpen, setIsOptionalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdWo, setCreatedWo] = useState<{ id: string; wo_no: string } | null>(null);

  // Tab ประวัติซ่อม
  const [showHistory, setShowHistory] = useState(false);

  const loadData = async () => {
    if (!equipmentId) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setNotFound(false);

      // ลองค้นหาด้วย ID ก่อน ถ้าไม่เจอให้ลองค้นหาด้วย Code
      let eq = await getEquipmentById(equipmentId);
      if (!eq) {
        eq = await getEquipmentByCode(equipmentId);
      }

      if (!eq) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }

      setEquipment(eq);

      // ดึงงานซ่อมของเครื่องนี้
      const wos = await getWorkOrdersByEquipment(eq.id);
      setWorkOrders(wos);
    } catch (err) {
      console.error('Error fetching equipment by scan:', err);
      setNotFound(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [equipmentId]);

  // การจัดการรูปภาพแนบ
  const handleAddImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setImageFiles((prev) => [...prev, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // ส่งแจ้งซ่อมด่วน 3 แตะ
  const handleQuickSubmit = async () => {
    if (!equipment) return;
    try {
      setIsSubmitting(true);

      const newWo = await createWorkOrder(
        {
          equipment_id: equipment.id,
          problem_type: selectedProblemType,
          priority,
          description: description || undefined,
        },
        imageFiles
      );

      setCreatedWo({ id: newWo.id, wo_no: newWo.wo_no });
      setIsReporting(false);
      // โหลดข้อมูลงานล่าสุดใหม่
      const updatedWos = await getWorkOrdersByEquipment(equipment.id);
      setWorkOrders(updatedWos);
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการส่งแจ้งซ่อม: ' + (err.message || 'กรุณาลองใหม่อีกครั้ง'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="กำลังค้นหาข้อมูลเครื่องจักรจาก QR Code..." />;
  }

  // กรณีไม่พบเครื่อง
  if (notFound || !equipment) {
    return (
      <div className="space-y-4 pb-20">
        <Card className="border-rose-200 bg-rose-50/40 text-center p-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <CardTitle className="text-xl text-rose-950 font-bold mb-1">
            ไม่พบข้อมูลอุปกรณ์ในระบบ
          </CardTitle>
          <CardDescription className="text-rose-700 text-sm max-w-xs mx-auto mb-5">
            รหัส "{equipmentId}" ไม่ตรงกับอุปกรณ์ใดๆ หรืออาจถูกยกเลิกการใช้งานแล้ว
          </CardDescription>
          <div className="flex flex-col gap-2 max-w-xs mx-auto">
            <Link to="/scan-qr">
              <Button className="w-full font-semibold" size="lg">
                สแกนใหม่อีกครั้ง
              </Button>
            </Link>
            <Link to="/">
              <Button variant="outline" className="w-full">
                กลับหน้าหลัก
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // กรองหางานที่ยังเปิดอยู่ (ยังไม่ closed หรือ cancelled)
  const activeOrders = workOrders.filter(
    (wo) => wo.status !== 'closed' && wo.status !== 'cancelled'
  );

  return (
    <div className="space-y-4 pb-20">
      {/* การแจ้งเตือนเมื่อสร้างใบงานสำเร็จ */}
      {createdWo && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl text-emerald-900 shadow-sm animate-in fade-in zoom-in-95">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-bold text-base text-emerald-950">ส่งแจ้งซ่อมสำเร็จเรียบร้อย!</h4>
              <p className="text-xs text-emerald-800 mt-0.5">
                เลขที่ใบงาน: <span className="font-mono font-bold">{createdWo.wo_no}</span>
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Link to={`/work-orders/${createdWo.id}`}>
                  <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs gap-1">
                    ดูใบงานนี้ <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCreatedWo(null)}
                  className="text-xs border-emerald-300"
                >
                  ปิดการแจ้งเตือน
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* สรุปข้อมูลเครื่องจักร */}
      <Card className="border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-bold font-mono text-base text-amber-300 border border-white/10">
              {equipment.code}
            </div>
            <div>
              <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider block">
                ข้อมูลอุปกรณ์หน้างาน
              </span>
              <h2 className="text-lg font-bold leading-tight">{equipment.name}</h2>
            </div>
          </div>

          <Badge
            variant={
              equipment.status === 'active'
                ? 'default'
                : equipment.status === 'inactive'
                ? 'destructive'
                : 'secondary'
            }
            className="text-xs font-semibold px-2 py-0.5"
          >
            {EQUIPMENT_STATUS_LABELS[equipment.status].split(' ')[0]}
          </Badge>
        </div>

        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-600 border-b pb-2.5">
            <span className="flex items-center gap-1.5 font-medium">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              สถานที่: <span className="font-bold text-slate-800">{equipment.location?.name || 'ไม่ระบุ'}</span>
            </span>
            {equipment.brand && (
              <span>
                ยี่ห้อ: <span className="font-semibold text-slate-800">{equipment.brand}</span>
              </span>
            )}
          </div>

          {/* งานซ่อมที่ยังค้างอยู่ (ถ้ามี) */}
          {activeOrders.length > 0 ? (
            <div className="p-3 bg-amber-50/90 border border-amber-300/80 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>เครื่องนี้มีงานซ่อมค้างอยู่ {activeOrders.length} รายการ</span>
              </div>
              {activeOrders.slice(0, 2).map((wo) => {
                const color = STATUS_COLORS[wo.status];
                return (
                  <div
                    key={wo.id}
                    className="flex items-center justify-between p-2 bg-white rounded-lg border border-amber-200 text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-slate-800">{wo.wo_no}</span>
                      <p className="text-[11px] text-slate-500 truncate max-w-[180px]">
                        {PROBLEM_TYPE_LABELS[wo.problem_type]} - {wo.description}
                      </p>
                    </div>
                    <Badge className={`text-[10px] font-semibold ${color.badge}`}>
                      {STATUS_LABELS[wo.status]}
                    </Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-2 p-2.5 bg-emerald-50 rounded-xl text-emerald-800 text-xs border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>ไม่มีงานซ่อมค้างอยู่ เครื่องพร้อมใช้งานปกติ</span>
            </div>
          )}

          {/* ปุ่มหลัก 2 ปุ่มใหญ่ตามข้อกำหนด: [แจ้งซ่อม] [ดูประวัติซ่อม] */}
          {!isReporting && (
            <div className="grid grid-cols-1 gap-2.5 pt-1">
              <Button
                size="lg"
                onClick={() => setIsReporting(true)}
                className="w-full h-14 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-lg shadow-md gap-2"
              >
                <AlertTriangle className="w-6 h-6 text-amber-300" />
                แจ้งซ่อมด่วน (Quick Report)
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => setShowHistory(!showHistory)}
                  className="w-full gap-1.5 text-xs font-semibold"
                >
                  <History className="w-4 h-4" />
                  {showHistory ? 'ซ่อนประวัติ' : `ดูประวัติ (${workOrders.length})`}
                </Button>

                <Link to={`/equipment/${equipment.id}`}>
                  <Button variant="ghost" size="default" className="w-full gap-1.5 text-xs text-slate-600">
                    <Wrench className="w-4 h-4" />
                    ดูสเปกเครื่อง
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* FORM แจ้งซ่อมด่วน 3 แตะ (เมื่อกดแจ้งซ่อม) */}
      {isReporting && (
        <Card className="border-rose-300 ring-2 ring-rose-400/30 overflow-hidden shadow-lg animate-in slide-in-from-top-4">
          <div className="p-4 bg-rose-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-300" />
              <h3 className="font-bold text-base">แจ้งซ่อมด่วน (3 แตะ)</h3>
            </div>
            <button
              onClick={() => setIsReporting(false)}
              className="p-1 rounded-lg text-rose-200 hover:text-white hover:bg-rose-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <CardContent className="p-4 space-y-4">
            {/* แตะที่ 2: เลือกประเภทปัญหา (ปุ่มใหญ่พิเศษ สัมผัสง่ายด้วยนิ้วโป้ง) */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                แตะเลือกประเภทปัญหาที่พบ *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PROBLEM_OPTIONS.map((item) => {
                  const Icon = item.icon;
                  const isSelected = selectedProblemType === item.type;
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => setSelectedProblemType(item.type)}
                      className={`p-3 rounded-xl border-2 flex items-center gap-2.5 text-left transition-all active:scale-98 ${
                        isSelected
                          ? 'border-rose-600 bg-rose-50 ring-2 ring-rose-500/20 shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-rose-600 text-white' : item.color
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`text-xs font-bold ${isSelected ? 'text-rose-900' : 'text-slate-800'}`}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ตัวเลือกเสริม (Accordion พับเก็บได้ เพื่อให้ flow 3 แตะกระชับที่สุด) */}
            <div className="border rounded-xl overflow-hidden bg-slate-50/50">
              <button
                type="button"
                onClick={() => setIsOptionalOpen(!isOptionalOpen)}
                className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <span>รายละเอียดเพิ่มเติม & ถ่ายรูป (ตัวเลือกเสริม)</span>
                {isOptionalOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {isOptionalOpen && (
                <div className="p-3.5 pt-1 space-y-3 border-t bg-white">
                  {/* ระดับความเร่งด่วน */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ระดับความเร่งด่วน
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(['low', 'medium', 'high', 'critical'] as PriorityLevel[]).map((lvl) => {
                        const isSel = priority === lvl;
                        return (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => setPriority(lvl)}
                            className={`py-2 px-1 text-center rounded-lg text-[11px] font-bold border transition-colors ${
                              isSel
                                ? lvl === 'critical'
                                  ? 'bg-rose-600 text-white border-rose-600'
                                  : 'bg-primary text-white border-primary'
                                : 'bg-slate-50 text-slate-700 border-slate-200'
                            }`}
                          >
                            {PRIORITY_LABELS[lvl].split(' ')[0]}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* คำอธิบาย */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      คำอธิบายอาการเสีย
                    </label>
                    <textarea
                      rows={2}
                      placeholder="ระบุอาการ เช่น มอเตอร์มีเสียงดังผิดปกติ, น้ำมันรั่ว ฯลฯ"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {/* แนบรูปถ่ายจากกล้อง */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5 text-slate-500" />
                      แนบรูปถ่ายหน้างาน (บีบอัดอัตโนมัติ)
                    </label>

                    <div className="flex flex-wrap gap-2 items-center">
                      {imagePreviews.map((preview, idx) => (
                        <div key={idx} className="relative w-14 h-14 rounded-lg overflow-hidden border">
                          <img src={preview} alt="Thumb" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute top-0 right-0 p-0.5 bg-black/70 text-white rounded-bl"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}

                      <label className="w-14 h-14 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors text-slate-500">
                        <Camera className="w-5 h-5 text-slate-400" />
                        <span className="text-[9px] mt-0.5 font-semibold">ถ่าย/แนบ</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          multiple
                          onChange={handleAddImages}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* แตะที่ 3: ปุ่มยืนยันส่งแจ้งซ่อม (ปุ่มใหญ่ กดง่ายที่สุด) */}
            <div className="pt-2">
              <Button
                size="lg"
                disabled={isSubmitting}
                onClick={handleQuickSubmit}
                className="w-full h-14 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-lg gap-2 shadow-md active:scale-98"
              >
                {isSubmitting ? (
                  'กำลังส่งข้อมูลแจ้งซ่อม...'
                ) : (
                  <>
                    <CheckCircle2 className="w-6 h-6 text-white" />
                    ยืนยันส่งแจ้งซ่อมทันที
                  </>
                )}
              </Button>
              <p className="text-[11px] text-center text-slate-400 mt-2">
                แตะ 3: ส่งข้อมูลไปยังช่างซ่อมบำรุงและหัวหน้างานทันที
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ประวัติการซ่อมของเครื่องนี้ (แสดงเมื่อกดดูประวัติ) */}
      {showHistory && (
        <Card className="border-slate-200">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              ประวัติการซ่อมทั้งหมด ({workOrders.length} ครั้ง)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 space-y-2.5">
            {workOrders.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                ยังไม่มีประวัติการแจ้งซ่อมสำหรับเครื่องนี้
              </p>
            ) : (
              workOrders.map((wo) => {
                const color = STATUS_COLORS[wo.status];
                return (
                  <Link
                    key={wo.id}
                    to={`/work-orders/${wo.id}`}
                    className="block p-3 rounded-xl border hover:border-primary/50 transition-colors bg-white"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-xs text-slate-900">
                        {wo.wo_no}
                      </span>
                      <Badge className={`text-[10px] font-semibold ${color.badge}`}>
                        {STATUS_LABELS[wo.status]}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-700 line-clamp-1 font-medium">
                      {PROBLEM_TYPE_LABELS[wo.problem_type]}: {wo.description}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(wo.reported_at)}
                      </span>
                      <span>ผู้แจ้ง: {wo.reporter?.full_name || 'ไม่ระบุ'}</span>
                    </div>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

