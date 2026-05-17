import { CafeScheduleRecord } from '@services/cafe-schedule/cafe-schedule.types';

export interface ICafeScheduleRepository {
  findActive(): Promise<CafeScheduleRecord>;
}
