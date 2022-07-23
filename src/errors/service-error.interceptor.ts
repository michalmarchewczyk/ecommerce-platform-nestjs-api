import {
  BadRequestException,
  CallHandler,
  ConflictException,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
  NotFoundException,
} from '@nestjs/common';
import { catchError, Observable } from 'rxjs';
import { ServiceError } from './service-error';
import { NotFoundError } from './not-found.error';
import { ConflictError } from './conflict.error';

@Injectable()
export class ServiceErrorInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        if (error instanceof ServiceError) {
          throw ServiceErrorInterceptor.getError(error);
        }
        throw error;
      }),
    );
  }

  private static getError(error: ServiceError): HttpException {
    if (error instanceof NotFoundError) {
      return new NotFoundException([error.message]);
    } else if (error instanceof ConflictError) {
      return new ConflictException([error.message]);
    }
    return new BadRequestException([error.message]);
  }
}
