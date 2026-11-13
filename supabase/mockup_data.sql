-- ==============================================================================
-- SEED DATA / MOCKUP: สถานที่ (Locations), เครื่องจักร (Equipment), ใบแจ้งซ่อม (Work Orders)
-- นำโค้ดนี้ไปรันใน Supabase -> SQL Editor เพื่อสร้างข้อมูลจำลองสำหรับทดสอบระบบ
-- ==============================================================================

-- 1. สร้างสถานที่ / โซน / ไลน์การผลิตจำลอง
INSERT INTO public.locations (id, name, building, floor, description)
VALUES 
  ('11111111-1111-1111-1111-111111111101', 'ไลน์ประกอบ 1 (Assembly Line A)', 'อาคารผลิต 1', 'ชั้น 1', 'สายพานประกอบชิ้นส่วนอิเล็กทรอนิกส์'),
  ('11111111-1111-1111-1111-111111111102', 'แผนกปั๊มโลหะ (Stamping Press Area)', 'อาคารผลิต 1', 'ชั้น 1', 'พื้นที่ติดตั้งแท่นปั๊มไฮดรอลิกขนาด 100-500 ตัน'),
  ('11111111-1111-1111-1111-111111111103', 'ไลน์บรรจุภัณฑ์อัตโนมัติ (Packaging Line)', 'อาคารบรรจุภัณฑ์', 'ชั้น 1', 'เครื่องซีลและหุ่นยนต์จัดเรียงพาเลท'),
  ('11111111-1111-1111-1111-111111111104', 'ห้องระบบสนับสนุน (Utility & Compressor Room)', 'อาคารสาธารณูปโภค', 'ชั้นใต้ดิน', 'ระบบลม ปั๊มน้ำหล่อเย็น และ Chiller')
ON CONFLICT (id) DO NOTHING;


-- 2. สร้างอุปกรณ์ / เครื่องจักรจำลอง (6 เครื่องจักรหลักในโรงงาน)
INSERT INTO public.equipment (id, code, name, location_id, brand, model, serial_no, purchased_at, warranty_expired_at, status, image_path, specs)
VALUES 
  (
    '22222222-2222-2222-2222-222222222201',
    'EQ-MC-001',
    'เครื่องกลึง CNC แนวนอน 5 แกน',
    '11111111-1111-1111-1111-111111111101',
    'Mazak',
    'INTEGREX i-200H',
    'MZK-2023-9981',
    '2023-01-15',
    '2026-01-15',
    'active',
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=60',
    '{"spindle_speed": "12000 RPM", "power": "22 kW", "control": "SmoothAi"}'::jsonb
  ),
  (
    '22222222-2222-2222-2222-222222222202',
    'EQ-PRS-002',
    'แท่นปั๊มขึ้นรูปไฮดรอลิก 200 ตัน',
    '11111111-1111-1111-1111-111111111102',
    'Komatsu',
    'OBS-200-3',
    'KMT-HYD-5541',
    '2022-06-10',
    '2025-06-10',
    'active',
    'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=800&auto=format&fit=crop&q=60',
    '{"max_pressure": "200 Tons", "stroke": "300 mm", "oil_type": "ISO VG 46"}'::jsonb
  ),
  (
    '22222222-2222-2222-2222-222222222203',
    'EQ-ROB-003',
    'หุ่นยนต์แขนกลหยิบจับชิ้นส่วน (6-Axis Robot)',
    '11111111-1111-1111-1111-111111111101',
    'FANUC',
    'M-20iD/25',
    'FNC-6AX-1102',
    '2023-11-20',
    '2026-11-20',
    'active',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60',
    '{"payload": "25 kg", "reach": "1831 mm", "repeatability": "±0.02 mm"}'::jsonb
  ),
  (
    '22222222-2222-2222-2222-222222222204',
    'EQ-PKG-004',
    'เครื่องซีลกล่องและจัดพาเลทอัตโนมัติ',
    '11111111-1111-1111-1111-111111111103',
    'Tetra Pak',
    'CBP-800',
    'TTP-PKG-7740',
    '2021-04-05',
    '2024-04-05',
    'inactive',
    'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop&q=60',
    '{"capacity": "60 boxes/min", "tape_size": "50mm", "voltage": "380V 3Phase"}'::jsonb
  ),
  (
    '22222222-2222-2222-2222-222222222205',
    'EQ-CMP-005',
    'เครื่องอัดลมระบบสกรู (Rotary Screw Compressor)',
    '11111111-1111-1111-1111-111111111104',
    'Atlas Copco',
    'GA 37 VSD+',
    'ATC-AIR-3389',
    '2022-09-18',
    '2027-09-18',
    'active',
    'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=800&auto=format&fit=crop&q=60',
    '{"fused_pressure": "7.5 bar", "capacity": "7.1 m3/min", "motor": "37 kW"}'::jsonb
  ),
  (
    '22222222-2222-2222-2222-222222222206',
    'EQ-CHL-006',
    'เครื่องทำความเย็นหล่อเย็นระบบชิลเลอร์ (Chiller 50 Ton)',
    '11111111-1111-1111-1111-111111111104',
    'Daikin',
    'UAA50AH',
    'DKN-CHL-8821',
    '2020-03-12',
    '2023-03-12',
    'active',
    'https://images.unsplash.com/photo-1581092162384-8987c1d64718?w=800&auto=format&fit=crop&q=60',
    '{"cooling_capacity": "175 kW", "refrigerant": "R410A", "water_flow": "30 m3/h"}'::jsonb
  )
