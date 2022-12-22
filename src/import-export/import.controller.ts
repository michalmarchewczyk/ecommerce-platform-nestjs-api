import {
  Body,
  Controller,
  FileTypeValidator,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/models/role.enum';
import { ImportService } from './import.service';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { ImportDto } from './dto/import.dto';
import { ImportStatus } from './models/import-status.interface';

@ApiTags('import-export')
@Controller('import')
@Roles(Role.Admin)
@ApiUnauthorizedResponse({ description: 'User is not logged in' })
@ApiForbiddenResponse({ description: 'User is not admin' })
export class ImportController {
  constructor(private importService: ImportService) {}

  @Post('')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        clear: {
          type: 'string',
          nullable: true,
        },
        noImport: {
          type: 'string',
          nullable: true,
        },
      },
    },
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
    }),
  )
  @ApiCreatedResponse({
    type: ImportStatus,
    description: 'Import status',
  })
  async import(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({
            fileType: /(^application\/json$)|(^application\/(x-)?gzip$)/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() data: ImportDto,
  ) {
    return await this.importService.import(
      file.buffer,
      file.mimetype,
      data.clear === 'true',
      data.noImport === 'true',
    );
  }
}
