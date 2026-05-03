import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IQuickReservationsRepository } from '@infrastructure/adapters/quick-reservations/quick-reservations.repository.interface';
import {
  CreateQuickReservationInput,
  FindQuickReservationsFilter,
  FindQuickReservationsResult,
  QuickReservationRecord,
  UpdateQuickReservationStatusInput,
} from './quick-reservations.types';
import {
  QuickReservationAlreadyResolved,
  QuickReservationNotFound,
} from './quick-reservations.errors';

@Injectable()
export class QuickReservationsService {
  constructor(
    @Inject('QUICK_RESERVATIONS_REPOSITORY')
    private readonly repository: IQuickReservationsRepository,
  ) {}

  findAll(filter: FindQuickReservationsFilter): Promise<FindQuickReservationsResult> {
    return this.repository.findAll(filter);
  }

  create(input: CreateQuickReservationInput): Promise<QuickReservationRecord> {
    return this.repository.create(input);
  }

  async updateStatus(
    input: UpdateQuickReservationStatusInput,
  ): Promise<QuickReservationRecord> {
    const existing = await this.repository.findById(input.id);

    if (!existing) {
      throw new NotFoundException(QuickReservationNotFound);
    }

    if (existing.status !== 'pending') {
      throw new ConflictException(QuickReservationAlreadyResolved);
    }

    return this.repository.updateStatus(input);
  }
}
