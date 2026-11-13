import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { getEquipments, EquipmentWithLocation } from '@/features/equipment/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QrCode, ArrowRight, Camera, Search, Wrench, ChevronRight, RefreshCw, AlertCircle, CameraOff } from 'lucide-react';

export function ScanQRPage() {
  const [equipmentCodeOrId, setEquipmentCodeOrId] = useState('');
  const [recentEquipments, setRecentEquipments] = useState<EquipmentWithLocation[]>([]);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    getEquipments().then((list) => {
      setRecentEquipments(list.slice(0, 5));
    });
  }, []);

  const handleScanSuccess = (decodedText: string) => {
    // Stop scanning
    if (scannerRef.current && isCameraActive) {
      scannerRef.current.stop().catch(() => {});
    }

    // ถ้าข้อความเป็น URL เช่น https://domain.com/scan/:id ให้ตัดเอา id ออกมา
    try {
      if (decodedText.includes('/scan/')) {
        const parts = decodedText.split('/scan/');
        const targetId = parts[1].split('?')[0].split('#')[0];
        navigate(`/scan/${targetId}`);
        return;
      }
    } catch (e) {
      // fallback
    }

    // ถ้าเป็นรหัสเครื่อง เช่น EQ-MC-001
    navigate(`/scan/${decodedText.trim()}`);
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      const html5QrCode = new Html5Qrcode('qr-reader', {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' }, // กล้องหลังบนมือถือ
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        () => {
          // parse error/frame not found - normal behavior
        }
      );

      setIsCameraActive(true);
    } catch (err: any) {
      console.error('Camera start error:', err);
      setIsCameraActive(false);
      if (err.name === 'NotAllowedError' || err.message?.includes('Permission denied')) {
        setCameraError('กรุณาอนุญาตให้เบราว์เซอร์เข้าถึงกล้องถ่ายรูป');
      } else if (err.name === 'NotFoundError' || err.message?.includes('No device')) {
        setCameraError('ไม่พบอุปกรณ์กล้องบนอุปกรณ์นี้');
      } else {
        setCameraError('ไม่สามารถเปิดกล้องได้: ' + (err.message || 'ข้อผิดพลาดระบบ'));
      }
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current && isCameraActive) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {
        console.error('Stop error:', e);
      } finally {
        setIsCameraActive(false);
      }
    }
  };

  useEffect(() => {
    // เริ่มเปิดกล้องอัตโนมัติเมื่อเข้าหน้า
    startCamera();

    return () => {
      // ปิดกล้องเมื่อออกจากหน้านี้
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const handleGoToEquipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipmentCodeOrId.trim()) return;
    navigate(`/scan/${equipmentCodeOrId.trim()}`);
  };

  return (
    <div className="space-y-4 pb-20">
      <Card className="border-slate-200 overflow-hidden shadow-sm">
        <CardHeader className="text-center pb-2 bg-slate-50/50 border-b">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-1.5">
            <Camera className="w-6 h-6" />
          </div>
          <CardTitle className="text-base font-bold text-slate-800">
            สแกน QR Code หน้าเครื่องจักร
          </CardTitle>
          <CardDescription className="text-xs">
            หันกล้องเล็งป้าย QR Code บนตัวเครื่องเพื่อแจ้งซ่อมด่วน 3 แตะ
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 p-4">
          {/* Camera Viewport Container */}
          <div className="relative aspect-square max-w-[280px] mx-auto bg-black rounded-2xl overflow-hidden shadow-md flex items-center justify-center border-2 border-primary/20">
            {/* Element สำหรับ Render Video Stream */}
            <div id="qr-reader" className="w-full h-full object-cover overflow-hidden" />

            {/* Error Overlay หากเปิดกล้องไม่สำเร็จ */}
            {cameraError && (
              <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-5 text-center text-white z-20">
                <CameraOff className="w-10 h-10 text-rose-400 mb-2" />
                <p className="text-xs font-semibold text-rose-200 mb-3">{cameraError}</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={startCamera}
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  ลองเปิดกล้องอีกครั้ง
                </Button>
              </div>
            )}

            {/* Scanning indicator target guide */}
            {isCameraActive && !cameraError && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-10">
                <div className="w-48 h-48 border-2 border-primary/80 rounded-2xl relative animate-pulse shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-primary rounded-tl" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-primary rounded-tr" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-primary rounded-bl" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-primary rounded-br" />
                </div>
                <span className="text-[11px] font-bold text-white bg-black/60 px-2.5 py-1 rounded-full mt-3 backdrop-blur-xs">
                  กำลังค้นหา QR Code...
                </span>
              </div>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400 font-semibold">หรือพิมพ์รหัสเครื่อง</span>
            </div>
          </div>

          {/* Fallback Form */}
          <form onSubmit={handleGoToEquipment} className="space-y-2">
            <Input
              type="text"
              placeholder="รหัสเครื่อง เช่น EQ-MC-001"
              value={equipmentCodeOrId}
              onChange={(e) => setEquipmentCodeOrId(e.target.value)}
              className="font-mono text-center text-sm uppercase font-bold h-11"
            />
            <Button
              type="submit"
              disabled={!equipmentCodeOrId.trim()}
              className="w-full font-semibold gap-2 h-11 text-sm"
            >
              ค้นหาและไปยังหน้าเครื่อง
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Quick Select from existing equipment */}
      {recentEquipments.length > 0 && (
        <Card className="border-slate-200">
          <CardHeader className="p-3.5 pb-1">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>หรือเลือกเครื่องจักรที่มีในระบบ:</span>
              <span className="text-[11px] text-primary lowercase font-normal">แตะเพื่อทดสอบ</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 pt-1 space-y-1.5">
            {recentEquipments.map((eq) => (
              <button
                key={eq.id}
                type="button"
                onClick={() => navigate(`/scan/${eq.id}`)}
                className="w-full p-2.5 rounded-xl border flex items-center justify-between text-left hover:bg-slate-50 active:scale-99 transition-all bg-white"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded">
                    {eq.code}
                  </span>
                  <span className="text-xs font-semibold text-slate-800 truncate max-w-[180px]">
                    {eq.name}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
