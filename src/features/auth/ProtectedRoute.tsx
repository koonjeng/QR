import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context';
import { LoadingState } from '@/components/ui/states';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingState message="กำลังตรวจสอบสิทธิ์การเข้าใช้งาน..." />
      </div>
    );
  }

  if (!session) {
    const redirectUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirectUrl}`} replace />;
  }

  return <>{children}</>;
}

