import {
  Inject,
  MiddlewareConsumer,
  Module,
  ValidationPipe,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './config/configuration';
import { APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import * as session from 'express-session';
import * as passport from 'passport';
import * as createRedisStore from 'connect-redis';
import { RedisClient } from 'redis';
import { RedisModule, REDIS_CLIENT } from './redis';
import { RolesGuard } from './auth/guards/roles.guard';
import { LocalFilesModule } from './local-files/local-files.module';
import { ServiceErrorInterceptor } from './errors/service-error.interceptor';
import { WishlistsModule } from './wishlists/wishlists.module';
import { SettingsModule } from './settings/settings.module';
import { schema } from './config/configuration.schema';
import { CatalogModule } from './catalog/catalog.module';
import { SalesModule } from './sales/sales.module';
import { FeaturesEnabledGuard } from './settings/guards/features-enabled.guard';
import { ImportExportModule } from './import-export/import-export.module';
import { PagesModule } from './pages/pages.module';
import { CartsModule } from './carts/carts.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      ignoreEnvFile: true,
      isGlobal: true,
      validationSchema: schema,
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
        dropSchema: false,
      }),
      inject: [ConfigService],
    }),
    RedisModule,
    AuthModule,
    UsersModule,
    SettingsModule,
    LocalFilesModule,
    CatalogModule,
    SalesModule,
    WishlistsModule,
    ImportExportModule,
    PagesModule,
    CartsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_PIPE,
      useFactory: () =>
        new ValidationPipe({
          whitelist: true,
          transform: true,
        }),
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: FeaturesEnabledGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ServiceErrorInterceptor,
    },
  ],
})
export class AppModule {
  constructor(
    private readonly configService: ConfigService,
    @Inject(REDIS_CLIENT) private readonly redisClient: RedisClient,
  ) {}

  configure(consumer: MiddlewareConsumer) {
    const RedisStore = createRedisStore(session);
    consumer
      .apply(
        session({
          store: new RedisStore({ client: this.redisClient }),
          secret: this.configService.get<string>('session.secret', ''),
          resave: false,
          saveUninitialized: false,
          cookie: {
            maxAge: this.configService.get<number>('session.maxAge'),
          },
        }),
        passport.initialize(),
        passport.session(),
      )
      .forRoutes('*');
  }
}
