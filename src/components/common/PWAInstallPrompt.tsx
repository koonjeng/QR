import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // ตรวจสอบว่าเคยปิดไปแล้วหรือยัง
      const isDismissed = sessionStorage.getItem('pwa_prompt_dismissed');
      if (!isDismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-18 left-3 right-3 z-50 max-w-md mx-auto bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl flex items-center justify-between gap-3 border border-slate-700 animate-in slide-in-from-bottom-4">
      <div className="flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shrink-0">
          <Download className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-xs">ติดตั้งลงหน้าจอมือถือ</h4>
          <p className="text-[10px] text-slate-300">เข้าใช้งานสะดวก สแกน QR หน้างานได้รวดเร็ว</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <Button
          size="sm"
          onClick={handleInstallClick}
          className="h-8 text-xs px-3 font-bold bg-primary hover:bg-primary/90 text-white"
        >
          ติดตั้ง
        </Button>
        <button
          onClick={handleDismiss}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

