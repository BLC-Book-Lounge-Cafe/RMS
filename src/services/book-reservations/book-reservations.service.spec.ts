import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { BookReservationsModule } from '@modules/book-reservations.module';
import { BookReservationsService } from '@services/book-reservations/book-reservations.service';
import { DatabaseRmsClient } from '@clients/database/database-rms.client';

const TOMORROW = new Date();
TOMORROW.setUTCDate(TOMORROW.getUTCDate() + 1);
TOMORROW.setUTCHours(0, 0, 0, 0);

const DAY_AFTER_TOMORROW = new Date(TOMORROW);
DAY_AFTER_TOMORROW.setUTCDate(DAY_AFTER_TOMORROW.getUTCDate() + 1);

const YESTERDAY = new Date();
YESTERDAY.setUTCDate(YESTERDAY.getUTCDate() - 1);
YESTERDAY.setUTCHours(0, 0, 0, 0);

describe('book-reservations.service', () => {
  let module: TestingModule;
  let service: BookReservationsService;
  let db: DatabaseRmsClient;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        BookReservationsModule,
      ],
    }).compile();

    service = module.get<BookReservationsService>(BookReservationsService);
    db = module.get<DatabaseRmsClient>(DatabaseRmsClient);

    await module.init();
  });

  afterAll(() => module.close());

  afterEach(async () => {
    await db.getClient().book_reservation.deleteMany();
  });

  describe('create()', () => {
    it('должен создать бронирование книги на будущую дату', async () => {
      const result = await service.create({
        book_id: 1,
        name: 'Иван',
        reserved_at: TOMORROW,
      });

      expect(result).toMatchObject({
        book_id: 1,
        name: 'Иван',
        reserved_at: TOMORROW,
      });
      expect(result.id).toBeDefined();
      expect(typeof result.id).toBe('number');
    });

    it('должен выбросить BadRequestException, если дата в прошлом', async () => {
      await expect(
        service.create({
          book_id: 1,
          name: 'Иван',
          reserved_at: YESTERDAY,
        }),
      ).rejects.toMatchObject({
        response: { code: '535d1fb1-1c2b-41ec-b35d-10d88a886df4' },
      });
    });

    it('должен выбросить ConflictException, если книга уже забронирована на эту дату', async () => {
      await service.create({ book_id: 2, name: 'Иван', reserved_at: TOMORROW });

      await expect(
        service.create({ book_id: 2, name: 'Мария', reserved_at: TOMORROW }),
      ).rejects.toMatchObject({
        response: { code: '27eece6d-7477-430a-885f-76952181fee1' },
      });
    });

    it('должен позволить забронировать ту же книгу на другую дату', async () => {
      await service.create({ book_id: 3, name: 'Иван', reserved_at: TOMORROW });

      const result = await service.create({
        book_id: 3,
        name: 'Мария',
        reserved_at: DAY_AFTER_TOMORROW,
      });

      expect(result.book_id).toBe(3);
      expect(result.reserved_at).toStrictEqual(DAY_AFTER_TOMORROW);
    });
  });

  describe('findAll()', () => {
    it('должен вернуть пустой список при отсутствии записей', async () => {
      const result = await service.findAll({
        page_number: 1,
        page_size: 20,
      });

      expect(result).toStrictEqual({ items: [], total_entries: 0 });
    });

    it('должен вернуть список броней с пагинацией', async () => {
      await service.create({ book_id: 1, name: 'Иван', reserved_at: TOMORROW });
      await service.create({ book_id: 2, name: 'Мария', reserved_at: TOMORROW });

      const result = await service.findAll({
        page_number: 1,
        page_size: 20,
      });

      expect(result.total_entries).toBe(2);
      expect(result.items).toHaveLength(2);
    });

    it('должен фильтровать по book_id', async () => {
      await service.create({ book_id: 10, name: 'Иван', reserved_at: TOMORROW });
      await service.create({ book_id: 11, name: 'Мария', reserved_at: TOMORROW });

      const result = await service.findAll({
        book_id: 10,
        page_number: 1,
        page_size: 20,
      });

      expect(result.total_entries).toBe(1);
      expect(result.items[0].book_id).toBe(10);
    });

    it('должен фильтровать по reserved_at', async () => {
      await service.create({ book_id: 5, name: 'Иван', reserved_at: TOMORROW });
      await service.create({ book_id: 6, name: 'Мария', reserved_at: DAY_AFTER_TOMORROW });

      const result = await service.findAll({
        reserved_at: TOMORROW,
        page_number: 1,
        page_size: 20,
      });

      expect(result.total_entries).toBe(1);
      expect(result.items[0].book_id).toBe(5);
    });

    it('должен соблюдать постраничную навигацию', async () => {
      await service.create({ book_id: 1, name: 'Первый', reserved_at: TOMORROW });
      await service.create({ book_id: 2, name: 'Второй', reserved_at: TOMORROW });
      await service.create({ book_id: 3, name: 'Третий', reserved_at: TOMORROW });

      const page1 = await service.findAll({ page_number: 1, page_size: 2 });
      expect(page1.items).toHaveLength(2);
      expect(page1.total_entries).toBe(3);

      const page2 = await service.findAll({ page_number: 2, page_size: 2 });
      expect(page2.items).toHaveLength(1);
    });
  });

  describe('remove()', () => {
    it('должен удалить бронирование по id', async () => {
      const created = await service.create({
        book_id: 1,
        name: 'Иван',
        reserved_at: TOMORROW,
      });

      await service.remove(created.id);

      const record = await db.getClient().book_reservation.findUnique({
        where: { id: created.id },
      });
      expect(record).toBeNull();
    });

    it('должен выбросить NotFoundException, если бронирование не найдено', async () => {
      await expect(service.remove(999999)).rejects.toMatchObject({
        response: { code: 'a9f3c1e2-7d4b-4a8e-b5c6-2f8d3e1c7a9b' },
      });
    });
  });
});
