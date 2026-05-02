import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiUnauthorizedResponse } from '@guards/auth.guard';
import { TableReservationsService } from '@services/table-reservations/table-reservations.service';
import {
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
  async getReservations(
    @Query() query: TableReservationsQueryDto,
  ): Promise<TableReservationsResponse> {
    const page_number = query.page_number ?? 1;
    const page_size = query.page_size ?? 20;

    const { items, total_entries } = await this.service.findAll({
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
