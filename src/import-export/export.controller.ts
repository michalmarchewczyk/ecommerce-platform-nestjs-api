import { Body, Controller, Get, Header, Res } from '@nestjs/common';
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
  @Header('Content-Type', 'application/json')
  async export(
    @Res({ passthrough: true }) res: Response,
    @Body() data: ExportDto,
  ) {
    res.header(
      'Content-Disposition',
      `attachment; filename="export-${new Date().toISOString()}.json"`,
    );
    return await this.exportService.export(data.data);
  }
}
