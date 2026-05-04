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
import {
  InvalidDateFormat,
  InvalidIsoDateTimeFormat,
  InvalidPhoneFormat,
} from '@controllers/errors/controllers.errors';

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
      'Фильтр по дате (UTC, формат YYYY-MM-DD) — возвращает все брони, пересекающие указанный день. Часы/минуты не учитываются.',
    example: '2026-05-15',
    format: 'date',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: JSON.stringify(InvalidDateFormat) })
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

export class TableSlotsQueryDto {
  @ApiProperty({
    description: 'Дата (UTC, формат YYYY-MM-DD), на которую нужно построить слоты',
    example: '2026-05-15',
    format: 'date',
  })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: JSON.stringify(InvalidDateFormat) })
  date: string;
}

export class TableSlotModel {
  @ApiProperty({ format: 'date-time', description: 'Начало слота' })
  start_at: Date;

  @ApiProperty({ format: 'date-time', description: 'Конец слота' })
  end_at: Date;

  @ApiProperty({
    description: 'Признак занятости слота: true — стол уже забронирован на это время',
    example: false,
  })
  is_reserved: boolean;
}

export class TableSlotsResponse {
  @ApiProperty({ type: [TableSlotModel], description: 'Все слоты на запрошенную дату' })
  slots: TableSlotModel[];
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
  @Matches(/^\+7\d{10}$/, { message: JSON.stringify(InvalidPhoneFormat) })
  phone: string;

  @ApiProperty({ format: 'date-time', description: 'Начало брони (ISO-8601)' })
  @IsISO8601({}, { message: JSON.stringify(InvalidIsoDateTimeFormat) })
  start_at: string;

  @ApiProperty({ format: 'date-time', description: 'Конец брони (ISO-8601). Должен быть позже start_at' })
  @IsISO8601({}, { message: JSON.stringify(InvalidIsoDateTimeFormat) })
  end_at: string;
}