ON CONFLICT (code) DO NOTHING;


-- 3. สร้างใบแจ้งซ่อมตัวอย่าง (Work Orders) เพื่อให้แดชบอร์ดมีข้อมูลสวยงาม
DO $$
DECLARE
  v_reporter_id UUID;
BEGIN
  -- ดึง user คนแรกในระบบมาเป็นผู้แจ้ง (ถ้ามี) มิฉะนั้นสร้าง dummy id
  SELECT id INTO v_reporter_id FROM public.profiles LIMIT 1;
  
  IF v_reporter_id IS NOT NULL THEN
    -- ใบแจ้งซ่อม 1: ด่วนวิกฤต (ไฮดรอลิกรั่ว)
    INSERT INTO public.work_orders (
      wo_no, equipment_id, problem_type, priority, description, status, reported_by, reported_at
    ) VALUES (
      'WO-2411-0001',
      '22222222-2222-2222-2222-222222222202',
      'hydraulic',
      'critical',
      'น้ำมันไฮดรอลิกรั่วบริเวณข้อต่อกระบอกสูบหลัก แรงดันตกฮวบเครื่องหยุดทำงานกะทันหัน',
      'in_progress',
      v_reporter_id,
      NOW() - INTERVAL '3 hours'
    ) ON CONFLICT (wo_no) DO NOTHING;

    -- ใบแจ้งซ่อม 2: แจ้งซ่อมใหม่ (สายพานขาด)
    INSERT INTO public.work_orders (
      wo_no, equipment_id, problem_type, priority, description, status, reported_by, reported_at
    ) VALUES (
      'WO-2411-0002',
      '22222222-2222-2222-2222-222222222204',
      'mechanical',
      'high',
      'สายพานขับกล่องลำเลียงฉีกขาด ระบบส่งกำลังติดขัด ไม่สามารถซีลกล่องได้',
      'waiting_parts',
      v_reporter_id,
      NOW() - INTERVAL '1 day'
    ) ON CONFLICT (wo_no) DO NOTHING;

    -- ใบแจ้งซ่อม 3: ซ่อมเสร็จแล้วปิดงาน (เปลี่ยนถ่ายน้ำมันหล่อลื่น)
    INSERT INTO public.work_orders (
      wo_no, equipment_id, problem_type, priority, description, status, reported_by, reported_at, closed_at, cause, solution
    ) VALUES (
      'WO-2411-0003',
      '22222222-2222-2222-2222-222222222205',
      'other',
      'medium',
      'ถึงรอบเปลี่ยนไส้กรองอากาศและถ่ายน้ำมันสังเคราะห์ตามชั่วโมงการทำงาน',
      'closed',
      v_reporter_id,
      NOW() - INTERVAL '5 days',
      NOW() - INTERVAL '4 days',
      'ครบกำหนดระยะเวลาบำรุงรักษาเชิงป้องกัน (PM Routine)',
      'เปลี่ยนไส้กรองอากาศ Atlas Copco แท้ และถ่ายน้ำมัน Roto-Inject Fluid 15 ลิตร ทดสอบแรงดัน 7.5 บาร์ปกติ'
    ) ON CONFLICT (wo_no) DO NOTHING;
  END IF;
END $$;

