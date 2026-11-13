import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ROLE_LABELS } from '@/types';
import { QrCode, ClipboardList, Wrench, LayoutDashboard, Shield } from 'lucide-react';

export function HomePage() {
  const { profile, role } = useAuth();

  return (
    <div className="space-y-4 pb-20">
      <div className="bg-gradient-to-br from-primary/10 via-blue-50 to-indigo-50/50 p-5 rounded-2xl border border-primary/20">
        <h2 className="text-xl font-bold text-slate-900">
          ยินดีต้อนรับ, {profile?.full_name || 'ผู้ใช้งาน'}
        </h2>
        <p className="text-xs text-slate-600 mt-1">
          บทบาท: <span className="font-semibold text-primary">{role ? ROLE_LABELS[role] : ''}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link to="/scan-qr" className="col-span-2">
          <Card className="bg-primary text-primary-foreground border-none shadow-md hover:bg-primary/95 transition-transform active:scale-[0.99]">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">สแกน QR Code หน้าเครื่อง</h3>
                <p className="text-xs text-primary-foreground/80 mt-0.5">
                  แจ้งซ่อมด่วน 3 แตะ หรือ ตรวจสอบประวัติเครื่อง
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <QrCode className="w-7 h-7" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/work-orders">
          <Card className="hover:border-primary/50 transition-colors h-full">
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-800">
                  {role === 'operator' ? 'งานที่ฉันแจ้ง' : 'รายการใบแจ้งซ่อม'}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">ติดตามสถานะงานซ่อม</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        {(role === 'supervisor' || role === 'admin') ? (
          <Link to="/dashboard">
            <Card className="hover:border-primary/50 transition-colors h-full">
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-2">
                  <LayoutDashboard className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800">แดชบอร์ดสรุปงาน</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">สถิติและ Top 10 เครื่องเสีย</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ) : (
          <Link to="/equipment">
            <Card className="hover:border-primary/50 transition-colors h-full">
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center mb-2">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800">ทะเบียนอุปกรณ์</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">ค้นหาข้อมูลเครื่องจักร</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}
      </div>
    </div>
  );
}

