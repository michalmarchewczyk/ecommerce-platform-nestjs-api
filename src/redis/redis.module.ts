import { Module } from '@nestjs/common';
import { REDIS_CLIENT } from './redis.constants';
import * as Redis from 'redis';
import { ConfigService } from '@nestjs/config';

@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (configService: ConfigService) =>
        Redis.createClient({
          host: configService.get<string>('redis.host'),
          port: configService.get<number>('redis.port'),
        }),
      inject: [ConfigService],
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
