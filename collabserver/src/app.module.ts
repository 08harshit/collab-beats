import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'adrenaline',
      password: process.env.DB_PASSWORD || 'burger',
      database: process.env.DB_NAME || 'collabbeats',
      autoLoadModels: true,
      synchronize: true, // This will only update schema, not drop tables
      models: [__dirname + '/**/*.model.ts'],
    }),
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
