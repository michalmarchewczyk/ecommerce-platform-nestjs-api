import {
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
  ApiForbiddenResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/models/role.enum';
import { ImportService } from './import.service';
import { fileBodySchema } from '../local-files/models/file-body.schema';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';

@ApiTags('import-export')
@Controller('import')
@Roles(Role.Admin)
@ApiUnauthorizedResponse({ description: 'User is not logged in' })
@ApiForbiddenResponse({ description: 'User is not admin' })
export class ImportController {
  constructor(private importService: ImportService) {}

  @Post('')
  @ApiBody({ schema: fileBodySchema })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
    }),
  )
  async import(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: 'application/json' })],
      }),
    )
    file: Express.Multer.File,
  ) {
    return await this.importService.import(file.buffer.toString('utf-8'));
  }
}
