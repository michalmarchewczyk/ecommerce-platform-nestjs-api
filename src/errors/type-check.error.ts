import { ServiceError } from './service-error';

export class TypeCheckError extends ServiceError {
  constructor(name: string, type: string) {
    super();
    this.message = `${name} is not of type ${type}`;
  }
}
