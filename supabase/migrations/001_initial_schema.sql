-- ==============================================================================
-- LIGHTWEIGHT CMMS (ระบบแจ้งซ่อมและจัดการอุปกรณ์โรงงาน)
-- MIGRATION 001: Initial Schema, Enum, Trigger, RLS & Audit Logs
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
CREATE TYPE user_role AS ENUM (
  'operator',
  'technician',
  'supervisor',
  'admin'
);

CREATE TYPE equipment_status AS ENUM (
  'active',
  'inactive',
  'retired'
);

CREATE TYPE problem_type AS ENUM (
  'mechanical',   -- เครื่องกล
  'electrical',   -- ไฟฟ้า
  'pneumatic',    -- นิวเมติก
  'hydraulic',    -- ไฮดรอลิก
  'other'         -- อื่นๆ
);

CREATE TYPE priority_level AS ENUM (
  'low',          -- ต่ำ
  'medium',       -- ปานกลาง
  'high',         -- สูง
  'critical'      -- วิกฤต / ด่วนที่สุด
);

CREATE TYPE wo_status AS ENUM (
  'reported',      -- แจ้งซ่อมแล้ว
  'accepted',      -- รับงานแล้ว
  'in_progress',   -- กำลังดำเนินการ
  'waiting_parts', -- รออะไหล่
  'inspection',    -- รอตรวจสอบ/ทดสอบ
  'closed',        -- ปิดงานแล้ว
  'cancelled'      -- ยกเลิก
);

CREATE TYPE audit_action AS ENUM (
  'insert',
  'update',
  'delete'
);

-- 3. TABLES

