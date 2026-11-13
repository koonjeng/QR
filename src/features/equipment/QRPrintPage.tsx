import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { getEquipments, EquipmentWithLocation } from './api';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft, Loader2 } from 'lucide-react';

export function QRPrintPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [equipments, setEquipments] = useState<EquipmentWithLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // รับรายการ id จาก query string เช่น ?ids=id1,id2,id3 หรือ all
  const idsParam = searchParams.get('ids');

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const all = await getEquipments();
        if (idsParam && idsParam !== 'all') {
          const idList = idsParam.split(',');
          setEquipments(all.filter((item) => idList.includes(item.id)));
        } else {
          setEquipments(all);
        }
      } catch (err) {
        console.error('Error loading equipment for print:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [idsParam]);

  const handlePrint = () => {
    window.print();
  };

  const domain = window.location.origin;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 font-medium text-slate-600">กำลังเตรียมข้อมูลสติกเกอร์...</span>
      </div>
    );
  }

  return (
    <div className="bg-slate-100 min-h-screen print:bg-white print:min-h-0 text-slate-900">
      {/* Control Bar - ซ่อนเวลาพิมพ์จริง */}
      <div className="print:hidden sticky top-0 z-50 bg-white border-b px-6 py-3 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            ย้อนกลับ
          </Button>
          <div>
            <h2 className="font-bold text-sm text-slate-800">พิมพ์สติกเกอร์ QR Code</h2>
            <p className="text-xs text-slate-500">เลือกทั้งหมด {equipments.length} รายการ (ขนาดกระดาษ A4)</p>
          </div>
        </div>

        <Button onClick={handlePrint} className="gap-2 font-semibold shadow-sm" size="sm">
          <Printer className="w-4 h-4" />
          สั่งพิมพ์ (Print A4)
        </Button>
      </div>

      {/* A4 Sheet Container */}
      <div className="max-w-[210mm] mx-auto p-4 sm:p-6 print:p-0 print:m-0 print:w-full">
        <div className="bg-white shadow-md print:shadow-none p-[10mm] min-h-[297mm] print:min-h-0 print:p-[5mm] rounded-xl print:rounded-none">
          {equipments.length === 0 ? (
            <div className="text-center py-20 text-slate-400">ไม่พบรายการอุปกรณ์ที่เลือกพิมพ์</div>
          ) : (
            /* Grid สติกเกอร์ 3 คอลัมน์ต่อแถว จัดหน้าพอดี A4 */
            <div className="grid grid-cols-2 sm:grid-cols-3 print:grid-cols-3 gap-3 print:gap-4">
              {equipments.map((eq) => {
                // QR Code URL: https://<domain>/scan/<equipment_id> ห้ามเก็บข้อมูลอื่นใน QR
                const qrUrl = `${domain}/scan/${eq.id}`;

                return (
                  <div
                    key={eq.id}
                    className="border-2 border-slate-300 border-dashed rounded-xl p-3 flex flex-col items-center justify-between text-center bg-white break-inside-avoid shadow-xs print:shadow-none min-h-[170px]"
                  >
                    <div className="w-full flex items-center justify-between border-b pb-1 mb-2">
                      <span className="text-[9px] font-bold tracking-wider text-slate-500 uppercase">
                        Factory CMMS
                      </span>
                      <span className="text-[9px] font-mono font-bold text-primary">
                        {eq.location?.name || 'Line'}
                      </span>
                    </div>

                    {/* QR Code เฉพาะ URL เท่านั้น */}
                    <div className="p-1.5 bg-white rounded-lg border border-slate-200">
                      <QRCodeSVG
                        value={qrUrl}
                        size={105}
                        level="M"
                        includeMargin={false}
                      />
                    </div>

                    {/* รหัสเครื่อง + ชื่อเครื่อง ใต้ QR */}
                    <div className="w-full mt-2 pt-1 border-t text-center">
                      <div className="font-mono font-black text-sm text-slate-900 tracking-tight leading-none">
                        {eq.code}
                      </div>
                      <div className="text-[11px] font-semibold text-slate-700 line-clamp-1 mt-0.5" title={eq.name}>
                        {eq.name}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Print CSS Rules */}
      <style>{`
        @media print {
          body {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
          .safe-area-bottom, nav, header {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

