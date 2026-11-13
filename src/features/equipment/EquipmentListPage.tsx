import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/context';
import {
  getEquipments,
  getLocations,
  deleteEquipment,
  EquipmentWithLocation,
} from './api';
import { Location, EQUIPMENT_STATUS_LABELS } from '@/types';
import { EquipmentFormDialog } from './EquipmentFormDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/states';
import { Pagination } from '@/components/ui/pagination';
import {
  Plus,
  Search,
  Printer,
  QrCode,
  MapPin,
  CheckSquare,
  Square,
  Wrench,
  ChevronRight,
} from 'lucide-react';

export function EquipmentListPage() {
  const { isSupervisor } = useAuth();
  const navigate = useNavigate();

  const [equipments, setEquipments] = useState<EquipmentWithLocation[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');

  // Multi-select for QR Printing
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);

  // Dialog state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EquipmentWithLocation | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setCurrentPage(1); // รีเซ็ตหน้ากลับเป็นหน้า 1 เมื่อฟิลเตอร์เปลี่ยน
      const [eqs, locs] = await Promise.all([
        getEquipments({
          search,
          status: statusFilter,
          location_id: locationFilter,
        }),
        getLocations(),
      ]);
      setEquipments(eqs);
      setLocations(locs);
    } catch (err: any) {
      setError(err.message || 'ไม่สามารถโหลดข้อมูลอุปกรณ์ได้');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, locationFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === equipments.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(equipments.map((e) => e.id));
    }
  };

  const handlePrintSelected = () => {
    if (selectedIds.length === 0) {
      alert('กรุณาเลือกอุปกรณ์ที่ต้องการพิมพ์อย่างน้อย 1 รายการ');
      return;
    }
    navigate(`/equipment/print-qr?ids=${selectedIds.join(',')}`);
  };

  // คำนวณข้อมูลสำหรับ Pagination
  const totalPages = Math.ceil(equipments.length / pageSize) || 1;
  const paginatedEquipments = equipments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-4 pb-20">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">ทะเบียนอุปกรณ์</h2>
          <p className="text-xs text-slate-500">จัดการข้อมูลเครื่องจักรและ QR Code</p>
        </div>

        <div className="flex items-center gap-2">
          {isSupervisor && (
            <Button
              size="sm"
              onClick={() => {
                setEditingItem(null);
                setIsFormOpen(true);
              }}
              className="gap-1.5 shadow-sm text-xs font-semibold"
            >
              <Plus className="w-4 h-4" />
              เพิ่มเครื่อง
            </Button>
          )}
        </div>
      </div>

      {/* Search & Filter */}
      <div className="space-y-2">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <Input
              type="text"
              placeholder="ค้นหาชื่อ, รหัสเครื่อง, ยี่ห้อ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-11 text-sm bg-white"
            />
          </div>
          <Button type="submit" variant="secondary" className="h-11 px-4 text-xs font-semibold">
            ค้นหา
          </Button>
        </form>

        <div className="grid grid-cols-2 gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">ทุกสถานะ</option>
            <option value="active">พร้อมใช้งาน (Active)</option>
            <option value="inactive">ชำรุด/งดใช้ (Inactive)</option>
            <option value="retired">ปลดระวาง (Retired)</option>
          </select>

          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">ทุกสถานที่/ไลน์</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Select Mode & Print Bar */}
      <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border text-xs">
        <button
          type="button"
          onClick={() => {
            setIsSelectMode(!isSelectMode);
            if (isSelectMode) setSelectedIds([]);
          }}
          className="text-slate-600 font-semibold hover:text-slate-900 flex items-center gap-1.5"
        >
          {isSelectMode ? (
            <>
              <CheckSquare className="w-4 h-4 text-primary" />
              โหมดเลือกพิมพ์ (เลือกแล้ว {selectedIds.length})
            </>
          ) : (
            <>
              <Square className="w-4 h-4 text-slate-400" />
              เลือกหลายเครื่องเพื่อพิมพ์ QR
            </>
          )}
        </button>

        {isSelectMode && (
          <div className="flex items-center gap-2">
            <button
              onClick={selectAll}
              className="text-primary hover:underline font-medium"
            >
              {selectedIds.length === equipments.length ? 'ยกเลิกทั้งหมด' : 'เลือกทั้งหมด'}
            </button>
            <Button
              size="sm"
              disabled={selectedIds.length === 0}
              onClick={handlePrintSelected}
              className="h-7 text-xs px-2.5 gap-1"
            >
              <Printer className="w-3.5 h-3.5" />
              พิมพ์ A4 ({selectedIds.length})
            </Button>
          </div>
        )}
      </div>

      {/* Equipment List */}
      {isLoading ? (
        <LoadingState message="กำลังโหลดรายการอุปกรณ์..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : equipments.length === 0 ? (
        <EmptyState
          icon={<Wrench className="w-12 h-12 stroke-[1.5]" />}
          title="ไม่พบข้อมูลอุปกรณ์"
          description={
            search ? 'ไม่พบเครื่องที่ตรงกับคำค้นหา' : 'ยังไม่มีอุปกรณ์ในระบบ เพิ่มเครื่องแรกเพื่อเริ่มต้นใช้งาน'
          }
          action={
            isSupervisor && (
              <Button onClick={() => setIsFormOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                เพิ่มอุปกรณ์ใหม่
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-2.5">
          {paginatedEquipments.map((eq) => {
            const isSelected = selectedIds.includes(eq.id);
            return (
              <div key={eq.id} className="relative">
                <Card
                  className={`transition-all hover:border-primary/50 overflow-hidden ${
                    isSelected ? 'ring-2 ring-primary border-primary bg-primary/5' : ''
                  }`}
                >
                  <CardContent className="p-3.5 flex items-center gap-3">
                    {/* Checkbox ในโหมด Select */}
                    {isSelectMode && (
                      <button
                        type="button"
                        onClick={() => toggleSelect(eq.id)}
                        className="p-1 text-primary focus:outline-none shrink-0"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 fill-primary text-white" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-300" />
                        )}
                      </button>
                    )}

                    {/* Image / Thumbnail */}
                    <div className="w-16 h-16 rounded-xl bg-slate-100 border overflow-hidden shrink-0 flex items-center justify-center">
                      {eq.image_path ? (
                        <img
                          src={eq.image_path}
                          alt={eq.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Wrench className="w-7 h-7 text-slate-400 stroke-[1.5]" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded">
                          {eq.code}
                        </span>
                        <Badge
                          variant={
                            eq.status === 'active'
                              ? 'default'
                              : eq.status === 'inactive'
                              ? 'destructive'
                              : 'secondary'
                          }
                          className="text-[10px] py-0 px-1.5 font-medium"
                        >
                          {EQUIPMENT_STATUS_LABELS[eq.status].split(' ')[0]}
                        </Badge>
                      </div>

                      <h4 className="font-bold text-sm text-slate-900 truncate mt-1">
                        {eq.name}
                      </h4>

                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          {eq.location?.name || 'ไม่ระบุสถานที่'}
                        </span>
                        {eq.brand && <span>• {eq.brand}</span>}
                      </div>
                    </div>

                    {/* Action link */}
                    <Link
                      to={`/equipment/${eq.id}`}
                      className="p-2 text-slate-400 hover:text-primary transition-colors shrink-0"
                      title="ดูรายละเอียด"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Link>
                  </CardContent>
                </Card>
              </div>
            );
          })}

          {/* Pagination Controls */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={equipments.length}
            pageSize={pageSize}
            onPageChange={(p) => {
              setCurrentPage(p);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
            pageSizeOptions={[5, 10, 20, 50]}
          />
        </div>
      )}

      {/* Add / Edit Dialog */}
      <EquipmentFormDialog
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingItem(null);
        }}
        onSuccess={loadData}
        initialData={editingItem}
        locations={locations}
        onLocationsChange={loadData}
      />
    </div>
  );
}

