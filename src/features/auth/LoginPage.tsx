import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from './context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Wrench, LogIn, AlertCircle } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('กรุณากรอกอีเมลให้ถูกต้อง'),
  password: z.string().min(6, 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    const { error } = await login(data.email, data.password);

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setErrorMessage('อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง');
      } else if (error.message.includes('Email not confirmed')) {
        setErrorMessage('กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ');
      } else {
        setErrorMessage(error.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
      }
      setIsSubmitting(false);
      return;
    }

    // Login สำเร็จ ทำการ redirect ตามที่กำหนด
    navigate(redirectUrl, { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center px-4 py-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-3">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-sm">
            <Wrench className="w-7 h-7" />
          </div>
        </div>
        <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900">
          Factory CMMS Mobile
        </h2>
        <p className="text-center text-sm text-slate-500 mt-1">
          ระบบแจ้งซ่อมและจัดการอุปกรณ์โรงงาน
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="border-slate-200/80 shadow-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">เข้าสู่ระบบ</CardTitle>
            <CardDescription>
              {redirectUrl !== '/' ? (
                <span className="text-amber-600 font-medium">
                  กรุณาเข้าสู่ระบบก่อนดำเนินการต่อ
                </span>
              ) : (
                'กรอกอีเมลและรหัสผ่านเพื่อเข้าใช้งาน'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {errorMessage && (
              <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  อีเมล (Email)
                </label>
                <Input
                  type="email"
                  placeholder="name@factory.com"
                  autoComplete="email"
                  inputMode="email"
                  error={errors.email?.message}
                  {...register('email')}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  รหัสผ่าน (Password)
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  error={errors.password?.message}
                  {...register('password')}
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 font-semibold text-base gap-2"
                size="lg"
              >
                <LogIn className="w-5 h-5" />
                {isSubmitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-500">
              ยังไม่มีบัญชีใช้งาน?{' '}
              <Link
                to={`/register${redirectUrl !== '/' ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`}
                className="font-semibold text-primary hover:underline"
              >
                ลงทะเบียนผู้ใช้ใหม่
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

