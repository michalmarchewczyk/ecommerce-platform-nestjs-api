import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { PagesService } from './pages.service';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/models/role.enum';
import { PageCreateDto } from './dto/page-create.dto';
import { PageUpdateDto } from './dto/page-update.dto';
import { Page } from './models/page.entity';
import { PageGroup } from './models/page-group.entity';

@ApiTags('pages')
@Controller('pages')
export class PagesController {
  constructor(private pagesService: PagesService) {}

  @Get()
  @ApiOkResponse({ type: [Page], description: 'List of all pages' })
  async getPages() {
    return await this.pagesService.getPages();
  }

  @Get('groups')
  @ApiOkResponse({ type: [PageGroup], description: 'List of all page groups' })
  async getPageGroups() {
    return await this.pagesService.getPageGroups();
  }

  @Get(':id')
  @ApiNotFoundResponse({ description: 'Page not found' })
  @ApiOkResponse({ type: Page, description: 'Page with given id' })
  async getPage(@Param('id', ParseIntPipe) id: number) {
    return await this.pagesService.getPage(id);
  }

  @Post()
  @Roles(Role.Admin)
  @ApiUnauthorizedResponse({ description: 'User is not logged in' })
  @ApiForbiddenResponse({ description: 'User is not admin' })
  @ApiCreatedResponse({ type: Page, description: 'Page created' })
  @ApiBadRequestResponse({ description: 'Invalid page data' })
  async createPage(@Body() data: PageCreateDto) {
    return await this.pagesService.createPage(data);
  }

  @Patch(':id')
  @Roles(Role.Admin)
  @ApiUnauthorizedResponse({ description: 'User is not logged in' })
  @ApiForbiddenResponse({ description: 'User is not admin' })
  @ApiNotFoundResponse({ description: 'Page not found' })
  @ApiOkResponse({ type: Page, description: 'Page updated' })
  @ApiBadRequestResponse({ description: 'Invalid page data' })
  async updatePage(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: PageUpdateDto,
  ) {
    return await this.pagesService.updatePage(id, data);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @ApiUnauthorizedResponse({ description: 'User is not logged in' })
  @ApiForbiddenResponse({ description: 'User is not admin' })
  @ApiNotFoundResponse({ description: 'Page not found' })
  @ApiOkResponse({ type: Page, description: 'Page deleted' })
  async deletePage(@Param('id', ParseIntPipe) id: number) {
    await this.pagesService.deletePage(id);
  }
}
