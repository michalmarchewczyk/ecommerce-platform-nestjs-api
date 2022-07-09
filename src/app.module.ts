import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST,
      port: 5432,
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database:
        process.env.POSTGRES_DB +
        (process.env.NODE_ENV === 'test' ? '-test' : ''),
      entities: [],
      synchronize: true,
      autoLoadEntities: true,
      keepConnectionAlive: true,
      dropSchema: process.env.NODE_ENV === 'test',
    }),
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
