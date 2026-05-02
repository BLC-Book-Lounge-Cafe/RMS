import { Injectable } from '@nestjs/common';
import { DatabaseRmsClient } from '@clients/database/database-rms.client';
import { IBookReservationsRepository } from './book-reservations.repository.interface';
import {
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
        orderBy: { created_at: 'asc' },
        select: {
          id: true,
          book_id: true,
          name: true,
          created_at: true,
        },
      }),
      this.db.getClient().book_reservation.count(),
    ]);

    return { items, total_entries };
  }
}
