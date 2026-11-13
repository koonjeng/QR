import { Card, CardContent } from '@/components/ui/card';
import { Wrench } from 'lucide-react';

export function EquipmentPage() {
  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">ทะเบียนอุปกรณ์โรงงาน</h2>
          <p className="text-xs text-slate-500">จัดการข้อมูลเครื่องจักรและสร้าง QR Code</p>
        </div>
      </div>
      <Card>
        <CardContent className="p-8 text-center text-slate-500">
          <Wrench className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-medium">CRUD อุปกรณ์ & พิมพ์ QR Code พร้อมทำในขั้นตอนที่ 3</p>
        </CardContent>
      </Card>
    </div>
  );
}

