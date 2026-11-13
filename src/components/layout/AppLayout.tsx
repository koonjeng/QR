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
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isPrimary?: boolean;
}

export function AppLayout() {
  const { profile, role, isAdmin } = useAuth();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = useRealtimeNotifications();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getNavItems = (): NavItem[] => {
    switch (role) {
      case 'admin':
        return [
          { to: '/dashboard', label: 'แดชบอร์ด', icon: LayoutDashboard },
          { to: '/work-orders', label: 'ใบแจ้งซ่อม', icon: ClipboardList },
          { to: '/equipment', label: 'อุปกรณ์', icon: Wrench },
          { to: '/scan-qr', label: 'สแกน QR', icon: QrCode },
          { to: '/users', label: 'จัดการผู้ใช้', icon: Users },
          { to: '/profile', label: 'โปรไฟล์', icon: User },
        ];
      case 'supervisor':
        return [
          { to: '/dashboard', label: 'แดชบอร์ด', icon: LayoutDashboard },
          { to: '/work-orders', label: 'ใบแจ้งซ่อม', icon: ClipboardList },
          { to: '/equipment', label: 'อุปกรณ์', icon: Wrench },
          { to: '/scan-qr', label: 'สแกน QR', icon: QrCode },
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
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      {/* ===== Desktop Sidebar (hidden on mobile) ===== */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-slate-200 z-40">
        {/* Sidebar Header / Brand */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-100 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center font-bold shadow-sm">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight leading-none text-slate-900">
              Factory CMMS
            </h1>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">ระบบจัดการงานซ่อมบำรุง</p>
          </div>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                    isActive
                      ? 'bg-primary/10 text-primary font-semibold shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )
                }
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}

          {/* Audit Log Link (Admin only) */}
          {isAdmin && (
            <NavLink
              to="/audit"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  isActive
                    ? 'bg-primary/10 text-primary font-semibold shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )
              }
            >
              <History className="w-5 h-5 shrink-0" />
              <span>Audit Log</span>
            </NavLink>
          )}
        </nav>

        {/* Sidebar Footer: User Info */}
        <div className="p-4 border-t border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center">
              <User className="w-5 h-5 text-slate-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">
                {profile?.full_name || 'ผู้ใช้งาน'}
              </p>
              <span className="inline-block text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md leading-none mt-0.5">
                {role ? ROLE_LABELS[role].split(' ')[0] : '...'}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* ===== Main Content Area ===== */}
      <div className="flex-1 flex flex-col lg:ml-64">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b px-4 lg:px-6 py-2.5 flex items-center justify-between shadow-xs">
          {/* Mobile: Brand + Hamburger */}
          <div className="flex items-center gap-2">
            {/* Mobile hamburger (hidden on lg) */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors -ml-1"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-2 lg:hidden">
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

            {/* Desktop: Page context breadcrumb area */}
            <div className="hidden lg:block">
              <p className="text-sm text-slate-500">ยินดีต้อนรับ, <span className="font-semibold text-slate-800">{profile?.full_name || 'ผู้ใช้งาน'}</span></p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Audit Log shortcut (mobile only, admin) */}
            {isAdmin && (
              <NavLink
                to="/audit"
                className={({ isActive }) =>
                  `lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 transition-colors ${
                    isActive ? 'bg-slate-100 text-primary' : ''
                  }`
                }
                title="Audit Logs"
              >
                <History className="w-4 h-4" />
              </NavLink>
            )}

            {/* Notification bell */}
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

            {/* Role pill (mobile) */}
            <div className="text-right pl-1 border-l border-slate-200 lg:hidden">
              <p className="text-xs font-semibold text-slate-800 line-clamp-1 max-w-[100px]">
                {profile?.full_name || 'ผู้ใช้งาน'}
              </p>
              <span className="inline-block text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded leading-none mt-0.5">
                {role ? ROLE_LABELS[role].split(' ')[0] : '...'}
              </span>
            </div>

            {/* Role pill (desktop) */}
            <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-slate-200">
              <span className="inline-block text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                {role ? ROLE_LABELS[role] : '...'}
              </span>
            </div>
          </div>
        </header>

        {/* Mobile slide-down menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-b shadow-lg z-20 animate-in slide-in-from-top duration-200">
            <nav className="p-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all',
                        isActive
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-slate-600 hover:bg-slate-50'
                      )
                    }
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6 xl:p-8 pb-20 lg:pb-8">
          <div className="max-w-lg lg:max-w-6xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* ===== Mobile Bottom Navigation (hidden on desktop) ===== */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-2 py-1 shadow-lg safe-area-bottom">
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

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />

      {/* Notification Drawer */}
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
