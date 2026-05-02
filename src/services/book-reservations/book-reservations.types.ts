export interface FindBookReservationsFilter {
  page_number: number;
  page_size: number;
}

export interface BookReservationRecord {
  id: number;
  book_id: number;
  name: string;
  created_at: Date;
}

export interface FindBookReservationsResult {
  items: BookReservationRecord[];
  total_entries: number;
}
