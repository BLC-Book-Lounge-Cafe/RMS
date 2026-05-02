import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum ReservationStatusDto {
  pending = 'pending',
  confirmed = 'confirmed',
  cancelled = 'cancelled',
}

export class ReservationsQueryDto {
  @ApiPropertyOptional({
    description: 'Фильтр по статусу заявки',
    enum: ReservationStatusDto,
  })
  @IsOptional()
  @IsEnum(ReservationStatusDto)
  status?: ReservationStatusDto;

  @ApiPropertyOptional({
    description: 'Номер страницы',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page_number?: number = 1;

  @ApiPropertyOptional({
    description: 'Количество записей на странице',
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  page_size?: number = 20;
}

export class QuickReservationModel {
  @ApiProperty({ description: 'ID заявки', example: 1 })
  id: number;

  @ApiProperty({ enum: ReservationStatusDto })
  status: ReservationStatusDto;

  @ApiProperty({ example: 'Иван' })
  name: string;

  @ApiProperty({ example: '+79001234567' })
  phone: string;

  @ApiProperty({ format: 'date-time' })
  created_at: Date;
}

export class QuickReservationsResponse {
  @ApiProperty({ type: [QuickReservationModel] })
  reservations: QuickReservationModel[];

  @ApiProperty({ description: 'Номер текущей страницы', example: 1 })
  page_number: number;

  @ApiProperty({ description: 'Размер страницы', example: 20 })
  page_size: number;

  @ApiProperty({ description: 'Всего записей найдено', example: 42 })
  total_entries: number;

  @ApiProperty({ description: 'Всего страниц', example: 3 })
  total_pages: number;
}
