import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { QuickReservationsModule } from '@modules/quick-reservations.module';
import { QuickReservationsService } from '@services/quick-reservations/quick-reservations.service';
import { DatabaseRmsClient } from '@clients/database/database-rms.client';

describe('quick-reservations.service', () => {
  let module: TestingModule;
  let service: QuickReservationsService;
  let db: DatabaseRmsClient;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        QuickReservationsModule,
      ],
    }).compile();

    service = module.get<QuickReservationsService>(QuickReservationsService);
    db = module.get<DatabaseRmsClient>(DatabaseRmsClient);

    await module.init();
  });

  afterAll(() => module.close());

  afterEach(async () => {
    await db.getClient().quick_reservation.deleteMany();
  });

  describe('create()', () => {
    it('должен создать заявку со статусом pending', async () => {
      const result = await service.create({
        name: 'Иван',
        phone: '+79001234567',
      });

      expect(result.id).toBeDefined();
      expect(typeof result.id).toBe('number');
      expect(result.status).toBe('pending');
      expect(result.name).toBe('Иван');
      expect(result.phone).toBe('+79001234567');
    });
  });

  describe('findAll()', () => {
    it('должен вернуть пустой список при отсутствии записей', async () => {
      const result = await service.findAll({ page_number: 1, page_size: 20 });
      expect(result).toStrictEqual({ items: [], total_entries: 0 });
    });

    it('должен вернуть список с пагинацией', async () => {
      await service.create({ name: 'Иван', phone: '+79001234567' });
      await service.create({ name: 'Мария', phone: '+79007654321' });

      const result = await service.findAll({ page_number: 1, page_size: 20 });

      expect(result.total_entries).toBe(2);
      expect(result.items).toHaveLength(2);
    });

    it('должен фильтровать по статусу pending', async () => {
      await service.create({ name: 'Иван', phone: '+79001234567' });
      const created = await service.create({ name: 'Мария', phone: '+79007654321' });
      await service.updateStatus({ id: created.id, status: 'confirmed' });

      const result = await service.findAll({ status: 'pending', page_number: 1, page_size: 20 });

      expect(result.total_entries).toBe(1);
      expect(result.items[0].status).toBe('pending');
    });

    it('должен фильтровать по статусу confirmed', async () => {
      await service.create({ name: 'Иван', phone: '+79001234567' });
      const created = await service.create({ name: 'Мария', phone: '+79007654321' });
      await service.updateStatus({ id: created.id, status: 'confirmed' });

      const result = await service.findAll({ status: 'confirmed', page_number: 1, page_size: 20 });

      expect(result.total_entries).toBe(1);
      expect(result.items[0].status).toBe('confirmed');
    });

    it('должен соблюдать постраничную навигацию', async () => {
      await service.create({ name: 'Первый', phone: '+79001234561' });
      await service.create({ name: 'Второй', phone: '+79001234562' });
      await service.create({ name: 'Третий', phone: '+79001234563' });

      const page1 = await service.findAll({ page_number: 1, page_size: 2 });
      expect(page1.items).toHaveLength(2);
      expect(page1.total_entries).toBe(3);

      const page2 = await service.findAll({ page_number: 2, page_size: 2 });
      expect(page2.items).toHaveLength(1);
    });
  });

  describe('updateStatus()', () => {
    it('должен перевести заявку из pending в confirmed', async () => {
      const created = await service.create({ name: 'Иван', phone: '+79001234567' });

      const result = await service.updateStatus({ id: created.id, status: 'confirmed' });

      expect(result.status).toBe('confirmed');
      expect(result.id).toBe(created.id);
    });

    it('должен перевести заявку из pending в cancelled', async () => {
      const created = await service.create({ name: 'Иван', phone: '+79001234567' });

      const result = await service.updateStatus({ id: created.id, status: 'cancelled' });

      expect(result.status).toBe('cancelled');
      expect(result.id).toBe(created.id);
    });

    it('должен выбросить NotFoundException, если заявка не найдена', async () => {
      await expect(
        service.updateStatus({ id: 999999, status: 'confirmed' }),
      ).rejects.toMatchObject({
        response: { code: '147a486a-df02-4841-adcd-e01c3c8637e3' },
      });
    });

    it('должен выбросить ConflictException, если статус уже изменён', async () => {
      const created = await service.create({ name: 'Иван', phone: '+79001234567' });
      await service.updateStatus({ id: created.id, status: 'confirmed' });

      await expect(
        service.updateStatus({ id: created.id, status: 'cancelled' }),
      ).rejects.toMatchObject({
        response: { code: 'c5225dac-d98e-4a88-b077-71c4c3006ce4' },
      });
    });
  });
});
