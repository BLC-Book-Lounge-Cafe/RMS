import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ApiUnauthorizedResponse } from '@guards/auth.guard';
import { BookReservationsService } from '@services/book-reservations/book-reservations.service';
import { BookAlreadyReserved } from '@services/book-reservations/book-reservations.errors';
import { PastDateNotAllowed } from '@services/common/errors/reservations.errors';
import { BookReservationNotFound, InvalidDateFormat } from '@controllers/errors/controllers.errors';
import {
  BookReservationModel,
  BookReservationsQueryDto,
  BookReservationsResponse,
  CreateBookReservationDto,
} from './book-reservations.models';

@ApiTags('Book')
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
  @ApiBadRequestResponse({
    description: 'Невалидные query-параметры',
    content: {
      'application/json': {
        examples: {
          [InvalidDateFormat.message]: {
            value: { error: InvalidDateFormat },
          },
        },
      },
    },
  })
  async getReservations(
    @Query() query: BookReservationsQueryDto,
  ): Promise<BookReservationsResponse> {
    const page_number = query.page_number ?? 1;
    const page_size = query.page_size ?? 20;

    const { items, total_entries } = await this.service.findAll({
      book_id: query.book_id,
      reserved_at: query.reserved_at ? new Date(query.reserved_at) : undefined,
      page_number,
      page_size,
    });

    return {
      reservations: items.map(
        (item): BookReservationModel => ({
          id: item.id,
          book_id: item.book_id,
          name: item.name,
          reserved_at: item.reserved_at,
        }),
      ),
      page_number,
      page_size,
      total_entries,
      total_pages: Math.ceil(total_entries / page_size),
    };
  }

  @Post()
  @HttpCode(201)
  @ApiOperation({
    summary: 'Создание бронирования книги',
    description: 'Создаёт новое бронирование книги на указанную дату.',
  })
  @ApiCreatedResponse({
    type: BookReservationModel,
    description: 'Созданное бронирование книги',
  })
  @ApiBadRequestResponse({
    description:
      'Невалидные данные бронирования книги либо бронирование на прошедшую дату',
    content: {
      'application/json': {
        examples: {
          [InvalidDateFormat.message]: {
            value: { error: InvalidDateFormat },
          },
          [PastDateNotAllowed.message]: {
            value: { error: PastDateNotAllowed },
          },
        },
      },
    },
  })
  @ApiConflictResponse({
    description: 'Книга уже забронирована на указанную дату',
    content: {
      'application/json': {
        examples: {
          [BookAlreadyReserved.message]: { value: { error: BookAlreadyReserved } },
        },
      },
    },
  })
  async create(
    @Body() dto: CreateBookReservationDto,
  ): Promise<BookReservationModel> {
    const item = await this.service.create({
      book_id: dto.book_id,
      name: dto.name,
      reserved_at: new Date(dto.reserved_at),
    });

    return {
      id: item.id,
      book_id: item.book_id,
      name: item.name,
      reserved_at: item.reserved_at,
    };
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Удаление бронирования книги',
    description: 'Удаляет бронирование книги по его ID.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID бронирования книги' })
  @ApiNoContentResponse({ description: 'Бронирование удалено' })
  @ApiNotFoundResponse({
    description: 'Бронирование книги не найдено',
    content: {
      'application/json': {
        examples: {
          [BookReservationNotFound.message]: {
            value: { error: BookReservationNotFound },
          },
        },
      },
    },
  })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.service.remove(id);
  }
}
