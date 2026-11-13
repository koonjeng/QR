import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from './context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserPlus, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';

const registerSchema = z
  .object({
    fullName: z.string().min(2, 'กรุณากรอกชื่อ-นามสกุลอย่างน้อย 2 ตัวอักษร'),
    email: z.string().email('กรุณากรอกอีเมลให้ถูกต้อง'),
    department: z.string().optional(),
    phone: z.string().optional(),
    password: z.string().min(6, 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร'),
    confirmPassword: z.string().min(6, 'กรุณายืนยันรหัสผ่าน'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'รหัสผ่านยืนยันไม่ตรงกัน',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const { register: registerAuth } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const { error } = await registerAuth(
      data.email,
      data.password,
      data.fullName,
      data.department,
      data.phone
    );

    if (error) {
      if (error.message.includes('User already registered')) {
        setErrorMessage('อีเมลนี้ถูกลงทะเบียนไว้ในระบบแล้ว');
      } else {
        setErrorMessage(error.message || 'เกิดข้อผิดพลาดในการลงทะเบียน');
      }
      setIsSubmitting(false);
      return;
    }

    setSuccessMessage('ลงทะเบียนสำเร็จ! กำลังเข้าสู่ระบบ...');
    setTimeout(() => {
      navigate(redirectUrl, { replace: true });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center px-4 py-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900">
          ลงทะเบียนผู้ใช้งาน
        </h2>
        <p className="text-center text-sm text-slate-500 mt-1">
          ระบบจัดการงานซ่อมบำรุงโรงงาน
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="border-slate-200/80 shadow-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">สร้างบัญชีผู้ใช้</CardTitle>
            <CardDescription className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
              <ShieldCheck className="w-4 h-4 shrink-0 text-amber-600" />
              <span>ผู้ลงทะเบียนคนแรกของระบบจะได้รับสิทธิ์ Admin โดยอัตโนมัติ</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {errorMessage && (
              <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  ชื่อ - นามสกุล *
                </label>
                <Input
                  type="text"
                  placeholder="สมชาย ใจดี"
                  error={errors.fullName?.message}
                  {...register('fullName')}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  อีเมล (Email) *
                </label>
                <Input
                  type="email"
                  placeholder="somchai@factory.com"
                  autoComplete="email"
                  inputMode="email"
                  error={errors.email?.message}
                  {...register('email')}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    แผนก/ฝ่าย
                  </label>
                  <Input
                    type="text"
                    placeholder="ฝ่ายผลิต A"
                    {...register('department')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    เบอร์โทรศัพท์
                  </label>
                  <Input
                    type="tel"
                    placeholder="081-xxxxxxx"
                    inputMode="tel"
                    {...register('phone')}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  รหัสผ่าน *
                </label>
                <Input
                  type="password"
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  autoComplete="new-password"
                  error={errors.password?.message}
                  {...register('password')}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  ยืนยันรหัสผ่าน *
                </label>
                <Input
                  type="password"
                  placeholder="กรอกรหัสผ่านอีกครั้ง"
                  autoComplete="new-password"
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword')}
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-4 font-semibold text-base gap-2"
                size="lg"
              >
                <UserPlus className="w-5 h-5" />
                {isSubmitting ? 'กำลังลงทะเบียน...' : 'ลงทะเบียน'}
              </Button>
            </form>

            <div className="mt-5 text-center text-sm text-slate-500">
              มีบัญชีอยู่แล้ว?{' '}
              <Link
                to={`/login${redirectUrl !== '/' ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`}
                className="font-semibold text-primary hover:underline"
              >
                เข้าสู่ระบบ
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

