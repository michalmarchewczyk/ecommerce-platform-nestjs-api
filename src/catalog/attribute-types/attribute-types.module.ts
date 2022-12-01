import { Module } from '@nestjs/common';
import { AttributeTypesService } from './attribute-types.service';
import { AttributeTypesController } from './attribute-types.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttributeType } from './models/attribute-type.entity';
import { AttributeTypesExporter } from './attribute-types.exporter';
import { AttributeTypesImporter } from './attribute-types.importer';

@Module({
  imports: [TypeOrmModule.forFeature([AttributeType])],
  providers: [
    AttributeTypesService,
    AttributeTypesExporter,
    AttributeTypesImporter,
  ],
  controllers: [AttributeTypesController],
  exports: [
    AttributeTypesService,
    AttributeTypesExporter,
    AttributeTypesImporter,
  ],
})
export class AttributeTypesModule {}
