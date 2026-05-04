import { BadRequestException, ValidationError } from '@nestjs/common';
import { ValidationFailed } from '@controllers/errors/controllers.errors';

interface DomainError {
  code: string;
  message: string;
}

export function validationException(errors: ValidationError[]) {
  const structured = findStructuredError(errors);
  return new BadRequestException(structured ?? ValidationFailed);
}

function findStructuredError(errors: ValidationError[]): DomainError | null {
  for (const err of errors) {
    if (err.constraints) {
      for (const raw of Object.values(err.constraints)) {
        const parsed = tryParseDomainError(raw);
        if (parsed) return parsed;
      }
    }
    if (err.children?.length) {
      const child = findStructuredError(err.children);
      if (child) return child;
    }
  }
  return null;
}

function tryParseDomainError(raw: string): DomainError | null {
  try {
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof parsed.code === 'string' &&
      typeof parsed.message === 'string'
    ) {
      return { code: parsed.code, message: parsed.message };
    }
  } catch {
    return null;
  }
  return null;
}