-- 3.1 Profiles (เชื่อมกับ auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'operator',
  department TEXT,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.2 Locations (พื้นที่/ไลน์การผลิต ลำดับชั้นแบบ parent-child)
CREATE TABLE public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'area', -- 'area', 'line', 'station'
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.3 Equipment (ทะเบียนอุปกรณ์)
CREATE TABLE public.equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  brand TEXT,
  model TEXT,
  serial_no TEXT,
  purchase_date DATE,
  warranty_until DATE,
  status equipment_status NOT NULL DEFAULT 'active',
  image_path TEXT,
  manual_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.4 Work Orders (ใบแจ้งซ่อม)
CREATE TABLE public.work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wo_no TEXT NOT NULL UNIQUE,
  equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE RESTRICT,
  reported_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  problem_type problem_type NOT NULL DEFAULT 'other',
  priority priority_level NOT NULL DEFAULT 'medium',
  status wo_status NOT NULL DEFAULT 'reported',
  description TEXT NOT NULL,
  cause TEXT,
  solution TEXT,
  reported_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  accepted_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Sequence สำหรับ Running Number ของใบแจ้งซ่อม
CREATE SEQUENCE IF NOT EXISTS work_order_seq START 1;

-- 3.5 Work Order Logs (ประวัติการเปลี่ยนสถานะและการกระทำ)
CREATE TABLE public.work_order_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  action TEXT NOT NULL,
  from_status wo_status,
  to_status wo_status,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.6 Attachments (ไฟล์แนบรูปภาพใบงานและคู่มือ)
CREATE TABLE public.attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID REFERENCES public.work_orders(id) ON DELETE CASCADE,
  equipment_id UUID REFERENCES public.equipment(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.7 Notifications (การแจ้งเตือนในระบบ)
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  ref TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.8 Audit Logs (บันทึกประวัติการเปลี่ยนแปลงระดับ Database)
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action audit_action NOT NULL,
  old_data JSONB,
  new_data JSONB,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. INDEXES
CREATE INDEX idx_locations_parent ON public.locations(parent_id);
CREATE INDEX idx_equipment_code ON public.equipment(code);
CREATE INDEX idx_equipment_status ON public.equipment(status);
CREATE INDEX idx_equipment_location ON public.equipment(location_id);
CREATE INDEX idx_equipment_created_at ON public.equipment(created_at DESC);

CREATE INDEX idx_wo_equipment ON public.work_orders(equipment_id);
CREATE INDEX idx_wo_status ON public.work_orders(status);
CREATE INDEX idx_wo_assigned_to ON public.work_orders(assigned_to);
CREATE INDEX idx_wo_reported_by ON public.work_orders(reported_by);
CREATE INDEX idx_wo_priority ON public.work_orders(priority);
CREATE INDEX idx_wo_created_at ON public.work_orders(created_at DESC);

CREATE INDEX idx_wo_logs_wo ON public.work_order_logs(work_order_id);
CREATE INDEX idx_wo_logs_created ON public.work_order_logs(created_at DESC);

CREATE INDEX idx_attachments_wo ON public.attachments(work_order_id);
CREATE INDEX idx_attachments_eq ON public.attachments(equipment_id);

CREATE INDEX idx_notifications_user_read ON public.notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_audit_table_record ON public.audit_logs(table_name, record_id);
CREATE INDEX idx_audit_created ON public.audit_logs(created_at DESC);

-- 5. FUNCTIONS & TRIGGERS

-- 5.1 Helper: get_my_role() (Security Definer ปลอดภัยจาก RLS recursion)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- 5.2 Helper: updated_at timestamp refresher
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_equipment_updated_at
  BEFORE UPDATE ON public.equipment
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_work_orders_updated_at
  BEFORE UPDATE ON public.work_orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5.3 Trigger สร้าง Profile อัตโนมัติเมื่อมี User สมัครผ่าน auth.users
-- ถ้าเป็น user คนแรกของระบบจะให้ role = 'admin' อัตโนมัติ นอกนั้น default เป็น 'operator'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count INTEGER;
  assigned_role user_role;
  raw_name TEXT;
BEGIN
  SELECT count(*) INTO user_count FROM public.profiles;
  IF user_count = 0 THEN
    assigned_role := 'admin';
  ELSE
    assigned_role := COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'operator');
  END IF;

  raw_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO public.profiles (id, full_name, role, department, phone, is_active)
  VALUES (
    NEW.id,
    raw_name,
    assigned_role,
    NEW.raw_user_meta_data->>'department',
    NEW.raw_user_meta_data->>'phone',
    true
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5.4 Running Number อัตโนมัติสำหรับใบแจ้งซ่อม (WO-YYMM-XXXX)
CREATE OR REPLACE FUNCTION public.set_work_order_no()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  current_prefix TEXT;
  next_val INTEGER;
BEGIN
  IF NEW.wo_no IS NULL OR NEW.wo_no = '' THEN
    current_prefix := 'WO-' || to_char(now(), 'YYMM') || '-';
    next_val := nextval('work_order_seq');
    NEW.wo_no := current_prefix || lpad(next_val::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_wo_no
  BEFORE INSERT ON public.work_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_work_order_no();

-- 5.5 Audit Log Trigger Function
CREATE OR REPLACE FUNCTION public.handle_audit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  rec_id UUID;
  old_json JSONB := NULL;
  new_json JSONB := NULL;
BEGIN
  current_user_id := auth.uid();

  IF TG_OP = 'INSERT' THEN
    rec_id := NEW.id;
    new_json := to_jsonb(NEW);
    INSERT INTO public.audit_logs (table_name, record_id, action, old_data, new_data, user_id)
    VALUES (TG_TABLE_NAME, rec_id, 'insert', NULL, new_json, current_user_id);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    rec_id := NEW.id;
    old_json := to_jsonb(OLD);
    new_json := to_jsonb(NEW);
    INSERT INTO public.audit_logs (table_name, record_id, action, old_data, new_data, user_id)
    VALUES (TG_TABLE_NAME, rec_id, 'update', old_json, new_json, current_user_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    rec_id := OLD.id;
    old_json := to_jsonb(OLD);
    INSERT INTO public.audit_logs (table_name, record_id, action, old_data, new_data, user_id)
    VALUES (TG_TABLE_NAME, rec_id, 'delete', old_json, NULL, current_user_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- ผูก Audit Log Trigger ให้กับ profiles, equipment, work_orders
CREATE TRIGGER audit_profiles_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_audit_log();

CREATE TRIGGER audit_equipment_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.equipment
  FOR EACH ROW EXECUTE FUNCTION public.handle_audit_log();

CREATE TRIGGER audit_work_orders_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.work_orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_audit_log();

-- ==============================================================================
-- 6. ROW LEVEL SECURITY (RLS) - เปิดทุกตาราง
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 6.1 Policies: PROFILES
-- ------------------------------------------------------------------------------
-- ทุกคนที่ authenticate อ่าน profiles ได้ (เพื่อแสดงชื่อผู้แจ้ง, ช่างผู้รับผิดชอบ ฯลฯ)
CREATE POLICY "Allow authenticated users to read all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- ผู้ใช้สามารถแก้ไข profile ตัวเองได้ (แต่แก้ role ของตัวเองไม่ได้ ยกเว้น admin)
CREATE POLICY "Allow users to update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() AND (
      role = (SELECT role FROM public.profiles WHERE id = auth.uid()) 
      OR public.get_my_role() = 'admin'
    )
  );

-- Admin จัดการ profiles ได้ทั้งหมด (สร้าง/แก้ไข role/ลบ)
CREATE POLICY "Allow admin full access to profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.get_my_role() = 'admin');

-- ------------------------------------------------------------------------------
-- 6.2 Policies: LOCATIONS
-- ------------------------------------------------------------------------------
-- ทุกคนที่ authenticate อ่าน location ได้
CREATE POLICY "Allow authenticated users to read locations"
  ON public.locations FOR SELECT
  TO authenticated
  USING (true);

-- supervisor และ admin จัดการ locations ได้
CREATE POLICY "Allow supervisor and admin to manage locations"
  ON public.locations FOR ALL
  TO authenticated
  USING (public.get_my_role() IN ('supervisor', 'admin'))
  WITH CHECK (public.get_my_role() IN ('supervisor', 'admin'));

-- ------------------------------------------------------------------------------
-- 6.3 Policies: EQUIPMENT
-- ------------------------------------------------------------------------------
-- operator, technician, supervisor, admin อ่านข้อมูลเครื่องได้ทั้งหมด
CREATE POLICY "Allow authenticated users to read equipment"
  ON public.equipment FOR SELECT
  TO authenticated
  USING (true);

-- supervisor และ admin เพิ่ม/แก้/ลบ อุปกรณ์ได้
CREATE POLICY "Allow supervisor and admin to manage equipment"
  ON public.equipment FOR ALL
  TO authenticated
  USING (public.get_my_role() IN ('supervisor', 'admin'))
  WITH CHECK (public.get_my_role() IN ('supervisor', 'admin'));

-- ------------------------------------------------------------------------------
-- 6.4 Policies: WORK_ORDERS
-- ------------------------------------------------------------------------------
-- SELECT:
-- - operator: อ่านเฉพาะที่ตัวเองแจ้ง
-- - technician, supervisor, admin: อ่านได้ทั้งหมด
CREATE POLICY "Work orders select policy"
  ON public.work_orders FOR SELECT
  TO authenticated
  USING (
    public.get_my_role() IN ('technician', 'supervisor', 'admin')
    OR reported_by = auth.uid()
  );

-- INSERT:
-- - operator: แจ้งซ่อมได้ในนามตัวเอง (reported_by = auth.uid())
-- - technician, supervisor, admin: สร้างใบงานได้
CREATE POLICY "Work orders insert policy"
  ON public.work_orders FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_my_role() IN ('technician', 'supervisor', 'admin')
    OR reported_by = auth.uid()
  );

-- UPDATE:
-- - technician: อัปเดตงานที่ตัวเองได้รับมอบหมาย หรือรับงานที่ยังว่างอยู่
-- - supervisor: มอบหมายงาน, ปิดงาน, อัปเดตได้ทุกใบงาน
-- - admin: อัปเดตได้ทั้งหมด
CREATE POLICY "Work orders update policy"
  ON public.work_orders FOR UPDATE
  TO authenticated
  USING (
    public.get_my_role() = 'admin'
    OR public.get_my_role() = 'supervisor'
    OR (
      public.get_my_role() = 'technician' AND (
        assigned_to = auth.uid() OR assigned_to IS NULL
      )
    )
  )
  WITH CHECK (
    public.get_my_role() = 'admin'
    OR public.get_my_role() = 'supervisor'
    OR (
      public.get_my_role() = 'technician' AND (
        assigned_to = auth.uid() OR assigned_to IS NULL
      )
    )
  );

-- DELETE:
-- เฉพาะ admin เท่านั้น
CREATE POLICY "Work orders delete policy"
  ON public.work_orders FOR DELETE
  TO authenticated
  USING (public.get_my_role() = 'admin');

-- ------------------------------------------------------------------------------
-- 6.5 Policies: WORK_ORDER_LOGS
-- ------------------------------------------------------------------------------
-- SELECT:
-- - technician, supervisor, admin: ดู log ทั้งหมด
-- - operator: ดู log เฉพาะใบงานที่ตนเองแจ้ง
CREATE POLICY "Work order logs select policy"
  ON public.work_order_logs FOR SELECT
  TO authenticated
  USING (
    public.get_my_role() IN ('technician', 'supervisor', 'admin')
    OR EXISTS (
      SELECT 1 FROM public.work_orders wo
      WHERE wo.id = work_order_logs.work_order_id AND wo.reported_by = auth.uid()
    )
  );

-- INSERT:
-- ทุก role ที่มีสิทธิ์แก้ไขใบงาน สามารถบันทึก log ได้
CREATE POLICY "Work order logs insert policy"
  ON public.work_order_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
  );

-- ------------------------------------------------------------------------------
-- 6.6 Policies: ATTACHMENTS
-- ------------------------------------------------------------------------------
CREATE POLICY "Attachments select policy"
  ON public.attachments FOR SELECT
  TO authenticated
  USING (
    public.get_my_role() IN ('technician', 'supervisor', 'admin')
    OR equipment_id IS NOT NULL
    OR EXISTS (
      SELECT 1 FROM public.work_orders wo
      WHERE wo.id = attachments.work_order_id AND wo.reported_by = auth.uid()
    )
  );

CREATE POLICY "Attachments insert policy"
  ON public.attachments FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
  );

