import { ServiceError } from './service-error';

export class NotFoundError extends ServiceError {
  constructor(
    entityName: string,
    searchProperty?: string,
    searchValue?: string,
  ) {
    super();
    if (searchProperty && searchValue) {
      this.message = `${entityName} with ${searchProperty}=${searchValue} not found`;
    } else {
      this.message = `${entityName} not found`;
    }
  }
}
