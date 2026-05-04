import { Injectable } from '@nestjs/common';
import { DatabaseRmsClient } from '@clients/database/database-rms.client';
import { CafeScheduleRecord } from '@services/cafe-schedule/cafe-schedule.types';
import { ICafeScheduleRepository } from './cafe-schedule.repository.interface';

@Injectable()
export class CafeScheduleRepository implements ICafeScheduleRepository {
  constructor(private readonly db: DatabaseRmsClient) {}

  findActive(): Promise<CafeScheduleRecord> {
    return this.db.getClient().cafe_schedule.findFirstOrThrow({
      orderBy: { id: 'asc' },
      select: {
        open_time: true,
        close_time: true,
        slot_duration_minutes: true,
      },
    });
  }
}
