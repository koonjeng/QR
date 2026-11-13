import React from 'react';
import { Loader2, AlertCircle, Inbox, RefreshCw } from 'lucide-react';
import { Button } from './button';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({ message = 'กำลังโหลดข้อมูล...', className = '' }: LoadingStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
      <p className="text-sm font-medium text-muted-foreground">{message}</p>
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'เกิดข้อผิดพลาด',
  message = 'ไม่สามารถโหลดข้อมูลได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง',
  onRetry,
  className = '',
}: ErrorStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-10 px-4 text-center ${className}`}>
      <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mb-3">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h4 className="font-semibold text-foreground text-base mb-1">{title}</h4>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          ลองใหม่อีกครั้ง
        </Button>
      )}
    </div>
  );
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title = 'ไม่พบข้อมูล',
  description = 'ยังไม่มีรายการข้อมูลในขณะนี้',
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed rounded-2xl ${className}`}>
      <div className="text-muted-foreground mb-3">
        {icon || <Inbox className="h-12 w-12 stroke-[1.5]" />}
      </div>
      <h4 className="font-semibold text-foreground text-base mb-1">{title}</h4>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}

