import { BadRequestException, ConflictException, Inject, Injectable } from '@nestjs/common';
import { ITableReservationsRepository } from '@infrastructure/adapters/table-reservations/table-reservations.repository.interface';
import {
  CreateTableReservationInput,
  FindTableReservationsFilter,
  FindTableReservationsResult,
  TableReservationRecord,
} from './table-reservations.types';
import { TableMinDurationViolation, TableSlotConflict } from './table-reservations.errors';
import { PastDateNotAllowed } from '@services/common/reservations.errors';

@Injectable()
export class TableReservationsService {
  constructor(
    @Inject('TABLE_RESERVATIONS_REPOSITORY')
    private readonly repository: ITableReservationsRepository,
  ) {}

  findAll(filter: FindTableReservationsFilter): Promise<FindTableReservationsResult> {
    return this.repository.findAll(filter);
  }

  async create(input: CreateTableReservationInput): Promise<TableReservationRecord> {
    if (input.start_at < new Date()) {
      throw new BadRequestException(PastDateNotAllowed);
    }

    const diffMs = input.end_at.getTime() - input.start_at.getTime();
    if (diffMs < 60 * 60 * 1000) {
      throw new ConflictException(TableMinDurationViolation);
    }

    const overlap = await this.repository.findOverlapping({
      table_id: input.table_id,
      start_at: input.start_at,
      end_at: input.end_at,
    });

    if (overlap) {
      throw new ConflictException(TableSlotConflict);
    }

    return this.repository.create(input);
  }
}
