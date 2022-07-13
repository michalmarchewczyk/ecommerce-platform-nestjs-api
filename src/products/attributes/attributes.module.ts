import { Module } from '@nestjs/common';
import { AttributesService } from './attributes.service';
import { AttributesController } from './attributes.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttributeType } from '../entities/attribute-type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AttributeType])],
  providers: [AttributesService],
  controllers: [AttributesController],
})
export class AttributesModule {}
