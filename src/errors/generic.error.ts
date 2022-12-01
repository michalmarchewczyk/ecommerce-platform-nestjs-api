import { ServiceError } from './service-error';

export class GenericError extends ServiceError {
  constructor(message: string) {
    super();
    this.message = message;
  }
}
