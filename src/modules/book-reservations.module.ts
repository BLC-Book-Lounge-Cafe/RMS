import { Module } from '@nestjs/common';
import { DatabaseRmsModule } from '@clients/database/database-rms.module';
import { BookReservationsController } from '@controllers/book-reservations/book-reservations.controller';
import { BookReservationsService } from '@services/book-reservations/book-reservations.service';
import { BookReservationsRepository } from '@infrastructure/adapters/book-reservations/book-reservations.repository';

@Module({
  imports: [DatabaseRmsModule],
  controllers: [BookReservationsController],
  providers: [
    BookReservationsService,
    {
      provide: 'BOOK_RESERVATIONS_REPOSITORY',
      useClass: BookReservationsRepository,
    },
  ],
})
export class BookReservationsModule {}
