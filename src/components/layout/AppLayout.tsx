import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '@/features/auth/context';
import { useRealtimeNotifications, NotificationDrawer } from '@/features/notifications';
import { PWAInstallPrompt } from '@/components/common/PWAInstallPrompt';
import { ROLE_LABELS } from '@/types';
import {
  QrCode,
  ClipboardList,
  Wrench,
  LayoutDashboard,
  Users,
  User,
  Bell,
  History,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function AppLayout() {
  const { profile, role, isAdmin } = useAuth();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = useRealtimeNotifications();

  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // กำหนดปุ่มเมนูด้านล่างตามบทบาท (Bottom Navigation)
  const getNavItems = () => {
    switch (role) {
      case 'admin':
        return [
          { to: '/dashboard', label: 'แดชบอร์ด', icon: LayoutDashboard },
          { to: '/work-orders', label: 'ใบแจ้งซ่อม', icon: ClipboardList },
          { to: '/equipment', label: 'อุปกรณ์', icon: Wrench },
          { to: '/users', label: 'ผู้ใช้', icon: Users },
          { to: '/profile', label: 'โปรไฟล์', icon: User },
        ];
      case 'supervisor':
        return [
          { to: '/dashboard', label: 'แดชบอร์ด', icon: LayoutDashboard },
          { to: '/work-orders', label: 'ใบแจ้งซ่อม', icon: ClipboardList },
          { to: '/equipment', label: 'อุปกรณ์', icon: Wrench },
          { to: '/profile', label: 'โปรไฟล์', icon: User },
        ];
      case 'technician':
        return [
          { to: '/work-orders', label: 'งานทั้งหมด', icon: ClipboardList },
          { to: '/scan-qr', label: 'สแกน QR', icon: QrCode, isPrimary: true },
          { to: '/equipment', label: 'อุปกรณ์', icon: Wrench },
          { to: '/profile', label: 'โปรไฟล์', icon: User },
        ];
      case 'operator':
      default:
        return [
          { to: '/work-orders', label: 'งานที่แจ้ง', icon: ClipboardList },
          { to: '/scan-qr', label: 'สแกน QR', icon: QrCode, isPrimary: true },
          { to: '/profile', label: 'โปรไฟล์', icon: User },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 pb-16">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b px-4 py-2.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-sm shadow-xs">
            <Wrench className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight leading-none text-slate-900">
              Factory CMMS
            </h1>
            <p className="text-[10px] text-slate-500 font-medium">Lightweight Mobile</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* ปุ่ม Audit Log (สำหรับ Admin) */}
          {isAdmin && (
            <NavLink
              to="/audit"
              className={({ isActive }) =>
                `p-2 rounded-xl text-slate-500 hover:text-slate-900 transition-colors ${
                  isActive ? 'bg-slate-100 text-primary' : ''
                }`
              }
              title="Audit Logs"
            >
              <History className="w-4 h-4" />
            </NavLink>
          )}

          {/* ปุ่มกระดิ่งแจ้งเตือนพร้อม Realtime Badge */}
          <button
            type="button"
            onClick={() => setIsNotifOpen(true)}
            className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            title="การแจ้งเตือน"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] bg-rose-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center px-1 border-2 border-white animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Role Pill */}
          <div className="text-right pl-1 border-l border-slate-200">
            <p className="text-xs font-semibold text-slate-800 line-clamp-1 max-w-[100px]">
              {profile?.full_name || 'ผู้ใช้งาน'}
            </p>
            <span className="inline-block text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded leading-none mt-0.5">
              {role ? ROLE_LABELS[role].split(' ')[0] : '...'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 max-w-lg mx-auto w-full">
        <Outlet />
      </main>

      {/* Mobile-First Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-2 py-1 shadow-lg safe-area-bottom">
        <div className="max-w-md mx-auto flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            if (item.isPrimary) {
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex flex-col items-center justify-center -mt-5 transition-transform active:scale-95',
                      isActive ? 'text-primary' : 'text-slate-600'
                    )
                  }
                >
                  <div className="w-13 h-13 rounded-full bg-primary text-white flex items-center justify-center shadow-md ring-4 ring-white">
                    <Icon className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <span className="text-[10px] font-bold mt-1 text-primary">{item.label}</span>
                </NavLink>
              );
            }

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-colors min-w-[56px]',
                    isActive
                      ? 'text-primary font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  )
                }
              >
                <Icon className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] leading-tight">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* PWA Install Prompt Banner */}
      <PWAInstallPrompt />

      {/* Realtime Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
      />
    </div>
  );
}
