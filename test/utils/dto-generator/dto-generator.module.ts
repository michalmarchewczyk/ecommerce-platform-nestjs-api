import { Module } from '@nestjs/common';
import { DtoGeneratorService } from './dto-generator.service';

@Module({
  providers: [DtoGeneratorService],
  exports: [DtoGeneratorService],
})
export class DtoGeneratorModule {}
