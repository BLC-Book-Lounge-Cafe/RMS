import {
  CreateTableReservationInput,
  FindOverlappingTableReservationFilter,
  FindReservationsInRangeFilter,
  FindTableReservationsFilter,
  FindTableReservationsResult,
  ReservationRangeRecord,
  TableReservationRecord,
} from '@services/table-reservations/table-reservations.types';

export interface ITableReservationsRepository {
  findAll(filter: FindTableReservationsFilter): Promise<FindTableReservationsResult>;
  findOverlapping(
    filter: FindOverlappingTableReservationFilter,
  ): Promise<{ id: number } | null>;
  findForDate(
    filter: FindReservationsInRangeFilter,
  ): Promise<ReservationRangeRecord[]>;
  create(input: CreateTableReservationInput): Promise<TableReservationRecord>;
  findById(id: number): Promise<{ id: number } | null>;
  delete(id: number): Promise<void>;
}
