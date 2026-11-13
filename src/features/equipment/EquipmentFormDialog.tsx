import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Equipment, Location, EquipmentStatus, EQUIPMENT_STATUS_LABELS } from '@/types';
import { createEquipment, updateEquipment, createLocation } from './api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { X, Upload, Plus, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';

const equipmentSchema = z.object({
  code: z.string().min(2, 'กรุณาระบุรหัสเครื่องอย่างน้อย 2 ตัวอักษร'),
  name: z.string().min(2, 'กรุณาระบุชื่อเครื่องจักร'),
  location_id: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  serial_no: z.string().optional(),
  purchase_date: z.string().optional(),
  warranty_until: z.string().optional(),
  status: z.enum(['active', 'inactive', 'retired']),
});

type FormData = z.infer<typeof equipmentSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Equipment | null;
  locations: Location[];
  onLocationsChange?: () => void;
}

export function EquipmentFormDialog({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  locations,
  onLocationsChange,
}: Props) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [manualFile, setManualFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // การสร้าง location ด่วน
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  const [isAddingLoc, setIsAddingLoc] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      code: '',
      name: '',
      location_id: '',
      brand: '',
      model: '',
      serial_no: '',
      purchase_date: '',
      warranty_until: '',
      status: 'active',
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        code: initialData.code,
        name: initialData.name,
        location_id: initialData.location_id || '',
        brand: initialData.brand || '',
        model: initialData.model || '',
        serial_no: initialData.serial_no || '',
        purchase_date: initialData.purchase_date || '',
        warranty_until: initialData.warranty_until || '',
        status: initialData.status,
      });
      setImagePreview(initialData.image_path || null);
    } else {
      reset({
        code: '',
        name: '',
        location_id: '',
        brand: '',
        model: '',
        serial_no: '',
        purchase_date: '',
        warranty_until: '',
        status: 'active',
      });
      setImagePreview(null);
    }
    setImageFile(null);
    setManualFile(null);
    setErrorMsg(null);
  }, [initialData, isOpen, reset]);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateLocation = async () => {
    if (!newLocationName.trim()) return;
    try {
      setIsAddingLoc(true);
      const created = await createLocation(newLocationName.trim());
      if (onLocationsChange) onLocationsChange();
      setValue('location_id', created.id);
      setNewLocationName('');
      setShowAddLocation(false);
    } catch (err: any) {
      alert('สร้างสถานที่ล้มเหลว: ' + err.message);
    } finally {
      setIsAddingLoc(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      if (initialData) {
        await updateEquipment(
          initialData.id,
          {
            code: data.code,
            name: data.name,
            location_id: data.location_id || null,
            brand: data.brand || null,
            model: data.model || null,
            serial_no: data.serial_no || null,
            purchase_date: data.purchase_date || null,
            warranty_until: data.warranty_until || null,
            status: data.status,
          },
          imageFile,
          manualFile
        );
      } else {
        await createEquipment(
          {
            code: data.code,
            name: data.name,
            location_id: data.location_id || null,
            brand: data.brand || null,
            model: data.model || null,
            serial_no: data.serial_no || null,
            purchase_date: data.purchase_date || null,
            warranty_until: data.warranty_until || null,
            status: data.status,
          },
          imageFile,
          manualFile
        );
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      if (err.message?.includes('duplicate key') || err.message?.includes('equipment_code_key')) {
        setErrorMsg('รหัสเครื่อง (Code) นี้มีอยู่ในระบบแล้ว กรุณาใช้รหัสอื่น');
      } else {
        setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border my-8 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b bg-slate-50/70">
          <h3 className="font-bold text-base text-slate-800">
            {initialData ? 'แก้ไขข้อมูลอุปกรณ์' : 'เพิ่มอุปกรณ์ใหม่'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
              {errorMsg}
            </div>
          )}

          <form id="equipment-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* รหัส & ชื่อ */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  รหัสเครื่อง (Code) *
                </label>
                <Input
                  type="text"
                  placeholder="เช่น CNC-01"
                  className="font-mono uppercase font-semibold"
                  error={errors.code?.message}
                  {...register('code')}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  สถานะการใช้งาน *
                </label>
                <select
                  className="flex h-12 w-full rounded-xl border-2 border-input bg-background px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  {...register('status')}
                >
                  <option value="active">{EQUIPMENT_STATUS_LABELS.active}</option>
                  <option value="inactive">{EQUIPMENT_STATUS_LABELS.inactive}</option>
                  <option value="retired">{EQUIPMENT_STATUS_LABELS.retired}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ชื่อเครื่องจักร / อุปกรณ์ *
              </label>
              <Input
                type="text"
                placeholder="เช่น เครื่องตัดเลเซอร์ความเร็วสูง Line 1"
                error={errors.name?.message}
                {...register('name')}
              />
            </div>

            {/* สถานที่ */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  สถานที่ติดตั้ง (Location)
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddLocation(!showAddLocation)}
                  className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  เพิ่มสถานที่ใหม่
                </button>
              </div>

              {showAddLocation ? (
                <div className="flex gap-2 p-2 bg-slate-50 border rounded-xl mb-2">
                  <Input
                    type="text"
                    placeholder="ชื่อพื้นที่ / ไลน์การผลิต เช่น โรงงาน 1 - Line A"
                    value={newLocationName}
                    onChange={(e) => setNewLocationName(e.target.value)}
                    className="h-9 text-xs"
                  />
                  <Button
                    type="button"
                    size="sm"
                    disabled={isAddingLoc}
                    onClick={handleCreateLocation}
                    className="h-9 text-xs shrink-0"
                  >
                    {isAddingLoc ? 'กำลังสร้าง...' : 'เพิ่ม'}
                  </Button>
                </div>
              ) : null}

              <select
                className="flex h-12 w-full rounded-xl border-2 border-input bg-background px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                {...register('location_id')}
              >
                <option value="">-- ไม่ระบุสถานที่ --</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} {loc.type ? `(${loc.type})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* ยี่ห้อ รุ่น Serial */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ยี่ห้อ (Brand)</label>
                <Input placeholder="เช่น Mitsubishi" {...register('brand')} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">รุ่น (Model)</label>
                <Input placeholder="เช่น FX5U" {...register('model')} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Serial No.</label>
                <Input placeholder="SN-XXXX" {...register('serial_no')} />
              </div>
            </div>

            {/* วันที่ซื้อ & วันหมดประกัน */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">วันที่ซื้อ</label>
                <Input type="date" {...register('purchase_date')} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">วันหมดประกัน</label>
                <Input type="date" {...register('warranty_until')} />
              </div>
            </div>

            {/* อัปโหลดรูปภาพ */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                รูปภาพตัวเครื่อง
              </label>
              <div className="flex items-center gap-3">
                {imagePreview ? (
                  <div className="w-16 h-16 rounded-xl border overflow-hidden shrink-0 bg-slate-100 relative">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                ) : null}
                <label className="flex-1 cursor-pointer border-2 border-dashed rounded-xl p-3 text-center hover:bg-slate-50 transition-colors">
                  <span className="text-xs text-primary font-semibold flex items-center justify-center gap-1">
                    <Upload className="w-3.5 h-3.5" />
                    เลือกรูปภาพ
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">PNG, JPG, WebP</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              </div>
            </div>

            {/* อัปโหลดคู่มือ PDF */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                ไฟล์คู่มือการใช้งาน (PDF)
              </label>
              <label className="block cursor-pointer border-2 border-dashed rounded-xl p-3 text-center hover:bg-slate-50 transition-colors">
                <span className="text-xs text-primary font-semibold flex items-center justify-center gap-1">
                  <Upload className="w-3.5 h-3.5" />
                  {manualFile ? manualFile.name : initialData?.manual_path ? 'อัปโหลดไฟล์ PDF ใหม่' : 'เลือกไฟล์ PDF คู่มือ'}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">ไฟล์ .pdf ขนาดไม่เกิน 20MB</span>
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setManualFile(f);
                  }}
                />
              </label>
            </div>
          </form>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t bg-slate-50/70 flex items-center justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            ยกเลิก
          </Button>
          <Button
            type="submit"
            form="equipment-form"
            disabled={isSubmitting}
            className="gap-2 font-semibold"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                กำลังบันทึก...
              </>
            ) : (
              'บันทึกข้อมูล'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

