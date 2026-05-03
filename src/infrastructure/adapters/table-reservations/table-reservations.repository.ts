import { Injectable } from '@nestjs/common';
import { DatabaseRmsClient } from '@clients/database/database-rms.client';
import { ITableReservationsRepository } from './table-reservations.repository.interface';
import {
  CreateTableReservationInput,
  FindOverlappingTableReservationFilter,
  FindTableReservationsFilter,
  FindTableReservationsResult,
  TableReservationRecord,
} from '@services/table-reservations/table-reservations.types';

@Injectable()
export class TableReservationsRepository implements ITableReservationsRepository {
  constructor(private readonly db: DatabaseRmsClient) {}

  async findAll(
    filter: FindTableReservationsFilter,
  ): Promise<FindTableReservationsResult> {
    const skip = (filter.page_number - 1) * filter.page_size;

    const [items, total_entries] = await Promise.all([
      this.db.getClient().table_reservation.findMany({
        skip,
        take: filter.page_size,
        orderBy: { created_at: 'asc' },
        select: {
          id: true,
          table_id: true,
          name: true,
          phone: true,
          start_at: true,
          end_at: true,
          created_at: true,
        },
      }),
      this.db.getClient().table_reservation.count(),
    ]);

    return { items, total_entries };
  }

  findOverlapping(
    filter: FindOverlappingTableReservationFilter,
  ): Promise<{ id: number } | null> {
    return this.db.getClient().table_reservation.findFirst({
      where: {
        table_id: filter.table_id,
        start_at: { lt: filter.end_at },
        end_at: { gt: filter.start_at },
      },
      select: { id: true },
    });
  }

  create(input: CreateTableReservationInput): Promise<TableReservationRecord> {
    return this.db.getClient().table_reservation.create({
      data: {
        table_id: input.table_id,
        name: input.name,
        phone: input.phone,
        start_at: input.start_at,
        end_at: input.end_at,
      },
      select: {
        id: true,
        table_id: true,
        name: true,
        phone: true,
        start_at: true,
        end_at: true,
        created_at: true,
      },
    });
  }
}
