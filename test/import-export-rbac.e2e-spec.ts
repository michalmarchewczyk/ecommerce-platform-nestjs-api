import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { Role } from '../src/users/models/role.enum';
import { TestUsersService } from './utils/test-users/test-users.service';
import { TestUsersModule } from './utils/test-users/test-users.module';
import { setupRbacTests } from './utils/setup-rbac-tests';

describe('Import/ExportController (e2e)', () => {
  let appRBAC: INestApplication;
  let testUsersRBAC: TestUsersService;

  beforeAll(async () => {
    const moduleFixtureRBAC: TestingModule = await Test.createTestingModule({
      imports: [AppModule, TestUsersModule],
    }).compile();

    appRBAC = moduleFixtureRBAC.createNestApplication();
    testUsersRBAC = moduleFixtureRBAC.get<TestUsersService>(TestUsersService);
    await appRBAC.init();
    await testUsersRBAC.init();
  });

  afterAll(async () => {
    await appRBAC.close();
  });

  describe(
    'RBAC for /import and /export',
    setupRbacTests(
      () => appRBAC,
      () => testUsersRBAC,
      [
        ['/import (POST)', [Role.Admin]],
        ['/export (POST)', [Role.Admin]],
      ],
    ),
  );
});
