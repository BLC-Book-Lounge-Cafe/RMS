import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class BookReservationsQueryDto {
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

  @ApiProperty({ format: 'date-time' })
  created_at: Date;
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
