export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'operator' | 'technician' | 'supervisor' | 'admin';
export type EquipmentStatus = 'active' | 'inactive' | 'retired';
export type ProblemType = 'mechanical' | 'electrical' | 'pneumatic' | 'hydraulic' | 'other';
export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';
export type WoStatus =
  | 'reported'
  | 'accepted'
  | 'in_progress'
  | 'waiting_parts'
  | 'inspection'
  | 'closed'
  | 'cancelled';
export type AuditAction = 'insert' | 'update' | 'delete';

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          role: UserRole;
          department: string | null;
          phone: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          role?: UserRole;
          department?: string | null;
          phone?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          role?: UserRole;
          department?: string | null;
          phone?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      locations: {
        Row: {
          id: string;
          parent_id: string | null;
          name: string;
          type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          parent_id?: string | null;
          name: string;
          type?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          parent_id?: string | null;
          name?: string;
          type?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      equipment: {
        Row: {
          id: string;
          code: string;
          name: string;
          location_id: string | null;
          brand: string | null;
          model: string | null;
          serial_no: string | null;
          purchase_date: string | null;
          warranty_until: string | null;
          status: EquipmentStatus;
          image_path: string | null;
          manual_path: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          location_id?: string | null;
          brand?: string | null;
          model?: string | null;
          serial_no?: string | null;
          purchase_date?: string | null;
          warranty_until?: string | null;
          status?: EquipmentStatus;
          image_path?: string | null;
          manual_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          location_id?: string | null;
          brand?: string | null;
          model?: string | null;
          serial_no?: string | null;
          purchase_date?: string | null;
          warranty_until?: string | null;
          status?: EquipmentStatus;
          image_path?: string | null;
          manual_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      work_orders: {
        Row: {
          id: string;
          wo_no: string;
          equipment_id: string;
          reported_by: string;
          assigned_to: string | null;
          problem_type: ProblemType;
          priority: PriorityLevel;
          status: WoStatus;
          description: string;
          cause: string | null;
          solution: string | null;
          reported_at: string;
          accepted_at: string | null;
          closed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          wo_no?: string;
          equipment_id: string;
          reported_by: string;
          assigned_to?: string | null;
          problem_type?: ProblemType;
          priority?: PriorityLevel;
          status?: WoStatus;
          description: string;
          cause?: string | null;
          solution?: string | null;
          reported_at?: string;
          accepted_at?: string | null;
          closed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          wo_no?: string;
          equipment_id?: string;
          reported_by?: string;
          assigned_to?: string | null;
          problem_type?: ProblemType;
          priority?: PriorityLevel;
          status?: WoStatus;
          description?: string;
          cause?: string | null;
          solution?: string | null;
          reported_at?: string;
          accepted_at?: string | null;
          closed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      work_order_logs: {
        Row: {
          id: string;
          work_order_id: string;
          user_id: string;
          action: string;
          from_status: WoStatus | null;
          to_status: WoStatus | null;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          work_order_id: string;
          user_id: string;
          action: string;
          from_status?: WoStatus | null;
          to_status?: WoStatus | null;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          work_order_id?: string;
          user_id?: string;
          action?: string;
          from_status?: WoStatus | null;
          to_status?: WoStatus | null;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      attachments: {
        Row: {
          id: string;
          work_order_id: string | null;
          equipment_id: string | null;
          file_path: string;
          file_type: string | null;
          file_size: number | null;
          uploaded_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          work_order_id?: string | null;
          equipment_id?: string | null;
          file_path: string;
          file_type?: string | null;
          file_size?: number | null;
          uploaded_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          work_order_id?: string | null;
          equipment_id?: string | null;
          file_path?: string;
          file_type?: string | null;
          file_size?: number | null;
          uploaded_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          body: string;
          ref: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          body: string;
          ref?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          body?: string;
          ref?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          table_name: string;
          record_id: string;
          action: AuditAction;
          old_data: Json | null;
          new_data: Json | null;
          user_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          table_name: string;
          record_id: string;
          action: AuditAction;
          old_data?: Json | null;
          new_data?: Json | null;
          user_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          table_name?: string;
          record_id?: string;
          action?: AuditAction;
          old_data?: Json | null;
          new_data?: Json | null;
          user_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_my_role: {
        Args: Record<PropertyKey, never>;
        Returns: UserRole;
      };
    };
    Enums: {
      user_role: UserRole;
      equipment_status: EquipmentStatus;
      problem_type: ProblemType;
      priority_level: PriorityLevel;
      wo_status: WoStatus;
      audit_action: AuditAction;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
