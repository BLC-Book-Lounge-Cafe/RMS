import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { InvalidPhoneFormat } from '@controllers/errors/controllers.errors';

const PHONE_REGEX = /^\+7\d{10}$/;
const MAX_LENGTH = 20;

@ValidatorConstraint({ name: 'isValidPhone', async: false })
class IsValidPhoneConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return (
      typeof value === 'string' &&
      value.length > 0 &&
      value.length <= MAX_LENGTH &&
      PHONE_REGEX.test(value)
    );
  }

  defaultMessage(args: ValidationArguments): string {
    const value = args.value;
    if (value === undefined || value === null || value === '') {
      return 'phone is required';
    }
    return JSON.stringify(InvalidPhoneFormat);
  }
}

export function IsValidPhone(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidPhoneConstraint,
    });
  };
}