CREATE POLICY "Attachments delete policy"
  ON public.attachments FOR DELETE
  TO authenticated
  USING (
    uploaded_by = auth.uid() OR public.get_my_role() IN ('supervisor', 'admin')
  );

-- ------------------------------------------------------------------------------
-- 6.7 Policies: NOTIFICATIONS
-- ------------------------------------------------------------------------------
-- ผู้ใช้เห็นเฉพาะการแจ้งเตือนของตัวเอง
CREATE POLICY "Notifications select policy"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ผู้ใช้อัปเดตสถานะ is_read ของตัวเองได้
CREATE POLICY "Notifications update policy"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ระบบ หรือ ผู้ใช้ที่เกี่ยวข้องสามารถ insert การแจ้งเตือนได้
CREATE POLICY "Notifications insert policy"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 6.8 Policies: AUDIT_LOGS
-- ------------------------------------------------------------------------------
-- admin ดู audit logs ได้อย่างเดียว (SELECT)
CREATE POLICY "Audit logs select policy"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.get_my_role() = 'admin');

-- ไม่อนุญาตให้แก้ไขหรือลบ audit log โดยตรง
-- (การ insert เกิดจาก trigger ของฐานข้อมูลด้วย security definer)

-- ==============================================================================
-- 7. STORAGE BUCKETS SETUP & POLICIES
-- ==============================================================================

-- สร้าง Storage Buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('equipment-files', 'equipment-files', true),
  ('wo-attachments', 'wo-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policy: equipment-files (อ่านได้ทุกคน, supervisor/admin อัปโหลด/ลบได้)
CREATE POLICY "Equipment files public read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'equipment-files');

CREATE POLICY "Equipment files supervisor admin insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'equipment-files' AND
    public.get_my_role() IN ('supervisor', 'admin')
  );

CREATE POLICY "Equipment files supervisor admin delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'equipment-files' AND
    public.get_my_role() IN ('supervisor', 'admin')
  );

-- Storage Policy: wo-attachments (ผู้ใช้ล็อกอินอ่านและอัปโหลดได้)
CREATE POLICY "WO attachments authenticated read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'wo-attachments');

CREATE POLICY "WO attachments authenticated insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'wo-attachments');

-- ==============================================================================
-- 8. REALTIME REPLICATION SETUP
-- ==============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.work_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

