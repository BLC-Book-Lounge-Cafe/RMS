import { Inject, Injectable } from '@nestjs/common';
import { IQuickReservationsRepository } from '@infrastructure/adapters/quick-reservations/quick-reservations.repository.interface';
import {
  FindQuickReservationsFilter,
  FindQuickReservationsResult,
} from './quick-reservations.types';

@Injectable()
export class QuickReservationsService {
  constructor(
    @Inject('QUICK_RESERVATIONS_REPOSITORY')
    private readonly repository: IQuickReservationsRepository,
  ) {}

  findAll(filter: FindQuickReservationsFilter): Promise<FindQuickReservationsResult> {
    return this.repository.findAll(filter);
  }
}
