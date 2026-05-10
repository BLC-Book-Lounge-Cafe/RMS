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
  InvalidPhoneFormat,
} from '@controllers/errors/controllers.errors';
import {
  QuickReservationAlreadyResolved,
  QuickReservationNotFound,
} from '@services/quick-reservations/quick-reservations.errors';

const API_KEY = process.env.RMS_API_KEY ?? 'local-dev-key';

describe('quick-reservations.controller (e2e)', () => {
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
    await db.getClient().quick_reservation.deleteMany();
  });

  describe('POST /v1/quicks', () => {
    it('должен вернуть 401, если Authorization не передан', async () => {
      return request(app.getHttpServer())
        .post('/v1/quicks')
        .send({ name: 'Иван', phone: '+79001234567' })
        .expect(({ statusCode, body }: { statusCode: HttpStatus; body: any }) => {
          expect(statusCode).toBe(HttpStatus.UNAUTHORIZED);
          expect(body).toStrictEqual({ error: Unauthorized });
        });
    });

    it('должен вернуть 201 и созданную заявку со статусом pending', async () => {
      return request(app.getHttpServer())
        .post('/v1/quicks')
        .set('Authorization', `Bearer ${API_KEY}`)
        .send({ name: 'Иван', phone: '+79001234567' })
        .expect(({ statusCode, body }: { statusCode: HttpStatus; body: any }) => {
          expect(statusCode).toBe(HttpStatus.CREATED);
          expect(body.id).toBeDefined();
          expect(body.status).toBe('pending');
          expect(body.name).toBe('Иван');
          expect(body.phone).toBe('+79001234567');
          expect(body).not.toHaveProperty('created_at');
        });
    });

    it('должен вернуть 400 ValidationFailed, если name не передан', async () => {
      return request(app.getHttpServer())
        .post('/v1/quicks')
        .set('Authorization', `Bearer ${API_KEY}`)
        .send({ phone: '+79001234567' })
        .expect(({ statusCode, body }: { statusCode: HttpStatus; body: any }) => {
          expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
          expect(body).toStrictEqual({ error: ValidationFailed });
        });
    });

    it('должен вернуть 400 ValidationFailed, если phone не передан', async () => {
      return request(app.getHttpServer())
        .post('/v1/quicks')
        .set('Authorization', `Bearer ${API_KEY}`)
        .send({ name: 'Иван' })
        .expect(({ statusCode, body }: { statusCode: HttpStatus; body: any }) => {
          expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
          expect(body).toStrictEqual({ error: ValidationFailed });
        });
    });

    it('должен вернуть 400 InvalidPhoneFormat при неверном формате телефона', async () => {
      return request(app.getHttpServer())
        .post('/v1/quicks')
        .set('Authorization', `Bearer ${API_KEY}`)
        .send({ name: 'Иван', phone: '89001234567' })
        .expect(({ statusCode, body }: { statusCode: HttpStatus; body: any }) => {
          expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
          expect(body).toStrictEqual({ error: InvalidPhoneFormat });
        });
    });
  });

  describe('PUT /v1/quicks/:id/status', () => {
    it('должен вернуть 401, если Authorization не передан', async () => {
      return request(app.getHttpServer())
        .put('/v1/quicks/1/status')
        .send({ status: 'confirmed' })
        .expect(({ statusCode, body }: { statusCode: HttpStatus; body: any }) => {
          expect(statusCode).toBe(HttpStatus.UNAUTHORIZED);
          expect(body).toStrictEqual({ error: Unauthorized });
        });
    });

    it('должен вернуть 200 при изменении статуса на confirmed', async () => {
      const { body: created } = await request(app.getHttpServer())
        .post('/v1/quicks')
        .set('Authorization', `Bearer ${API_KEY}`)
        .send({ name: 'Иван', phone: '+79001234567' });

      return request(app.getHttpServer())
        .put(`/v1/quicks/${created.id}/status`)
        .set('Authorization', `Bearer ${API_KEY}`)
        .send({ status: 'confirmed' })
        .expect(({ statusCode, body }: { statusCode: HttpStatus; body: any }) => {
          expect(statusCode).toBe(HttpStatus.OK);
          expect(body.status).toBe('confirmed');
          expect(body.id).toBe(created.id);
        });
    });

    it('должен вернуть 200 при изменении статуса на cancelled', async () => {
      const { body: created } = await request(app.getHttpServer())
        .post('/v1/quicks')
        .set('Authorization', `Bearer ${API_KEY}`)
        .send({ name: 'Иван', phone: '+79001234567' });

      return request(app.getHttpServer())
        .put(`/v1/quicks/${created.id}/status`)
        .set('Authorization', `Bearer ${API_KEY}`)
        .send({ status: 'cancelled' })
        .expect(({ statusCode, body }: { statusCode: HttpStatus; body: any }) => {
          expect(statusCode).toBe(HttpStatus.OK);
          expect(body.status).toBe('cancelled');
          expect(body.id).toBe(created.id);
        });
    });

    it('должен вернуть 404 QuickReservationNotFound, если заявка не найдена', async () => {
      return request(app.getHttpServer())
        .put('/v1/quicks/999999/status')
        .set('Authorization', `Bearer ${API_KEY}`)
        .send({ status: 'confirmed' })
        .expect(({ statusCode, body }: { statusCode: HttpStatus; body: any }) => {
          expect(statusCode).toBe(HttpStatus.NOT_FOUND);
          expect(body).toStrictEqual({ error: QuickReservationNotFound });
        });
    });

    it('должен вернуть 409 QuickReservationAlreadyResolved, если статус уже изменён', async () => {
      const { body: created } = await request(app.getHttpServer())
        .post('/v1/quicks')
        .set('Authorization', `Bearer ${API_KEY}`)
        .send({ name: 'Иван', phone: '+79001234567' });

      await request(app.getHttpServer())
        .put(`/v1/quicks/${created.id}/status`)
        .set('Authorization', `Bearer ${API_KEY}`)
        .send({ status: 'confirmed' });

      return request(app.getHttpServer())
        .put(`/v1/quicks/${created.id}/status`)
        .set('Authorization', `Bearer ${API_KEY}`)
        .send({ status: 'cancelled' })
        .expect(({ statusCode, body }: { statusCode: HttpStatus; body: any }) => {
          expect(statusCode).toBe(HttpStatus.CONFLICT);
          expect(body).toStrictEqual({ error: QuickReservationAlreadyResolved });
        });
    });
  });

  describe('GET /v1/quicks', () => {
    it('должен вернуть 401, если Authorization не передан', async () => {
      return request(app.getHttpServer())
        .get('/v1/quicks')
        .expect(({ statusCode, body }: { statusCode: HttpStatus; body: any }) => {
          expect(statusCode).toBe(HttpStatus.UNAUTHORIZED);
          expect(body).toStrictEqual({ error: Unauthorized });
        });
    });

    it('должен вернуть 200 и структуру с пагинацией', async () => {
      return request(app.getHttpServer())
        .get('/v1/quicks')
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

    it('должен фильтровать по статусу pending', async () => {
      await request(app.getHttpServer())
        .post('/v1/quicks')
        .set('Authorization', `Bearer ${API_KEY}`)
        .send({ name: 'Иван', phone: '+79001234567' });

      const { body: second } = await request(app.getHttpServer())
        .post('/v1/quicks')
        .set('Authorization', `Bearer ${API_KEY}`)
        .send({ name: 'Мария', phone: '+79007654321' });

      await request(app.getHttpServer())
        .put(`/v1/quicks/${second.id}/status`)
        .set('Authorization', `Bearer ${API_KEY}`)
        .send({ status: 'confirmed' });

      return request(app.getHttpServer())
        .get('/v1/quicks')
        .set('Authorization', `Bearer ${API_KEY}`)
        .query({ status: 'pending' })
        .expect(({ statusCode, body }: { statusCode: HttpStatus; body: any }) => {
          expect(statusCode).toBe(HttpStatus.OK);
          expect(body.total_entries).toBe(1);
          expect(body.reservations[0].status).toBe('pending');
        });
    });

    it('должен фильтровать по статусу confirmed', async () => {
      const { body: created } = await request(app.getHttpServer())
        .post('/v1/quicks')
        .set('Authorization', `Bearer ${API_KEY}`)
        .send({ name: 'Иван', phone: '+79001234567' });

      await request(app.getHttpServer())
        .put(`/v1/quicks/${created.id}/status`)
        .set('Authorization', `Bearer ${API_KEY}`)
        .send({ status: 'confirmed' });

      return request(app.getHttpServer())
        .get('/v1/quicks')
        .set('Authorization', `Bearer ${API_KEY}`)
        .query({ status: 'confirmed' })
        .expect(({ statusCode, body }: { statusCode: HttpStatus; body: any }) => {
          expect(statusCode).toBe(HttpStatus.OK);
          expect(body.total_entries).toBe(1);
          expect(body.reservations[0].status).toBe('confirmed');
        });
    });
  });
});
