import { BadRequestException, ConflictException, Inject, Injectable } from '@nestjs/common';
import { IBookReservationsRepository } from '@infrastructure/adapters/book-reservations/book-reservations.repository.interface';
import {
  BookReservationRecord,
  CreateBookReservationInput,
  FindBookReservationsFilter,
  FindBookReservationsResult,
} from './book-reservations.types';
import { BookAlreadyReserved } from './book-reservations.errors';
import { PastDateNotAllowed } from '@services/common/errors/reservations.errors';

@Injectable()
export class BookReservationsService {
  constructor(
    @Inject('BOOK_RESERVATIONS_REPOSITORY')
    private readonly repository: IBookReservationsRepository,
  ) {}

  findAll(filter: FindBookReservationsFilter): Promise<FindBookReservationsResult> {
    return this.repository.findAll(filter);
  }

  async create(input: CreateBookReservationInput): Promise<BookReservationRecord> {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    if (input.reserved_at < today) {
      throw new BadRequestException(PastDateNotAllowed);
    }

    const existing = await this.repository.findReservationOnDate({
      book_id: input.book_id,
      reserved_at: input.reserved_at,
    });

    if (existing) {
      throw new ConflictException(BookAlreadyReserved);
    }

    return this.repository.create(input);
  }
}
