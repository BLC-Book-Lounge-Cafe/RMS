import {
  CreateQuickReservationInput,
  FindQuickReservationsFilter,
  FindQuickReservationsResult,
  QuickReservationRecord,
  UpdateQuickReservationStatusInput,
} from '@services/quick-reservations/quick-reservations.types';

export interface IQuickReservationsRepository {
  findAll(filter: FindQuickReservationsFilter): Promise<FindQuickReservationsResult>;
  findById(id: number): Promise<QuickReservationRecord | null>;
  create(input: CreateQuickReservationInput): Promise<QuickReservationRecord>;
  updateStatus(input: UpdateQuickReservationStatusInput): Promise<QuickReservationRecord>;
}
