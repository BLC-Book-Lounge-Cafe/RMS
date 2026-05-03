import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TableReservationsQueryDto {
  @ApiPropertyOptional({
    description: 'Фильтр по ID стола',
    example: 2,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  table_id?: number;

  @ApiPropertyOptional({
    description:
      'Фильтр по моменту времени (ISO-8601) — возвращает брони, активные в указанный момент: start_at <= active_at < end_at',
    example: '2026-05-15T14:30:00.000Z',
    format: 'date-time',
  })
  @IsOptional()
  @IsISO8601({}, { message: 'Неверный формат active_at, ожидается ISO-8601' })
  active_at?: string;

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

export class TableReservationModel {
  @ApiProperty({ description: 'ID бронирования', example: 1 })
  id: number;

  @ApiProperty({ description: 'ID стола', example: 2 })
  table_id: number;

  @ApiProperty({ example: 'Мария' })
  name: string;

  @ApiProperty({ example: '+79001234567' })
  phone: string;

  @ApiProperty({ format: 'date-time', description: 'Начало брони' })
  start_at: Date;

  @ApiProperty({ format: 'date-time', description: 'Конец брони' })
  end_at: Date;
}

export class TableReservationsResponse {
  @ApiProperty({ type: [TableReservationModel] })
  reservations: TableReservationModel[];

  @ApiProperty({ description: 'Номер текущей страницы', example: 1 })
  page_number: number;

  @ApiProperty({ description: 'Размер страницы', example: 20 })
  page_size: number;

  @ApiProperty({ description: 'Всего записей найдено', example: 42 })
  total_entries: number;

  @ApiProperty({ description: 'Всего страниц', example: 3 })
  total_pages: number;
}

export class CreateTableReservationDto {
  @ApiProperty({ description: 'ID стола', example: 2 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  table_id: number;

  @ApiProperty({ example: 'Мария', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: '+79001234567' })
  @IsString()
  @MaxLength(20)
  @Matches(/^\+7\d{10}$/, { message: 'Телефон должен быть в формате +7XXXXXXXXXX' })
  phone: string;

  @ApiProperty({ format: 'date-time', description: 'Начало брони (ISO-8601)' })
  @IsISO8601({}, { message: 'Неверный формат start_at, ожидается ISO-8601' })
  start_at: string;

  @ApiProperty({ format: 'date-time', description: 'Конец брони (ISO-8601). Должен быть позже start_at' })
  @IsISO8601({}, { message: 'Неверный формат end_at, ожидается ISO-8601' })
  end_at: string;
}
