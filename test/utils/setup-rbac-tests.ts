import { Role } from '../../src/users/models/role.enum';
import * as request from 'supertest';
import { parseEndpoint } from './parse-endpoint';
import { INestApplication } from '@nestjs/common';
import { TestUsersService } from './test-users/test-users.service';
import { describe, it, beforeAll, expect } from '@jest/globals';

export const setupRbacTests =
  (
    getApp: () => INestApplication,
    getTestUsers: () => TestUsersService,
    endpoints: [string, Role[]][],
  ) =>
  () => {
    const cookieHeaders: Record<string, any> = {};
    const availableRoles = Object.values(Role);

    let app: INestApplication;
    let testUsers: TestUsersService;

    beforeAll(async () => {
      app = getApp();
      testUsers = getTestUsers();
      for (const role of availableRoles) {
        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send({ ...testUsers.getCredentials(role) });
        cookieHeaders[role] = response.headers['set-cookie'];
      }
    });

    describe.each(endpoints)('%s', (endpoint, roles) => {
      const [url, method] = parseEndpoint(endpoint);

      const testRoles: [Role, boolean][] = availableRoles.map((role) => [
        role,
        roles.includes(role),
      ]);

      it.each(testRoles)(
        `${endpoint} can be accessed by %s: %p`,
        async (role, result) => {
          const response = await request(app.getHttpServer())
            [method](url)
            .set('Cookie', cookieHeaders[role]);
          if (result) {
            expect(response.status).not.toBe(403);
          } else {
            expect(response.status).toBe(403);
          }
        },
      );

      it(`${endpoint} can be accessed by guest: ${roles.includes(
        Role.Disabled,
      )}`, async () => {
        const response = await request(app.getHttpServer())[method](url);
        if (roles.includes(Role.Disabled)) {
          expect(response.status).not.toBe(401);
        } else {
          expect(response.status).toBe(401);
        }
      });
    });
  };
