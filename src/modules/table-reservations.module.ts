import { Module } from '@nestjs/common';
import { DatabaseRmsModule } from '@clients/database/database-rms.module';
import { TableReservationsController } from '@controllers/table-reservations/table-reservations.controller';
import { TableReservationsService } from '@services/table-reservations/table-reservations.service';
import { TableReservationsRepository } from '@infrastructure/adapters/table-reservations/table-reservations.repository';
import { CafeScheduleRepository } from '@infrastructure/adapters/cafe-schedule/cafe-schedule.repository';

@Module({
  imports: [DatabaseRmsModule],
  controllers: [TableReservationsController],
  providers: [
    TableReservationsService,
    {
      provide: 'TABLE_RESERVATIONS_REPOSITORY',
      useClass: TableReservationsRepository,
    },
    {
      provide: 'CAFE_SCHEDULE_REPOSITORY',
      useClass: CafeScheduleRepository,
    },
  ],
})
export class TableReservationsModule {}
