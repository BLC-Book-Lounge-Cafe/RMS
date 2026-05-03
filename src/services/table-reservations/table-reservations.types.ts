export interface FindTableReservationsFilter {
  table_id?: number;
  active_at?: Date;
  page_number: number;
  page_size: number;
}

export interface TableReservationRecord {
  id: number;
  table_id: number;
  name: string;
  phone: string;
  start_at: Date;
  end_at: Date;
  created_at: Date;
}

export interface FindTableReservationsResult {
  items: TableReservationRecord[];
  total_entries: number;
}

export interface CreateTableReservationInput {
  table_id: number;
  name: string;
  phone: string;
  start_at: Date;
  end_at: Date;
}

export interface FindOverlappingTableReservationFilter {
  table_id: number;
  start_at: Date;
  end_at: Date;
}
