export interface FindBookReservationsFilter {
  page_number: number;
  page_size: number;
}

export interface BookReservationRecord {
  id: number;
  book_id: number;
  name: string;
  reserved_at: Date;
  created_at: Date;
}

export interface FindBookReservationsResult {
  items: BookReservationRecord[];
  total_entries: number;
}

export interface CreateBookReservationInput {
  book_id: number;
  name: string;
  reserved_at: Date;
}

export interface FindBookReservationOnDateFilter {
  book_id: number;
  reserved_at: Date;
}
