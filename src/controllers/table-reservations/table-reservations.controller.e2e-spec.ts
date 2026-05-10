import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '@/app.module';
import { AllExceptionsFilter } from '@filters/all-exceptions.filter';
import { validationException } from '@utils/validators';
import { DatabaseRmsClient } from '@clients/database/database-rms.client';
import { Unauthorized } from '@guards/guards.errors';
import { PastDateNotAllowed } from '@services/common/errors/reservations.errors';
import { TableMinDurationViolation, TableSlotConflict } from '@services/table-reservations/table-reservations.errors';
import {
  InvalidPhoneFormat,
  TableReservationNotFound,
  ValidationFailed,
} from '@controllers/errors/controllers.errors';

const API_KEY = process.env.RMS_API_KEY ?? 'local-dev-key';

function isoDatetime(hoursFromNow: number): string {
  return new Date(Date.now() + hoursFromNow * 60 * 60 * 1000).toISOString();
}

function isoDatetimePast(hoursAgo: number): string {
  return new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();
}

describe('table-reservations.controller (e2e)', () => {
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
    await db.getClient().table_reservation.deleteMany();
  });

  describe('POST /v1/tables', () => {
    it('должен вернуть 401, если Authorization не передан', async () => {
      return request(app.getHttpServer())
        .post('/v1/tables')
        .send({
          table_id: 1,
          name: 'Иван',
          phone: '+79001234567',
          start_at: isoDatetime(2),
          end_at: isoDatetime(4),
        })
        .expect(({ statusCode, body }: { statusCode: HttpStatus; body: any }) => {
          expect(statusCode).toBe(HttpStatus.UNAUTHORIZED);
          expect(body).toStrictEqual({ error: Unauthorized });
        });
    });

    it('должен вернуть 201 и созданное бронирование', async () => {
      const start_at = isoDatetime(2);
      const end_at = isoDatetime(4);

      const res = await request(app.getHttpServer())
        .post('/v1/tables')
        .set('Authorization', `Bearer ${API_KEY}`)
        .send({ table_id: 1, name: 'Иван', phone: '+79001234567', start_at, end_at });

      expect(res.statusCode).toBe(HttpStatus.CREATED);
      expect(res.body.id).toBeDefined();
      expect(res.body.table_id).toBe(1);
      expect(res.body.name).toBe('Иван');
      expect(res.body).not.toHaveProperty('created_at');

      const record = await db.getClient().table_reservation.findUnique({
        where: { id: res.body.id },
      });
      expect(record).not.toBeNull();
    });

    it('должен вернуть 400 ValidationFailed, если phone не передан', async () => {
      return request(app.getHttpServer())
        .post('/v1/tables')
        .set('Authorization', `Bearer ${API_KEY}`)
        .send({
          table_id: 1,
          name: 'Иван',
          start_at: isoDatetime(2),
          end_at: isoDatetime(4),
        })
        .expect(({ statusCode, body }: { statusCode: HttpStatus; body: any }) => {
          expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
          expect(body).toStrictEqual({ error: ValidationFailed });
        });
    });

    it('должен вернуть 400 InvalidPhoneFormat при неверном формате телефона', async () => {
      return request(app.getHttpServer())
        .post('/v1/tables')
        .set('Authorization', `Bearer ${API_KEY}`)
        .send({
          table_id: 1,
          name: 'Иван',
          phone: '12345',
          start_at: isoDatetime(2),
          end_at: isoDatetime(4),
        })
        .expect(({ statusCode, body }: { statusCode: HttpStatus; body: any }) => {
          expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
          expect(body).toStrictEqual({ error: InvalidPhoneFormat });
        });
    });

    it('должен вернуть 400 PastDateNotAllowed, если start_at в прошлом', async () => {
      return request(app.getHttpServer())
        .post('/v1/tables')
        .set('Authorization', `Bearer ${API_KEY}`)
        .send({
          table_id: 1,
          name: 'Иван',
          phone: '+79001234567',
          start_at: isoDatetimePast(2),
          end_at: isoDatetime(2),
        })
        .expect(({ statusCode, body }: { statusCode: HttpStatus; body: any }) => {
          expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
          expect(body).toStrictEqual({ error: PastDateNotAllowed });
        });
    });

    it('должен вернуть 409 TableMinDurationViolation, если продолжительность менее 1 часа', async () => {
      const start_at = isoDatetime(2);
      const end_at = new Date(Date.now() + 2 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString();

      return request(app.getHttpServer())
        .post('/v1/tables')
        .set('Authorization', `Bearer ${API_KEY}`)
        .send({ table_id: 1, name: 'Иван', phone: '+79001234567', start_at, end_at })
        .expect(({ statusCode, body }: { statusCode: HttpStatus; body: any }) => {
          expect(statusCode).toBe(HttpStatus.CONFLICT);
          expect(body).toStrictEqual({ error: TableMinDurationViolation });
        });
    });

    it('должен вернуть 409 TableSlotConflict при пересечении слотов', async () => {
      const start_at = isoDatetime(2);
      const end_at = isoDatetime(4);

      await request(app.getHttpServer())
        .post('/v1/tables')
        .set('Authorization', `Bearer ${API_KEY}`)
        .send({ table_id: 2, name: 'Иван', phone: '+79001234567', start_at, end_at });

      return request(app.getHttpServer())
        .post('/v1/tables')
        .set('Authorization', `Bearer ${API_KEY}`)
        .send({
          table_id: 2,
          name: 'Мария',
          phone: '+79007654321',
          start_at: isoDatetime(3),
          end_at: isoDatetime(5),
        })
        .expect(({ statusCode, body }: { statusCode: HttpStatus; body: any }) => {
          expect(statusCode).toBe(HttpStatus.CONFLICT);
          expect(body).toStrictEqual({ error: TableSlotConflict });
        });
    });
  });

  describe('GET /v1/tables', () => {
    it('должен вернуть 401, если Authorization не передан', async () => {
      return request(app.getHttpServer())
        .get('/v1/tables')
        .expect(({ statusCode, body }: { statusCode: HttpStatus; body: any }) => {
          expect(statusCode).toBe(HttpStatus.UNAUTHORIZED);
          expect(body).toStrictEqual({ error: Unauthorized });
        });
    });

    it('должен вернуть 200 и структуру с пагинацией', async () => {
      return request(app.getHttpServer())
        .get('/v1/tables')
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

    it('должен фильтровать по table_id', async () => {
      await request(app.getHttpServer())
        .post('/v1/tables')
        .set('Authorization', `Bearer ${API_KEY}`)
        .send({ table_id: 10, name: 'Иван', phone: '+79001234567', start_at: isoDatetime(2), end_at: isoDatetime(4) });

      await request(app.getHttpServer())
        .post('/v1/tables')
        .set('Authorization', `Bearer ${API_KEY}`)
        .send({ table_id: 11, name: 'Мария', phone: '+79007654321', start_at: isoDatetime(6), end_at: isoDatetime(8) });

      return request(app.getHttpServer())
        .get('/v1/tables')
        .set('Authorization', `Bearer ${API_KEY}`)
        .query({ table_id: 10 })
        .expect(({ statusCode, body }: { statusCode: HttpStatus; body: any }) => {
          expect(statusCode).toBe(HttpStatus.OK);
          expect(body.total_entries).toBe(1);
          expect(body.reservations[0].table_id).toBe(10);
        });
    });
  });

  describe('DELETE /v1/tables/:id', () => {
    it('должен вернуть 401, если Authorization не передан', async () => {
      return request(app.getHttpServer())
        .delete('/v1/tables/1')
        .expect(({ statusCode, body }: { statusCode: HttpStatus; body: any }) => {
          expect(statusCode).toBe(HttpStatus.UNAUTHORIZED);
          expect(body).toStrictEqual({ error: Unauthorized });
        });
    });

    it('должен вернуть 204 при успешном удалении', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/v1/tables')
        .set('Authorization', `Bearer ${API_KEY}`)
        .send({ table_id: 1, name: 'Иван', phone: '+79001234567', start_at: isoDatetime(2), end_at: isoDatetime(4) });

      return request(app.getHttpServer())
        .delete(`/v1/tables/${body.id}`)
        .set('Authorization', `Bearer ${API_KEY}`)
        .expect(({ statusCode }: { statusCode: HttpStatus }) => {
          expect(statusCode).toBe(HttpStatus.NO_CONTENT);
        });
    });

    it('должен вернуть 404 TableReservationNotFound, если бронирование не найдено', async () => {
      return request(app.getHttpServer())
        .delete('/v1/tables/999999')
        .set('Authorization', `Bearer ${API_KEY}`)
        .expect(({ statusCode, body }: { statusCode: HttpStatus; body: any }) => {
          expect(statusCode).toBe(HttpStatus.NOT_FOUND);
          expect(body).toStrictEqual({ error: TableReservationNotFound });
        });
    });
  });
});
