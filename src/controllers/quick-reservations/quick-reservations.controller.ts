import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiUnauthorizedResponse } from '@guards/auth.guard';
import { QuickReservationsService } from '@services/quick-reservations/quick-reservations.service';
import {
  QuickReservationAlreadyResolved,
  QuickReservationNotFound,
} from '@services/quick-reservations/quick-reservations.errors';
import {
  CreateQuickReservationDto,
  QuickReservationModel,
  QuickReservationsResponse,
  ReservationStatusDto,
  ReservationsQueryDto,
  UpdateQuickReservationDto,
} from './quick-reservations.models';

@ApiTags('Быстрое бронирование')
@ApiBearerAuth('Bearer')
@ApiUnauthorizedResponse()
@Controller('v1/quicks')
export class QuickReservationsController {
  constructor(private readonly service: QuickReservationsService) {}

  @Get()
  @ApiOperation({
    summary: 'Просмотр заявок на быстрое бронирование',
    description:
      'Возвращает список заявок на быстрое бронирование (имя + телефон) с пагинацией. ' +
      'Поддерживает фильтрацию по статусу.',
  })
  @ApiOkResponse({
    type: QuickReservationsResponse,
    description: 'Список заявок на быстрое бронирование',
  })
  @ApiBadRequestResponse({
    description: 'Невалидные query-параметры',
    schema: {
      example: {
        message: ['Неверный формат created_date, ожидается YYYY-MM-DD'],
        error: 'Bad Request',
        statusCode: 400,
      },
    },
  })
  async getReservations(
    @Query() query: ReservationsQueryDto,
  ): Promise<QuickReservationsResponse> {
    const page_number = query.page_number ?? 1;
    const page_size = query.page_size ?? 20;

    const { items, total_entries } = await this.service.findAll({
      status: query.status,
      created_date: query.created_date ? new Date(query.created_date) : undefined,
      page_number,
      page_size,
    });

    return {
      reservations: items.map(
        (item): QuickReservationModel => ({
          id: item.id,
          status: item.status as ReservationStatusDto,
          name: item.name,
          phone: item.phone,
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
    summary: 'Создание заявки на быстрое бронирование',
    description:
      'Создаёт новую заявку на быстрое бронирование. Заявка создаётся в статусе pending ' +
      'и требует подтверждения администратором.',
  })
  @ApiCreatedResponse({
    type: QuickReservationModel,
    description: 'Созданная заявка на быстрое бронирование',
  })
  async create(
    @Body() dto: CreateQuickReservationDto,
  ): Promise<QuickReservationModel> {
    const item = await this.service.create({
      name: dto.name,
      phone: dto.phone,
    });

    return {
      id: item.id,
      status: item.status as ReservationStatusDto,
      name: item.name,
      phone: item.phone,
    };
  }

  @Put(':id/status')
  @ApiOperation({
    summary: 'Изменение статуса заявки на быстрое бронирование',
    description:
      'Переводит заявку из статуса pending в confirmed или cancelled. ' +
      'Если заявка уже обработана (статус не pending), возвращается 409 Conflict.',
  })
  @ApiOkResponse({
    type: QuickReservationModel,
    description: 'Обновлённая заявка на быстрое бронирование',
  })
  @ApiNotFoundResponse({
    description: 'Заявка на быстрое бронирование не найдена',
    content: {
      'application/json': {
        examples: {
          [QuickReservationNotFound.message]: {
            value: { error: QuickReservationNotFound },
          },
        },
      },
    },
  })
  @ApiConflictResponse({
    description: 'Статус заявки уже изменён и недоступен для редактирования',
    content: {
      'application/json': {
        examples: {
          [QuickReservationAlreadyResolved.message]: {
            value: { error: QuickReservationAlreadyResolved },
          },
        },
      },
    },
  })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateQuickReservationDto,
  ): Promise<QuickReservationModel> {
    const item = await this.service.updateStatus({
      id,
      status: dto.status,
    });

    return {
      id: item.id,
      status: item.status as ReservationStatusDto,
      name: item.name,
      phone: item.phone,
    };
  }
}
