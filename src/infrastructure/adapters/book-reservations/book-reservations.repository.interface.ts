import {
  BookReservationRecord,
  CreateBookReservationInput,
  FindBookReservationOnDateFilter,
  FindBookReservationsFilter,
  FindBookReservationsResult,
} from '@services/book-reservations/book-reservations.types';

export interface IBookReservationsRepository {
  findAll(filter: FindBookReservationsFilter): Promise<FindBookReservationsResult>;
  findReservationOnDate(
    filter: FindBookReservationOnDateFilter,
  ): Promise<{ id: number } | null>;
  create(input: CreateBookReservationInput): Promise<BookReservationRecord>;
}
