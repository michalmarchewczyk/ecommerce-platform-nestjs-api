import { Body, Controller, Get, Res } from '@nestjs/common';
import {
  ApiForbiddenResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/models/role.enum';
import { ExportService } from './export.service';
import { Response } from 'express';
import { ExportDto } from './dto/export.dto';

@ApiTags('import-export')
@Controller('export')
@Roles(Role.Admin)
@ApiUnauthorizedResponse({ description: 'User is not logged in' })
@ApiForbiddenResponse({ description: 'User is not admin' })
export class ExportController {
  constructor(private exportService: ExportService) {}

  @Get('')
  async export(
    @Res({ passthrough: true }) res: Response,
    @Body() data: ExportDto,
  ) {
    const ext = data.format === 'csv' ? 'tar.gz' : 'json';
    const contentType =
      data.format === 'csv' ? 'application/gzip' : 'application/json';
    res.header('Content-Type', contentType);
    res.header(
      'Content-Disposition',
      `attachment; filename="export-${new Date().toISOString()}.${ext}"`,
    );
    return await this.exportService.export(data.data, data.format);
  }
}