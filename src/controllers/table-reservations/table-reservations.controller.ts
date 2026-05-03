import { Body, Controller, Get, HttpCode, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiUnauthorizedResponse } from '@guards/auth.guard';
import { TableReservationsService } from '@services/table-reservations/table-reservations.service';
import {
  TableMinDurationViolation,
  TableSlotConflict,
} from '@services/table-reservations/table-reservations.errors';
import { PastDateNotAllowed } from '@services/common/errors/reservations.errors';
import {
  CreateTableReservationDto,
  TableReservationModel,
  TableReservationsQueryDto,
  TableReservationsResponse,
} from './table-reservations.models';

@ApiTags('Бронирование столов')
@ApiBearerAuth('Bearer')
@ApiUnauthorizedResponse()
@Controller('v1/tables')
export class TableReservationsController {
  constructor(private readonly service: TableReservationsService) {}

  @Get()
  @ApiOperation({
    summary: 'Просмотр бронирований столов',
    description: 'Возвращает список бронирований столов с пагинацией.',
  })
  @ApiOkResponse({
    type: TableReservationsResponse,
    description: 'Список бронирований столов',
  })
  @ApiBadRequestResponse({
    description: 'Невалидные query-параметры',
    schema: {
      example: {
        message: ['Неверный формат active_at, ожидается ISO-8601'],
        error: 'Bad Request',
        statusCode: 400,
      },
    },
  })
  async getReservations(
    @Query() query: TableReservationsQueryDto,
  ): Promise<TableReservationsResponse> {
    const page_number = query.page_number ?? 1;
    const page_size = query.page_size ?? 20;

    const { items, total_entries } = await this.service.findAll({
      table_id: query.table_id,
      active_at: query.active_at ? new Date(query.active_at) : undefined,
      page_number,
      page_size,
    });

    return {
      reservations: items.map(
        (item): TableReservationModel => ({
          id: item.id,
          table_id: item.table_id,
          name: item.name,
          phone: item.phone,
          start_at: item.start_at,
          end_at: item.end_at,
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
    summary: 'Создание бронирования стола',
    description:
      'Создаёт новое бронирование стола. Если на указанный стол уже есть бронь, ' +
      'пересекающаяся по времени со start_at/end_at, возвращается 409 Conflict.',
  })
  @ApiCreatedResponse({
    type: TableReservationModel,
    description: 'Созданное бронирование стола',
  })
  @ApiBadRequestResponse({
    description: 'Бронирование на прошедшую дату невозможно',
    content: {
      'application/json': {
        examples: {
          [PastDateNotAllowed.message]: { value: { error: PastDateNotAllowed } },
        },
      },
    },
  })
  @ApiConflictResponse({
    description: 'Конфликт бронирования стола',
    content: {
      'application/json': {
        examples: {
          [TableSlotConflict.message]: {
            summary: TableSlotConflict.message,
            value: { error: TableSlotConflict },
          },
          [TableMinDurationViolation.message]: {
            summary: TableMinDurationViolation.message,
            value: { error: TableMinDurationViolation },
          },
        },
      },
    },
  })
  async create(
    @Body() dto: CreateTableReservationDto,
  ): Promise<TableReservationModel> {
    const item = await this.service.create({
      table_id: dto.table_id,
      name: dto.name,
      phone: dto.phone,
      start_at: new Date(dto.start_at),
      end_at: new Date(dto.end_at),
    });

    return {
      id: item.id,
      table_id: item.table_id,
      name: item.name,
      phone: item.phone,
      start_at: item.start_at,
      end_at: item.end_at,
    };
  }
}
