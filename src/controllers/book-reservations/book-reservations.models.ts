import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
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

export class BookReservationsQueryDto {
  @ApiPropertyOptional({
    description: 'Фильтр по ID книги',
    example: 3,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  book_id?: number;

  @ApiPropertyOptional({
    description: 'Фильтр по дате бронирования (YYYY-MM-DD)',
    example: '2026-05-15',
    format: 'date',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Неверный формат reserved_at, ожидается YYYY-MM-DD',
  })
  reserved_at?: string;

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

export class BookReservationModel {
  @ApiProperty({ description: 'ID бронирования', example: 1 })
  id: number;

  @ApiProperty({ description: 'ID книги', example: 3 })
  book_id: number;

  @ApiProperty({ example: 'Иван' })
  name: string;

  @ApiProperty({
    description: 'Дата бронирования (YYYY-MM-DD)',
    format: 'date',
    example: '2026-05-15',
  })
  reserved_at: Date;
}

export class BookReservationsResponse {
  @ApiProperty({ type: [BookReservationModel] })
  reservations: BookReservationModel[];

  @ApiProperty({ description: 'Номер текущей страницы', example: 1 })
  page_number: number;

  @ApiProperty({ description: 'Размер страницы', example: 20 })
  page_size: number;

  @ApiProperty({ description: 'Всего записей найдено', example: 42 })
  total_entries: number;

  @ApiProperty({ description: 'Всего страниц', example: 3 })
  total_pages: number;
}

export class CreateBookReservationDto {
  @ApiProperty({ description: 'ID книги', example: 3 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  book_id: number;

  @ApiProperty({ example: 'Иван', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Дата бронирования в формате YYYY-MM-DD',
    example: '2026-05-15',
    format: 'date',
  })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Неверный формат reserved_at, ожидается YYYY-MM-DD',
  })
  reserved_at: string;
}
