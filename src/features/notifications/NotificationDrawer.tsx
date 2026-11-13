import { useNavigate } from 'react-router-dom';
import { Notification } from '@/types';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, CheckCheck, X, Clock, ExternalLink } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

export function NotificationDrawer({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
}: Props) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleClickItem = (n: Notification) => {
    if (!n.is_read) {
      onMarkAsRead(n.id);
    }
    if (n.ref) {
      onClose();
      navigate(n.ref);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-sm bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">การแจ้งเตือน</h3>
              <p className="text-[10px] text-slate-500">
                ยังไม่ได้อ่าน {unreadCount} รายการ (Realtime)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="text-[11px] font-semibold text-primary hover:underline px-2 py-1"
                title="อ่านแล้วทั้งหมด"
              >
                อ่านทั้งหมด
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {notifications.length === 0 ? (
            <div className="text-center py-20 text-slate-400 text-xs">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
              ไม่มีการแจ้งเตือนในขณะนี้
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleClickItem(n)}
                className={`p-3 rounded-xl border cursor-pointer transition-all active:scale-[0.99] text-left relative ${
                  n.is_read
                    ? 'bg-white border-slate-100 text-slate-600'
                    : 'bg-blue-50/70 border-blue-200 text-slate-900 shadow-xs'
                }`}
              >
                {!n.is_read && (
                  <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-primary" />
                )}
                <h4 className="text-xs font-bold leading-tight">{n.title}</h4>
                <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                  {n.body}
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 pt-1 border-t border-slate-100">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(n.created_at)}
                  </span>
                  {n.ref && (
                    <span className="text-primary font-semibold flex items-center gap-0.5">
                      เปิดดู <ExternalLink className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

