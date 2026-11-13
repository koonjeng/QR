import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/context';
import { QRCodeSVG } from 'qrcode.react';
import {
  getEquipmentById,
  deleteEquipment,
  getLocations,
  EquipmentWithLocation,
} from './api';
import { Location, EQUIPMENT_STATUS_LABELS } from '@/types';
import { EquipmentFormDialog } from './EquipmentFormDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingState, ErrorState } from '@/components/ui/states';
import { formatDateOnly } from '@/lib/utils';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Printer,
  FileText,
  Wrench,
  MapPin,
  Calendar,
  AlertTriangle,
  History,
  Download,
} from 'lucide-react';

export function EquipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isSupervisor } = useAuth();
  const navigate = useNavigate();

  const [equipment, setEquipment] = useState<EquipmentWithLocation | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog Edit
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);
      const [eq, locs] = await Promise.all([
        getEquipmentById(id),
        getLocations(),
      ]);

      if (!eq) {
        setError('ไม่พบข้อมูลเครื่องจักรในระบบ หรือเครื่องอาจถูกลบไปแล้ว');
      } else {
        setEquipment(eq);
        setLocations(locs);
      }
    } catch (err: any) {
      setError(err.message || 'ไม่สามารถโหลดข้อมูลอุปกรณ์ได้');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleDelete = async () => {
    if (!equipment) return;
    const confirmDelete = window.confirm(
      `คุณต้องการลบอุปกรณ์ "${equipment.name} (${equipment.code})" หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`
    );
    if (!confirmDelete) return;

    try {
      setIsDeleting(true);
      await deleteEquipment(equipment.id);
      navigate('/equipment', { replace: true });
    } catch (err: any) {
      alert('ไม่สามารถลบอุปกรณ์ได้: ' + (err.message || 'ติดความสัมพันธ์กับใบแจ้งซ่อม'));
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="กำลังโหลดข้อมูลอุปกรณ์..." />;
  }

  if (error || !equipment) {
    return <ErrorState message={error || 'ไม่พบเครื่อง'} onRetry={loadData} />;
  }

  const qrUrl = `${window.location.origin}/scan/${equipment.id}`;

  return (
    <div className="space-y-4 pb-20">
      {/* Top Nav */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate('/equipment')} className="gap-1.5 -ml-2 text-slate-600">
          <ArrowLeft className="w-4 h-4" />
          กลับรายการอุปกรณ์
        </Button>

        {isSupervisor && (
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditOpen(true)}
              className="gap-1 text-xs h-8"
            >
              <Edit className="w-3.5 h-3.5" />
              แก้ไข
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={isDeleting}
              onClick={handleDelete}
              className="gap-1 text-xs h-8"
            >
              <Trash2 className="w-3.5 h-3.5" />
              ลบ
            </Button>
          </div>
        )}
      </div>

      {/* Main Info Card */}
      <Card className="overflow-hidden border-slate-200">
        {equipment.image_path ? (
          <div className="w-full h-52 bg-slate-100 overflow-hidden relative">
            <img
              src={equipment.image_path}
              alt={equipment.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : null}

        <CardHeader className="p-4 pb-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="font-mono font-bold text-sm bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                {equipment.code}
              </span>
              <CardTitle className="text-xl font-bold text-slate-900 mt-1.5">
                {equipment.name}
              </CardTitle>
            </div>
            <Badge
              variant={
                equipment.status === 'active'
                  ? 'default'
                  : equipment.status === 'inactive'
                  ? 'destructive'
                  : 'secondary'
              }
              className="text-xs px-2.5 py-1"
            >
              {EQUIPMENT_STATUS_LABELS[equipment.status]}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-2 space-y-4">
          {/* Quick specs grid */}
          <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border">
            <div>
              <span className="text-slate-500 block">สถานที่ติดตั้ง:</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                {equipment.location?.name || 'ไม่ระบุ'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">ยี่ห้อ / รุ่น:</span>
              <span className="font-semibold text-slate-800 mt-0.5 block">
                {equipment.brand || '-'} {equipment.model ? `/ ${equipment.model}` : ''}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Serial Number:</span>
              <span className="font-mono font-semibold text-slate-800 mt-0.5 block">
                {equipment.serial_no || '-'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">วันหมดประกัน:</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {formatDateOnly(equipment.warranty_until)}
              </span>
            </div>
          </div>

          {/* Manual PDF download link */}
          {equipment.manual_path && (
            <a
              href={equipment.manual_path}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-900 hover:bg-blue-100/70 transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <div>
                  <span className="text-xs font-bold block">คู่มือการใช้งานและเอกสารสเปก</span>
                  <span className="text-[10px] text-blue-700">คลิกเพื่อเปิดดูหรือดาวน์โหลด PDF</span>
                </div>
              </div>
              <Download className="w-4 h-4 text-blue-600" />
            </a>
          )}

          {/* Action Button: แจ้งซ่อมเครื่องนี้ */}
          <Link to={`/scan/${equipment.id}`} className="block">
            <Button size="lg" className="w-full gap-2 font-bold text-base shadow-sm">
              <AlertTriangle className="w-5 h-5 text-amber-300" />
              แจ้งซ่อมเครื่องนี้
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* QR Code Section */}
      <Card className="border-slate-200">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Printer className="w-4 h-4 text-primary" />
            QR Code ประจำเครื่อง
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-1 flex flex-col items-center text-center">
          <div className="p-4 bg-white rounded-2xl border-2 border-dashed border-slate-200 shadow-xs mb-3">
            <QRCodeSVG value={qrUrl} size={160} level="M" />
          </div>
          <div className="font-mono font-bold text-base text-slate-900">{equipment.code}</div>
          <p className="text-xs text-slate-500 max-w-xs mt-0.5 mb-3">{equipment.name}</p>

          <Link to={`/equipment/print-qr?ids=${equipment.id}`}>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Printer className="w-3.5 h-3.5" />
              พิมพ์สติกเกอร์ QR (A4)
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <EquipmentFormDialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSuccess={loadData}
        initialData={equipment}
        locations={locations}
        onLocationsChange={loadData}
      />
    </div>
  );
}

