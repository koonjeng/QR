import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEquipments, EquipmentWithLocation } from '@/features/equipment/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QrCode, ArrowRight, Camera, Search, Wrench, ChevronRight } from 'lucide-react';

export function ScanQRPage() {
  const [equipmentCodeOrId, setEquipmentCodeOrId] = useState('');
  const [recentEquipments, setRecentEquipments] = useState<EquipmentWithLocation[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    getEquipments().then((list) => {
      setRecentEquipments(list.slice(0, 5));
    });
  }, []);

  const handleGoToEquipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipmentCodeOrId.trim()) return;
    navigate(`/scan/${equipmentCodeOrId.trim()}`);
  };

  return (
    <div className="space-y-4 pb-20">
      <Card className="border-slate-200">
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-2">
            <Camera className="w-8 h-8" />
          </div>
          <CardTitle className="text-lg">สแกน QR Code หน้าเครื่อง</CardTitle>
          <CardDescription>
            หันกล้องไปที่ป้าย QR Code บนตัวเครื่องจักร หรือระบุรหัสเครื่อง
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Scanner Simulation Area */}
          <div className="aspect-square max-w-[240px] mx-auto border-2 border-dashed border-primary/50 rounded-2xl flex flex-col items-center justify-center p-6 text-center bg-slate-50/70 relative overflow-hidden group">
            <div className="absolute inset-x-0 h-0.5 bg-primary/80 shadow-md animate-[bounce_2s_infinite]" />
            <QrCode className="w-16 h-16 text-primary/40 mb-2" />
            <span className="text-xs text-slate-500 font-medium">
              ส่องกล้องหรือเล็งตำแหน่ง QR Code
            </span>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground font-semibold">หรือกรอกรหัสอุปกรณ์</span>
            </div>
          </div>

          <form onSubmit={handleGoToEquipment} className="space-y-2.5">
            <div className="relative">
              <Input
                type="text"
                placeholder="ระบุรหัสเครื่อง เช่น CNC-01 หรือ ID"
                value={equipmentCodeOrId}
                onChange={(e) => setEquipmentCodeOrId(e.target.value)}
                className="font-mono text-center text-base uppercase font-bold"
              />
            </div>
            <Button
              type="submit"
              disabled={!equipmentCodeOrId.trim()}
              className="w-full font-semibold gap-2"
              size="lg"
            >
              ไปยังหน้าเครื่องจักร
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Quick Select from existing equipment */}
      {recentEquipments.length > 0 && (
        <Card className="border-slate-200">
          <CardHeader className="p-3.5 pb-1">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              เลือกเครื่องจักรทดสอบด่วน:
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
