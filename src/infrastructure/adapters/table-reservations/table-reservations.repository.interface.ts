import {
  CreateTableReservationInput,
  FindOverlappingTableReservationFilter,
  FindTableReservationsFilter,
  FindTableReservationsResult,
  TableReservationRecord,
} from '@services/table-reservations/table-reservations.types';

export interface ITableReservationsRepository {
  findAll(filter: FindTableReservationsFilter): Promise<FindTableReservationsResult>;
  findOverlapping(
    filter: FindOverlappingTableReservationFilter,
  ): Promise<{ id: number } | null>;
  create(input: CreateTableReservationInput): Promise<TableReservationRecord>;
}
