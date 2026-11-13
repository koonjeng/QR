import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from './context';
import { UserRole, ROLE_LABELS } from '@/types';
import { LoadingState } from '@/components/ui/states';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export function RoleProtectedRoute({ children, allowedRoles }: RoleProtectedRouteProps) {
  const { role, isLoading, session } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingState message="กำลังตรวจสอบระดับสิทธิ์การเข้าใช้งาน..." />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!role || !allowedRoles.includes(role)) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">ไม่มีสิทธิ์เข้าถึงหน้านี้</h2>
        <p className="text-sm text-slate-500 max-w-sm mb-2">
          หน้านี้สงวนสิทธิ์สำหรับบทบาท:{' '}
          <span className="font-semibold text-slate-700">
            {allowedRoles.map((r) => ROLE_LABELS[r]).join(', ')}
          </span>
        </p>
        <p className="text-xs text-slate-400 mb-6">
          บทบาทปัจจุบันของคุณ: {role ? ROLE_LABELS[role] : 'ยังไม่มีบทบาท'}
        </p>
        <Link to="/">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            กลับหน้าหลัก
          </Button>
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}

