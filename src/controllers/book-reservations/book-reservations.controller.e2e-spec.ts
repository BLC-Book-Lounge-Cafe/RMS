import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '@/app.module';
import { AllExceptionsFilter } from '@filters/all-exceptions.filter';
import { validationException } from '@utils/validators';
import { DatabaseRmsClient } from '@clients/database/database-rms.client';
import { Unauthorized } from '@guards/guards.errors';
import {
  ValidationFailed,
  InvalidDateFormat,
  InvalidPhoneFormat,
  BookReservationNotFound,
} from '@controllers/errors/controllers.errors';
import { BookAlreadyReserved } from '@services/book-reservations/book-reservations.errors';
import { PastDateNotAllowed } from '@services/common/errors/reservations.errors';

const API_KEY = process.env.RMS_API_KEY ?? 'local-dev-key';

function tomorrowDateString(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function yesterdayDateString(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

describe('book-reservations.controller (e2e)', () => {
  let app: INestApplication;
  let db: DatabaseRmsClient;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();

    const httpAdapterHost = app.get<HttpAdapterHost>(HttpAdapterHost);
    app.useGlobalFilters(new AllExceptionsFilter(httpAdapterHost));
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        exceptionFactory: validationException,
      }),
    );

    db = app.get<DatabaseRmsClient>(DatabaseRmsClient);

    await app.init();
  });

  afterAll(() => app.close());

  afterEach(async () => {
    await db.getClient().book_reservation.deleteMany();
  });

  describe('POST /v1/books', () => {
    it('должен вернуть 401, если Authorization не передан', async () => {
      return request(app.getHttpServer())
        .post('/v1/books')
        .send({ book_id: 1, name: 'Иван', phone: '+79001234567', reserved_at: tomorrowDateString() })
        .expect(({ statusCode, body }: { statusCode: HttpStatus; body: any }) => {
          expect(statusCode).toBe(HttpStatus.UNAUTHORIZED);
          expect(body).toStrictEqual({ error: Unauthorized });
        });
    });

    it('должен вернуть 201 и созданное бронирование', async () => {
      const reserved_at = tomorrowDateString();

      const res = await request(app.getHttpServer())
        .post('/v1/books')
        .set('Authorization', `Bearer ${API_KEY}`)
        .send({ book_id: 1, name: 'Иван', phone: '+79001234567', reserved_at });

      expect(res.statusCode).toBe(HttpStatus.CREATED);
      expect(res.body.id).toBeDefined();
      expect(res.body.book_id).toBe(1);
      expect(res.body.name).toBe('Иван');
      expect(res.body.phone).toBe('+79001234567');
      expect(res.body).not.toHaveProperty('created_at');

      const record = await db.getClient().book_reservation.findUnique({
        where: { id: res.body.id },
      });
      expect(record).not.toBeNull();
    });

    it('должен вернуть 400 ValidationFailed, если name не передан', async () => {
      return request(app.getHttpServer())
        .post('/v1/books')
        .set('Authorization', `Bearer ${API_KEY}`)
        .send({ book_id: 1, phone: '+79001234567', reserved_at: tomorrowDateString() })
        .expect(({ statusCode, body }: { statusCode: HttpStatus; body: any }) => {
          expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
          expect(body).toStrictEqual({ error: ValidationFailed });
        });
    });

    it('должен вернуть 400 InvalidDateFormat, если reserved_at некорректного формата', async () => {
      return request(app.getHttpServer())
        .post('/v1/books')
        .set('Authorization', `Bearer ${API_KEY}`)
        .send({ book_id: 1, name: 'Иван', phone: '+79001234567', reserved_at: 'not-a-date' })
        .expect(({ statusCode, body }: { statusCode: HttpStatus; body: any }) => {
          expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
          expect(body).toStrictEqual({ error: InvalidDateFormat });
        });
    });

    it('должен вернуть 400 ValidationFailed, если phone не передан', async () => {
      return request(app.getHttpServer())
        .post('/v1/books')
        .set('Authorization', `Bearer ${API_KEY}`)
        .send({ book_id: 1, name: 'Иван', reserved_at: tomorrowDateString() })
        .expect(({ statusCode, body }: { statusCode: HttpStatus; body: any }) => {
          expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
          expect(body).toStrictEqual({ error: ValidationFailed });
        });
    });

    it('должен вернуть 400 InvalidPhoneFormat при неверном формате телефона', async () => {
      return request(app.getHttpServer())
        .post('/v1/books')
        .set('Authorization', `Bearer ${API_KEY}`)
        .send({ book_id: 1, name: 'Иван', phone: '12345', reserved_at: tomorrowDateString() })
        .expect(({ statusCode, body }: { statusCode: HttpStatus; body: any }) => {
          expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
          expect(body).toStrictEqual({ error: InvalidPhoneFormat });
        });
    });

    it('должен вернуть 400 PastDateNotAllowed, если дата в прошлом', async () => {
      return request(app.getHttpServer())
        .post('/v1/books')
        .set('Authorization', `Bearer ${API_KEY}`)
        .send({ book_id: 1, name: 'Иван', phone: '+79001234567', reserved_at: yesterdayDateString() })
        .expect(({ statusCode, body }: { statusCode: HttpStatus; body: any }) => {
          expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
          expect(body).toStrictEqual({ error: PastDateNotAllowed });
        });
    });

    it('должен вернуть 409 BookAlreadyReserved при повторном бронировании той же книги на ту же дату', async () => {
      const reserved_at = tomorrowDateString();

      await request(app.getHttpServer())
        .post('/v1/books')
        .set('Authorization', `Bearer ${API_KEY}`)
        .send({ book_id: 2, name: 'Иван', phone: '+79001234567', reserved_at });

      return request(app.getHttpServer())
        .post('/v1/books')
        .set('Authorization', `Bearer ${API_KEY}`)
        .send({ book_id: 2, name: 'Мария', phone: '+79007654321', reserved_at })
        .expect(({ statusCode, body }: { statusCode: HttpStatus; body: any }) => {
          expect(statusCode).toBe(HttpStatus.CONFLICT);
          expect(body).toStrictEqual({ error: BookAlreadyReserved });
        });
    });
  });

  describe('GET /v1/books', () => {
    it('должен вернуть 401, если Authorization не передан', async () => {
      return request(app.getHttpServer())
        .get('/v1/books')
        .expect(({ statusCode, body }: { statusCode: HttpStatus; body: any }) => {
          expect(statusCode).toBe(HttpStatus.UNAUTHORIZED);
          expect(body).toStrictEqual({ error: Unauthorized });
        });
    });

    it('должен вернуть 200 и структуру с пагинацией', async () => {
      return request(app.getHttpServer())
        .get('/v1/books')
        .set('Authorization', `Bearer ${API_KEY}`)
        .expect(({ statusCode, body }: { statusCode: HttpStatus; body: any }) => {
          expect(statusCode).toBe(HttpStatus.OK);
          expect(body).toMatchObject({
            reservations: expect.any(Array),
            page_number: 1,
            page_size: 20,
            total_entries: expect.any(Number),
            total_pages: expect.any(Number),
          });
        });
    });

    it('должен фильтровать по book_id', async () => {
      const reserved_at = tomorrowDateString();

      await request(app.getHttpServer())
        .post('/v1/books')
        .set('Authorization', `Bearer ${API_KEY}`)
        .send({ book_id: 50, name: 'Иван', phone: '+79001234567', reserved_at });

      await request(app.getHttpServer())
        .post('/v1/books')
        .set('Authorization', `Bearer ${API_KEY}`)
        .send({ book_id: 51, name: 'Мария', phone: '+79007654321', reserved_at });

      return request(app.getHttpServer())
        .get('/v1/books')
        .set('Authorization', `Bearer ${API_KEY}`)
        .query({ book_id: 50 })
        .expect(({ statusCode, body }: { statusCode: HttpStatus; body: any }) => {
          expect(statusCode).toBe(HttpStatus.OK);
          expect(body.total_entries).toBe(1);
          expect(body.reservations[0].book_id).toBe(50);
          expect(body.reservations[0].phone).toBe('+79001234567');
        });
    });

    it('должен вернуть 400 InvalidDateFormat при некорректном reserved_at в query', async () => {
      return request(app.getHttpServer())
        .get('/v1/books')
        .set('Authorization', `Bearer ${API_KEY}`)
        .query({ reserved_at: 'not-a-date' })
        .expect(({ statusCode, body }: { statusCode: HttpStatus; body: any }) => {
          expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
          expect(body).toStrictEqual({ error: InvalidDateFormat });
        });
    });
  });

  describe('DELETE /v1/books/:id', () => {
    it('должен вернуть 401, если Authorization не передан', async () => {
      return request(app.getHttpServer())
        .delete('/v1/books/1')
        .expect(({ statusCode, body }: { statusCode: HttpStatus; body: any }) => {
          expect(statusCode).toBe(HttpStatus.UNAUTHORIZED);
          expect(body).toStrictEqual({ error: Unauthorized });
        });
    });

    it('должен вернуть 204 при успешном удалении', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/v1/books')
        .set('Authorization', `Bearer ${API_KEY}`)
        .send({ book_id: 1, name: 'Иван', phone: '+79001234567', reserved_at: tomorrowDateString() });

      return request(app.getHttpServer())
        .delete(`/v1/books/${body.id}`)
        .set('Authorization', `Bearer ${API_KEY}`)
        .expect(({ statusCode }: { statusCode: HttpStatus }) => {
          expect(statusCode).toBe(HttpStatus.NO_CONTENT);
        });
    });

    it('должен вернуть 404 BookReservationNotFound, если бронирование не найдено', async () => {
      return request(app.getHttpServer())
        .delete('/v1/books/999999')
        .set('Authorization', `Bearer ${API_KEY}`)
        .expect(({ statusCode, body }: { statusCode: HttpStatus; body: any }) => {
          expect(statusCode).toBe(HttpStatus.NOT_FOUND);
          expect(body).toStrictEqual({ error: BookReservationNotFound });
        });
    });
  });
});
