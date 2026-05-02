import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiUnauthorizedResponse } from '@guards/auth.guard';
import { BookReservationsService } from '@services/book-reservations/book-reservations.service';
import {
  BookReservationModel,
  BookReservationsQueryDto,
  BookReservationsResponse,
} from './book-reservations.models';

@ApiTags('Бронирование книг')
@ApiBearerAuth('Bearer')
@ApiUnauthorizedResponse()
@Controller('v1/books')
export class BookReservationsController {
  constructor(private readonly service: BookReservationsService) {}

  @Get()
  @ApiOperation({
    summary: 'Просмотр бронирований книг',
    description: 'Возвращает список бронирований книг с пагинацией.',
  })
  @ApiOkResponse({
    type: BookReservationsResponse,
    description: 'Список бронирований книг',
  })
  async getReservations(
    @Query() query: BookReservationsQueryDto,
  ): Promise<BookReservationsResponse> {
    const page_number = query.page_number ?? 1;
    const page_size = query.page_size ?? 20;

    const { items, total_entries } = await this.service.findAll({
      page_number,
      page_size,
    });

    return {
      reservations: items.map(
        (item): BookReservationModel => ({
          id: item.id,
          book_id: item.book_id,
          name: item.name,
          created_at: item.created_at,
        }),
      ),
      page_number,
      page_size,
      total_entries,
      total_pages: Math.ceil(total_entries / page_size),
    };
  }
}
