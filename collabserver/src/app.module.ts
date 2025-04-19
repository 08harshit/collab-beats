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
      sync: { force: true }, // This will drop and recreate tables - BE CAREFUL in production!
      models: [
        UserModel,
        RoomModel,
        RoomMemberModel,
        SongModel,
        VoteModel,
        PlaybackStateModel,
        MessageModel,
      ],
    }),
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
