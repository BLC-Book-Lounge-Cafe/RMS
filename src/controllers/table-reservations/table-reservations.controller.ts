import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
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
  InvalidDateFormat,
  InvalidIsoDateTimeFormat,
  InvalidPhoneFormat,
} from '@controllers/errors/controllers.errors';
import {
  CreateTableReservationDto,
  TableReservationModel,
  TableReservationsQueryDto,
  TableReservationsResponse,
  TableSlotModel,
  TableSlotsQueryDto,
  TableSlotsResponse,
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
    @Query() query: TableReservationsQueryDto,
  ): Promise<TableReservationsResponse> {
    const page_number = query.page_number ?? 1;
    const page_size = query.page_size ?? 20;

    const { items, total_entries } = await this.service.findAll({
      table_id: query.table_id,
      active_at: query.active_at
        ? new Date(`${query.active_at}T00:00:00.000Z`)
        : undefined,
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

  @Get(':table_id/slots')
  @ApiOperation({
    summary: 'Просмотр слотов стола',
    description:
      'Возвращает все часовые слоты на указанную дату для конкретного стола',
  })
  @ApiParam({
    name: 'table_id',
    type: Number,
    description: 'ID стола, для которого нужны слоты',
    example: 2,
  })
  @ApiOkResponse({
    type: TableSlotsResponse,
    description: 'Все слоты стола на запрошенную дату с пометкой занятости',
  })
  @ApiBadRequestResponse({
    description: 'Невалидные параметры пути или query',
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
  async getSlots(
    @Param('table_id', ParseIntPipe) table_id: number,
    @Query() query: TableSlotsQueryDto,
  ): Promise<TableSlotsResponse> {
    const slots = await this.service.listAvailability({
      table_id,
      date: new Date(`${query.date}T00:00:00.000Z`),
    });

    return {
      slots: slots.map(
        (slot): TableSlotModel => ({
          start_at: slot.start_at,
          end_at: slot.end_at,
          is_reserved: slot.is_reserved,
        }),
      ),
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
    description:
      'Невалидные данные бронирования стола либо бронирование на прошедшую дату',
    content: {
      'application/json': {
        examples: {
          [InvalidPhoneFormat.message]: {
            value: { error: InvalidPhoneFormat },
          },
          [InvalidIsoDateTimeFormat.message]: {
            value: { error: InvalidIsoDateTimeFormat },
          },
          [PastDateNotAllowed.message]: {
            value: { error: PastDateNotAllowed },
          },
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
