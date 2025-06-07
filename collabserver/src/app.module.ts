/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import UserModel from './models/user.model';
import { RoomModel } from './models/room.model';
import { RoomMemberModel } from './models/room-member.model';
import { SongModel } from './models/song.model';
import { VoteModel } from './models/vote.model';
import { PlaybackStateModel } from './models/playback-state.model';
import { MessageModel } from './models/message.model';
import { UserAuthModel } from './models/user-auth.model';
import { RoomModule } from './room/room.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        dialect: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: parseInt(configService.get<string>('DB_PORT', '5432')),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        autoLoadModels: true,
        synchronize: true,
        models: [
          UserModel,
          RoomModel,
          RoomMemberModel,
          SongModel,
          VoteModel,
          PlaybackStateModel,
          MessageModel,
          UserAuthModel,
        ],
      }),
    }),
    UserModule,
    RoomModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
