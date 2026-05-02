import {
  FindQuickReservationsFilter,
  FindQuickReservationsResult,
} from '@services/quick-reservations/quick-reservations.types';

export interface IQuickReservationsRepository {
  findAll(filter: FindQuickReservationsFilter): Promise<FindQuickReservationsResult>;
}
