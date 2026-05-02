import { Module } from '@nestjs/common';
import { DatabaseRmsModule } from '@clients/database/database-rms.module';
import { QuickReservationsController } from '@controllers/quick-reservations/quick-reservations.controller';
import { QuickReservationsService } from '@services/quick-reservations/quick-reservations.service';
import { QuickReservationsRepository } from '@infrastructure/adapters/quick-reservations/quick-reservations.repository';

@Module({
  imports: [DatabaseRmsModule],
  controllers: [QuickReservationsController],
  providers: [
    QuickReservationsService,
    {
      provide: 'QUICK_RESERVATIONS_REPOSITORY',
      useClass: QuickReservationsRepository,
    },
  ],
})
export class QuickReservationsModule {}
