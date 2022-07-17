import { Module } from '@nestjs/common';
import { RepositoryMockService } from './repository-mock.service';

@Module({
  providers: [RepositoryMockService],
})
export class RepositoryMockModule {}
