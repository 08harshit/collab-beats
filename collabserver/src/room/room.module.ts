import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { RoomService } from './room.service';
import { RoomController } from './room.controller';
import { RoomModel } from '../models/room.model';
import { RoomMemberModel } from '../models/room-member.model';
import { RoomGateway } from './room.gateway';
import { SongModel } from '../models/song.model';
import { SpotifyModule } from '../spotify/spotify.module';
import { VoteModel } from '../models/vote.model';
import { PlaybackStateModel } from '../models/playback-state.model';
import { MessageModel } from '../models/message.model';

@Module({
  imports: [
    SequelizeModule.forFeature([
      RoomModel,
      RoomMemberModel,
      SongModel,
      VoteModel,
      PlaybackStateModel,
      MessageModel,
    ]),
    SpotifyModule,
  ],
  controllers: [RoomController],
  providers: [RoomService, RoomGateway],
})
export class RoomModule {}
