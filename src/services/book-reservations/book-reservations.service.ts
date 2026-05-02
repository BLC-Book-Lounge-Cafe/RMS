import { Inject, Injectable } from '@nestjs/common';
import { IBookReservationsRepository } from '@infrastructure/adapters/book-reservations/book-reservations.repository.interface';
import {
  FindBookReservationsFilter,
  FindBookReservationsResult,
} from './book-reservations.types';

@Injectable()
export class BookReservationsService {
  constructor(
    @Inject('BOOK_RESERVATIONS_REPOSITORY')
    private readonly repository: IBookReservationsRepository,
  ) {}

  findAll(filter: FindBookReservationsFilter): Promise<FindBookReservationsResult> {
    return this.repository.findAll(filter);
  }
}
