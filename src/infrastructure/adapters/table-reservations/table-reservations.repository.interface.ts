import {
  FindTableReservationsFilter,
  FindTableReservationsResult,
} from '@services/table-reservations/table-reservations.types';

export interface ITableReservationsRepository {
  findAll(filter: FindTableReservationsFilter): Promise<FindTableReservationsResult>;
}
