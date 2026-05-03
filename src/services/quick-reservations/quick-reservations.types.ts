export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled';

export interface FindQuickReservationsFilter {
  status?: ReservationStatus;
  created_date?: Date;
  page_number: number;
  page_size: number;
}

export interface QuickReservationRecord {
  id: number;
  status: ReservationStatus;
  name: string;
  phone: string;
  created_at: Date;
}

export interface FindQuickReservationsResult {
  items: QuickReservationRecord[];
  total_entries: number;
}

export interface CreateQuickReservationInput {
  name: string;
  phone: string;
}

export interface UpdateQuickReservationStatusInput {
  id: number;
  status: Exclude<ReservationStatus, 'pending'>;
}
