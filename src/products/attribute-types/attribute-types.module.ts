import { Module } from '@nestjs/common';
import { AttributeTypesService } from './attribute-types.service';
import { AttributeTypesController } from './attribute-types.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttributeType } from '../entities/attribute-type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AttributeType])],
  providers: [AttributeTypesService],
  controllers: [AttributeTypesController],
})
export class AttributeTypesModule {}
