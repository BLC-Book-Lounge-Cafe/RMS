import { Inject, Injectable } from '@nestjs/common';
import { ITableReservationsRepository } from '@infrastructure/adapters/table-reservations/table-reservations.repository.interface';
import {
  FindTableReservationsFilter,
  FindTableReservationsResult,
} from './table-reservations.types';

@Injectable()
export class TableReservationsService {
  constructor(
    @Inject('TABLE_RESERVATIONS_REPOSITORY')
    private readonly repository: ITableReservationsRepository,
  ) {}

  findAll(filter: FindTableReservationsFilter): Promise<FindTableReservationsResult> {
    return this.repository.findAll(filter);
  }
}
