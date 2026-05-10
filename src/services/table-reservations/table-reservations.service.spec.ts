import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { TableReservationsModule } from '@modules/table-reservations.module';
import { TableReservationsService } from '@services/table-reservations/table-reservations.service';
import { DatabaseRmsClient } from '@clients/database/database-rms.client';

function futureDate(hoursFromNow: number): Date {
  return new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);
}

function pastDate(hoursAgo: number): Date {
  return new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
}

describe('table-reservations.service', () => {
  let module: TestingModule;
  let service: TableReservationsService;
  let db: DatabaseRmsClient;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TableReservationsModule,
      ],
    }).compile();

    service = module.get<TableReservationsService>(TableReservationsService);
    db = module.get<DatabaseRmsClient>(DatabaseRmsClient);

    await module.init();
  });

  afterAll(() => module.close());

  afterEach(async () => {
    await db.getClient().table_reservation.deleteMany();
  });

  describe('create()', () => {
    it('должен создать бронирование стола на будущее время', async () => {
      const start_at = futureDate(2);
      const end_at = futureDate(4);

      const result = await service.create({
        table_id: 1,
        name: 'Иван',
        phone: '+79001234567',
        start_at,
        end_at,
      });

      expect(result.id).toBeDefined();
      expect(result.table_id).toBe(1);
      expect(result.name).toBe('Иван');
      expect(result.start_at).toStrictEqual(start_at);
      expect(result.end_at).toStrictEqual(end_at);
    });

    it('должен выбросить BadRequestException, если дата начала в прошлом', async () => {
      await expect(
        service.create({
          table_id: 1,
          name: 'Иван',
          phone: '+79001234567',
          start_at: pastDate(2),
          end_at: futureDate(2),
        }),
      ).rejects.toMatchObject({
        response: { code: '535d1fb1-1c2b-41ec-b35d-10d88a886df4' },
      });
    });

    it('должен выбросить ConflictException, если продолжительность менее 1 часа', async () => {
      const start_at = futureDate(2);
      const end_at = new Date(start_at.getTime() + 30 * 60 * 1000);

      await expect(
        service.create({
          table_id: 1,
          name: 'Иван',
          phone: '+79001234567',
          start_at,
          end_at,
        }),
      ).rejects.toMatchObject({
        response: { code: 'f0e6afcf-1724-4de6-b5bb-37473a92a908' },
      });
    });

    it('должен выбросить ConflictException, если слот занят', async () => {
      const start_at = futureDate(2);
      const end_at = futureDate(4);

      await service.create({ table_id: 2, name: 'Иван', phone: '+79001234567', start_at, end_at });

      await expect(
        service.create({
          table_id: 2,
          name: 'Мария',
          phone: '+79007654321',
          start_at: futureDate(3),
          end_at: futureDate(5),
        }),
      ).rejects.toMatchObject({
        response: { code: 'de1331b1-3262-47e8-876f-4dd154e74551' },
      });
    });

    it('должен позволить смежные слоты (без пересечения)', async () => {
      const first_start = futureDate(2);
      const first_end = futureDate(4);
      const second_start = futureDate(4);
      const second_end = futureDate(6);

      await service.create({ table_id: 3, name: 'Иван', phone: '+79001234567', start_at: first_start, end_at: first_end });
      const result = await service.create({ table_id: 3, name: 'Мария', phone: '+79007654321', start_at: second_start, end_at: second_end });

      expect(result.id).toBeDefined();
    });
  });

  describe('findAll()', () => {
    it('должен вернуть пустой список при отсутствии записей', async () => {
      const result = await service.findAll({ page_number: 1, page_size: 20 });
      expect(result).toStrictEqual({ items: [], total_entries: 0 });
    });

    it('должен вернуть список с пагинацией', async () => {
      await service.create({ table_id: 1, name: 'Иван', phone: '+79001234567', start_at: futureDate(2), end_at: futureDate(4) });
      await service.create({ table_id: 2, name: 'Мария', phone: '+79007654321', start_at: futureDate(6), end_at: futureDate(8) });

      const result = await service.findAll({ page_number: 1, page_size: 20 });

      expect(result.total_entries).toBe(2);
      expect(result.items).toHaveLength(2);
    });

    it('должен фильтровать по table_id', async () => {
      await service.create({ table_id: 10, name: 'Иван', phone: '+79001234567', start_at: futureDate(2), end_at: futureDate(4) });
      await service.create({ table_id: 11, name: 'Мария', phone: '+79007654321', start_at: futureDate(6), end_at: futureDate(8) });

      const result = await service.findAll({ table_id: 10, page_number: 1, page_size: 20 });

      expect(result.total_entries).toBe(1);
      expect(result.items[0].table_id).toBe(10);
    });

    it('должен фильтровать по active_at — возвращать брони, активные в момент времени', async () => {
      const start_at = futureDate(2);
      const end_at = futureDate(4);
      await service.create({ table_id: 5, name: 'Иван', phone: '+79001234567', start_at, end_at });

      const active_at = futureDate(3);

      const result = await service.findAll({ table_id: 5, active_at, page_number: 1, page_size: 20 });

      expect(result.total_entries).toBe(1);
      expect(result.items[0].table_id).toBe(5);
    });

    it('должен соблюдать постраничную навигацию', async () => {
      await service.create({ table_id: 1, name: 'Первый', phone: '+79001234567', start_at: futureDate(2), end_at: futureDate(4) });
      await service.create({ table_id: 2, name: 'Второй', phone: '+79001234568', start_at: futureDate(5), end_at: futureDate(7) });
      await service.create({ table_id: 3, name: 'Третий', phone: '+79001234569', start_at: futureDate(8), end_at: futureDate(10) });

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
        table_id: 1,
        name: 'Иван',
        phone: '+79001234567',
        start_at: futureDate(2),
        end_at: futureDate(4),
      });

      await service.remove(created.id);

      const record = await db.getClient().table_reservation.findUnique({ where: { id: created.id } });
      expect(record).toBeNull();
    });

    it('должен выбросить NotFoundException, если бронирование не найдено', async () => {
      await expect(service.remove(999999)).rejects.toMatchObject({
        response: { code: 'c1e7a2f3-4b8d-4e9a-b6c5-8d3f1a2e7c4b' },
      });
    });
  });
});
