export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled';

export interface FindQuickReservationsFilter {
  status?: ReservationStatus;
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
