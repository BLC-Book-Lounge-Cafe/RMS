import {
  FindBookReservationsFilter,
  FindBookReservationsResult,
} from '@services/book-reservations/book-reservations.types';

export interface IBookReservationsRepository {
  findAll(filter: FindBookReservationsFilter): Promise<FindBookReservationsResult>;
}
