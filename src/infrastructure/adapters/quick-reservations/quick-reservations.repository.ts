import { Injectable } from '@nestjs/common';
import { DatabaseRmsClient } from '@clients/database/database-rms.client';
import { IQuickReservationsRepository } from './quick-reservations.repository.interface';
import {
  CreateQuickReservationInput,
  FindQuickReservationsFilter,
  FindQuickReservationsResult,
  QuickReservationRecord,
  UpdateQuickReservationStatusInput,
} from '@services/quick-reservations/quick-reservations.types';

@Injectable()
export class QuickReservationsRepository implements IQuickReservationsRepository {
  constructor(private readonly db: DatabaseRmsClient) {}

  async findAll(
    filter: FindQuickReservationsFilter,
  ): Promise<FindQuickReservationsResult> {
    let createdRange: { gte: Date; lt: Date } | undefined;
    if (filter.created_date !== undefined) {
      const dayStart = new Date(filter.created_date);
      dayStart.setUTCHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);
      createdRange = { gte: dayStart, lt: dayEnd };
    }

    const where = {
      ...(filter.status && { status: filter.status }),
      ...(createdRange !== undefined && { created_at: createdRange }),
    };
    const skip = (filter.page_number - 1) * filter.page_size;

    const [items, total_entries] = await Promise.all([
      this.db.getClient().quick_reservation.findMany({
        where,
        skip,
        take: filter.page_size,
        orderBy: { created_at: 'asc' },
        select: {
          id: true,
          status: true,
          name: true,
          phone: true,
          created_at: true,
        },
      }),
      this.db.getClient().quick_reservation.count({ where }),
    ]);

    return { items, total_entries };
  }

  findById(id: number): Promise<QuickReservationRecord | null> {
    return this.db.getClient().quick_reservation.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        name: true,
        phone: true,
        created_at: true,
      },
    });
  }

  create(input: CreateQuickReservationInput): Promise<QuickReservationRecord> {
    return this.db.getClient().quick_reservation.create({
      data: {
        name: input.name,
        phone: input.phone,
      },
      select: {
        id: true,
        status: true,
        name: true,
        phone: true,
        created_at: true,
      },
    });
  }

  updateStatus(input: UpdateQuickReservationStatusInput): Promise<QuickReservationRecord> {
    return this.db.getClient().quick_reservation.update({
      where: { id: input.id },
      data: { status: input.status },
      select: {
        id: true,
        status: true,
        name: true,
        phone: true,
        created_at: true,
      },
    });
  }
}
