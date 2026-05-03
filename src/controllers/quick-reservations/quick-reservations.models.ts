import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
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
    description:
      'Фильтр по дате создания заявки (YYYY-MM-DD) — возвращает заявки, созданные в указанный день',
    example: '2026-05-03',
    format: 'date',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Неверный формат created_date, ожидается YYYY-MM-DD',
  })
  created_date?: string;

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

export class CreateQuickReservationDto {
  @ApiProperty({ example: 'Иван', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: '+79001234567' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @Matches(/^\+7\d{10}$/, { message: 'Телефон должен быть в формате +7XXXXXXXXXX' })
  phone: string;
}

export enum UpdateReservationStatusDto {
  confirmed = 'confirmed',
  cancelled = 'cancelled',
}

export class UpdateQuickReservationDto {
  @ApiProperty({
    description: 'Новый статус заявки',
    enum: UpdateReservationStatusDto,
  })
  @IsEnum(UpdateReservationStatusDto)
  status: UpdateReservationStatusDto;
}
