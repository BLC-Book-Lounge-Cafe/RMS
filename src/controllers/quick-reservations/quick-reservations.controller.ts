import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiUnauthorizedResponse } from '@guards/auth.guard';
import { QuickReservationsService } from '@services/quick-reservations/quick-reservations.service';
import {
  QuickReservationModel,
  QuickReservationsResponse,
  ReservationStatusDto,
  ReservationsQueryDto,
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
  async getReservations(
    @Query() query: ReservationsQueryDto,
  ): Promise<QuickReservationsResponse> {
    const page_number = query.page_number ?? 1;
    const page_size = query.page_size ?? 20;

    const { items, total_entries } = await this.service.findAll({
      status: query.status,
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
