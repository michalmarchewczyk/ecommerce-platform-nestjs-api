import { ServiceError } from './service-error';

export class NotRelatedError extends ServiceError {
  constructor(entityName: string, entityName2: string) {
    super();
    this.message = `there is no relation between ${entityName} and ${entityName2}`;
  }
}
