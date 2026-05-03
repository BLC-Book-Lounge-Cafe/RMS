import { Injectable } from '@nestjs/common';
import { DatabaseRmsClient } from '@clients/database/database-rms.client';
import { IBookReservationsRepository } from './book-reservations.repository.interface';
import {
  BookReservationRecord,
  CreateBookReservationInput,
  FindBookReservationOnDateFilter,
  FindBookReservationsFilter,
  FindBookReservationsResult,
} from '@services/book-reservations/book-reservations.types';

@Injectable()
export class BookReservationsRepository implements IBookReservationsRepository {
  constructor(private readonly db: DatabaseRmsClient) {}

  async findAll(
    filter: FindBookReservationsFilter,
  ): Promise<FindBookReservationsResult> {
    const skip = (filter.page_number - 1) * filter.page_size;

    const [items, total_entries] = await Promise.all([
      this.db.getClient().book_reservation.findMany({
        skip,
        take: filter.page_size,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          book_id: true,
          name: true,
          reserved_at: true,
          created_at: true,
        },
      }),
      this.db.getClient().book_reservation.count(),
    ]);

    return { items, total_entries };
  }

  findReservationOnDate(
    filter: FindBookReservationOnDateFilter,
  ): Promise<{ id: number } | null> {
    return this.db.getClient().book_reservation.findFirst({
      where: {
        book_id: filter.book_id,
        reserved_at: filter.reserved_at,
      },
      select: { id: true },
    });
  }

  create(input: CreateBookReservationInput): Promise<BookReservationRecord> {
    return this.db.getClient().book_reservation.create({
      data: {
        book_id: input.book_id,
        name: input.name,
        reserved_at: input.reserved_at,
      },
      select: {
        id: true,
        book_id: true,
        name: true,
        reserved_at: true,
        created_at: true,
      },
    });
  }
}
