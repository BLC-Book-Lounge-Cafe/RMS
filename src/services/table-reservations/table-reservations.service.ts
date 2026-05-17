import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TableReservationNotFound } from '@controllers/errors/controllers.errors';
import { ITableReservationsRepository } from './table-reservations.repository.interface';
import { ICafeScheduleRepository } from '@services/cafe-schedule/cafe-schedule.repository.interface';
import { CafeScheduleRecord } from '@services/cafe-schedule/cafe-schedule.types';
import {
  CreateTableReservationInput,
  FindTableReservationsFilter,
  FindTableReservationsResult,
  ListAvailabilityInput,
  ReservationRangeRecord,
  TableReservationRecord,
  TableSlotRecord,
} from './table-reservations.types';
import { TableMinDurationViolation, TableSlotConflict } from './table-reservations.errors';
import { PastDateNotAllowed } from '@services/common/errors/reservations.errors';

@Injectable()
export class TableReservationsService {
  constructor(
    @Inject('TABLE_RESERVATIONS_REPOSITORY')
    private readonly repository: ITableReservationsRepository,
    @Inject('CAFE_SCHEDULE_REPOSITORY')
    private readonly scheduleRepository: ICafeScheduleRepository,
  ) {}

  findAll(filter: FindTableReservationsFilter): Promise<FindTableReservationsResult> {
    return this.repository.findAll(filter);
  }

  async remove(id: number): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(TableReservationNotFound);
    }
    await this.repository.delete(id);
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

  async listAvailability(input: ListAvailabilityInput): Promise<TableSlotRecord[]> {
    const schedule = await this.scheduleRepository.findActive();
    const { day_start, day_end } = this.buildDayBoundaries(input.date, schedule);

    const existing = await this.repository.findForDate({
      table_id: input.table_id,
      day_start,
      day_end,
    });

    return this.generateSlots(day_start, day_end, schedule.slot_duration_minutes, existing);
  }

  private buildDayBoundaries(
    date: Date,
    schedule: CafeScheduleRecord,
  ): { day_start: Date; day_end: Date } {
    const day_start = new Date(date);
    day_start.setUTCHours(
      schedule.open_time.getUTCHours(),
      schedule.open_time.getUTCMinutes(),
      0,
      0,
    );

    const day_end = new Date(date);
    day_end.setUTCHours(
      schedule.close_time.getUTCHours(),
      schedule.close_time.getUTCMinutes(),
      0,
      0,
    );

    return { day_start, day_end };
  }

  private generateSlots(
    day_start: Date,
    day_end: Date,
    slot_duration_minutes: number,
    existing: ReservationRangeRecord[],
  ): TableSlotRecord[] {
    const slot_duration_ms = slot_duration_minutes * 60 * 1000;
    const slots: TableSlotRecord[] = [];

    let cursor = day_start.getTime();
    const end_boundary = day_end.getTime();

    while (cursor + slot_duration_ms <= end_boundary) {
      const slot_start = new Date(cursor);
      const slot_end = new Date(cursor + slot_duration_ms);

      slots.push({
        start_at: slot_start,
        end_at: slot_end,
        is_reserved: this.isSlotOccupied(slot_start, slot_end, existing),
      });

      cursor += slot_duration_ms;
    }

    return slots;
  }

  private isSlotOccupied(
    slot_start: Date,
    slot_end: Date,
    existing: ReservationRangeRecord[],
  ): boolean {
    return existing.some(
      (reservation) =>
        reservation.start_at < slot_end && reservation.end_at > slot_start,
    );
  }
}
