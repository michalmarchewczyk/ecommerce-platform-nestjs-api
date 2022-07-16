import { TestUsersModule } from './test-users/test-users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TestUsersService } from './test-users/test-users.service';
import configuration from '../../src/config/configuration';

const setup = async () => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        ignoreEnvFile: true,
        isGlobal: true,
        load: [configuration],
      }),
      TypeOrmModule.forRootAsync({
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          type: 'postgres',
          host: configService.get<string>('postgres.host'),
          port: configService.get<number>('postgres.port'),
          username: configService.get<string>('postgres.username'),
          password: configService.get<string>('postgres.password'),
          database: configService.get<string>('postgres.database'),
          entities: [],
          synchronize: true,
          autoLoadEntities: true,
          keepConnectionAlive: true,
          dropSchema: true,
        }),
        inject: [ConfigService],
      }),
      TestUsersModule,
    ],
  }).compile();

  const testUsers = moduleFixture.get<TestUsersService>(TestUsersService);
  await testUsers.init();
};

export default setup;
