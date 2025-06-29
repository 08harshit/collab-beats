import { Module } from '@nestjs/common';
import { SpotifyController } from './spotify.controller';
import { SpotifyService } from './spotify.service';
import { HttpModule } from '@nestjs/axios';
import { SequelizeModule } from '@nestjs/sequelize';
import { SongModel } from '../models/song.model';
import UserModel from '../models/user.model';
import { RoomModel } from '../models/room.model';
import { VoteModel } from '../models/vote.model';

@Module({
  imports: [
    HttpModule,
    SequelizeModule.forFeature([SongModel, UserModel, RoomModel, VoteModel]),
  ],
  controllers: [SpotifyController],
  providers: [SpotifyService],
})
export class SpotifyModule {}
