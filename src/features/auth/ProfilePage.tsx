import { useNavigate } from 'react-router-dom';
import { useAuth } from './context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ROLE_LABELS } from '@/types';
import {
  User,
  Mail,
  Building,
  Phone,
  Shield,
  LogOut,
  CheckCircle,
} from 'lucide-react';

export function ProfilePage() {
  const { profile, user, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const getRolePermissions = () => {
    switch (role) {
      case 'admin':
        return [
          'จัดการผู้ใช้งานและกำหนด Role ทั้งหมด',
          'จัดการทะเบียนอุปกรณ์และสถานที่',
          'ตรวจสอบ Audit Logs ประวัติการเปลี่ยนแปลง',
          'ดูและจัดการใบแจ้งซ่อมทั้งหมด',
          'ดูแดชบอร์ดสถิติงานซ่อมบำรุง',
        ];
      case 'supervisor':
        return [
          'มอบหมายงานซ่อมให้ช่าง',
          'ปิดงานและอนุมัติการตรวจสอบ',
          'จัดการทะเบียนอุปกรณ์และสถานที่',
          'ดูแดชบอร์ดสถิติงานซ่อมบำรุง',
          'ดูและแก้ไขใบงานทั้งหมด',
        ];
      case 'technician':
        return [
          'ดูใบงานทั้งหมดในโรงงาน',
          'กดรับงานและอัปเดตสถานะงาน',
          'บันทึกสาเหตุ, วิธีแก้ไข, แนบรูปถ่ายการซ่อม',
          'สแกน QR Code หน้าเครื่องเพื่อตรวจสอบประวัติ',
        ];
      case 'operator':
      default:
        return [
          'สแกน QR Code หน้าเครื่องแจ้งซ่อมด่วนใน 3 แตะ',
          'ดูสถานะใบงานซ่อมที่ตนเองเป็นผู้แจ้ง',
          'ตรวจสอบข้อมูลสเปกอุปกรณ์เบื้องต้น',
        ];
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-4 pb-20">
      <Card>
        <CardHeader className="text-center pb-2">
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
            <User className="w-10 h-10" />
          </div>
          <CardTitle className="text-xl font-bold">{profile?.full_name || 'ผู้ใช้งาน'}</CardTitle>
          <div className="pt-1">
            <Badge variant="secondary" className="px-3 py-1 text-xs font-semibold">
              <Shield className="w-3.5 h-3.5 mr-1 text-primary" />
              {role ? ROLE_LABELS[role] : 'ไม่มีบทบาท'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          <div className="divide-y rounded-xl border bg-slate-50/50 p-3 text-sm space-y-2">
            <div className="flex items-center justify-between py-1.5">
              <span className="flex items-center text-slate-500 gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                อีเมล
              </span>
              <span className="font-medium text-slate-800">{user?.email || '-'}</span>
            </div>

            <div className="flex items-center justify-between py-1.5">
              <span className="flex items-center text-slate-500 gap-2">
                <Building className="w-4 h-4 text-slate-400" />
                แผนก
              </span>
              <span className="font-medium text-slate-800">{profile?.department || 'ไม่ระบุ'}</span>
            </div>

            <div className="flex items-center justify-between py-1.5">
              <span className="flex items-center text-slate-500 gap-2">
                <Phone className="w-4 h-4 text-slate-400" />
                เบอร์โทร
              </span>
              <span className="font-medium text-slate-800">{profile?.phone || 'ไม่ระบุ'}</span>
            </div>
          </div>

          <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3.5">
            <h4 className="text-xs font-bold text-blue-900 mb-2 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              สิทธิ์การใช้งานของคุณ:
            </h4>
            <ul className="text-xs text-blue-800 space-y-1.5">
              {getRolePermissions().map((perm, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span>{perm}</span>
                </li>
              ))}
            </ul>
          </div>

          <Button
            variant="destructive"
            onClick={handleLogout}
            className="w-full font-semibold gap-2"
            size="lg"
          >
            <LogOut className="w-5 h-5" />
            ออกจากระบบ
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

