export interface User {
  id: string;
  name: string;
  email: string;
  role: 'startup' | 'amc_admin' | 'ima_admin';
  tokens_given: number;
  tokens_consumed: number;
  tokens_remaining: number;
  created_at: string;
  last_login?: string;
}

export interface Machine {
  id: string;
  name: string;
  machine_type_id: string;
  status: 'available' | 'maintenance' | 'offline';
  custom_token_cost?: number;
  created_at: string;
}

export interface MachineType {
  id: string;
  name: string;
  description: string;
}

export interface Booking {
  id: string;
  user_id: string;
  machine_id: string;
  start_datetime: string;
  end_datetime: string;
  booking_type: 'weekly_planning' | 'same_week_exceptional' | 'monthly_provisional';
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  justification?: string;
  tokens_consumed: number;
  created_at: string;
  approved_by?: string;
}

export interface AvailabilityBlock {
  id: string;
  machine_id: string;
  start_datetime: string;
  end_datetime: string;
  block_type: 'ima_internal' | 'maintenance' | 'training';
  created_by: string;
  reason: string;
}

export interface TokenTransaction {
  id: string;
  user_id: string;
  booking_id?: string;
  amount: number;
  transaction_type: 'allocated' | 'consumed' | 'refunded';
  created_at: string;
  created_by: string;
}

export interface AuditLog {
  id: string;
  action: 'create' | 'update' | 'delete';
  entity_type: 'machine' | 'machine_type';
  entity_id: string;
  description: string;
  user_name: string;
  changes: any;
  timestamp: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  status: 'available' | 'pending' | 'confirmed' | 'ima_internal' | 'maintenance';
  user_name?: string;
  machine_name: string;
  booking_type?: string;
}