import { supabase } from '@/lib/supabase';
import { Equipment, Location, EquipmentStatus } from '@/types';

export interface EquipmentWithLocation extends Equipment {
  location?: Location | null;
}

export interface EquipmentInput {
  code: string;
  name: string;
  location_id?: string | null;
  brand?: string | null;
  model?: string | null;
  serial_no?: string | null;
  purchase_date?: string | null;
  warranty_until?: string | null;
  status: EquipmentStatus;
}

// 1. ดึงรายการอุปกรณ์ทั้งหมด
export async function getEquipments(options?: {
  search?: string;
  status?: string;
  location_id?: string;
}): Promise<EquipmentWithLocation[]> {
  let query = supabase
    .from('equipment')
    .select(`
      *,
      location:locations(*)
    `)
    .order('created_at', { ascending: false });

  if (options?.status && options.status !== 'all') {
    query = query.eq('status', options.status as EquipmentStatus);
  }

  if (options?.location_id && options.location_id !== 'all') {
    query = query.eq('location_id', options.location_id);
  }

  if (options?.search) {
    const s = `%${options.search}%`;
    query = query.or(`code.ilike.${s},name.ilike.${s},brand.ilike.${s},model.ilike.${s}`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as any) || [];
}

// 2. ดึงข้อมูลอุปกรณ์ตาม ID
export async function getEquipmentById(id: string): Promise<EquipmentWithLocation | null> {
  const { data, error } = await supabase
    .from('equipment')
    .select(`
      *,
      location:locations(*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // not found
    throw error;
  }
  return data as any;
}

// 3. ดึงข้อมูลอุปกรณ์ตาม Code
export async function getEquipmentByCode(code: string): Promise<EquipmentWithLocation | null> {
  const { data, error } = await supabase
    .from('equipment')
    .select(`
      *,
      location:locations(*)
    `)
    .eq('code', code)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as any;
}

// 4. อัปโหลดไฟล์ไป Storage (รูป หรือ PDF)
export async function uploadEquipmentFile(
  file: File,
  prefix: 'images' | 'manuals'
): Promise<string> {
  const ext = file.name.split('.').pop();
  const fileName = `${prefix}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;

  const { error } = await supabase.storage
    .from('equipment-files')
    .upload(fileName, file, { cacheControl: '3600', upsert: false });

  if (error) throw error;

  const { data } = supabase.storage.from('equipment-files').getPublicUrl(fileName);
  return data.publicUrl;
}

// 5. สร้างอุปกรณ์ใหม่
export async function createEquipment(
  input: EquipmentInput,
  imageFile?: File | null,
  manualFile?: File | null
): Promise<Equipment> {
  let image_path: string | null = null;
  let manual_path: string | null = null;

  if (imageFile) {
    image_path = await uploadEquipmentFile(imageFile, 'images');
  }

  if (manualFile) {
    manual_path = await uploadEquipmentFile(manualFile, 'manuals');
  }

  const { data, error } = await supabase
    .from('equipment')
    .insert({
      code: input.code.trim().toUpperCase(),
      name: input.name.trim(),
      location_id: input.location_id || null,
      brand: input.brand?.trim() || null,
      model: input.model?.trim() || null,
      serial_no: input.serial_no?.trim() || null,
      purchase_date: input.purchase_date || null,
      warranty_until: input.warranty_until || null,
      status: input.status || 'active',
      image_path,
      manual_path,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Equipment;
}

// 6. อัปเดตข้อมูลอุปกรณ์
export async function updateEquipment(
  id: string,
  input: Partial<EquipmentInput>,
  imageFile?: File | null,
  manualFile?: File | null
): Promise<Equipment> {
  const updates: any = { ...input };
  if (input.code) updates.code = input.code.trim().toUpperCase();
  if (input.name) updates.name = input.name.trim();

  if (imageFile) {
    updates.image_path = await uploadEquipmentFile(imageFile, 'images');
  }

  if (manualFile) {
    updates.manual_path = await uploadEquipmentFile(manualFile, 'manuals');
  }

  const { data, error } = await supabase
    .from('equipment')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Equipment;
}

// 7. ลบอุปกรณ์
export async function deleteEquipment(id: string): Promise<void> {
  const { error } = await supabase.from('equipment').delete().eq('id', id);
  if (error) throw error;
}

// 8. ดึงข้อมูล Locations
export async function getLocations(): Promise<Location[]> {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
}

// 9. เพิ่ม Location ใหม่
export async function createLocation(name: string, parent_id?: string | null, type = 'area'): Promise<Location> {
  const { data, error } = await supabase
    .from('locations')
    .insert({
      name: name.trim(),
      parent_id: parent_id || null,
      type,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Location;
}

