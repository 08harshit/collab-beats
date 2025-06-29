import { Module, forwardRef } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { VoteService } from './vote.service';
import { VoteController } from './vote.controller';
import { VoteModel } from '../models/vote.model';
import { SongModel } from '../models/song.model';
import UserModel from '../models/user.model';
import { RoomModule } from '../room/room.module';

@Module({
  imports: [
    SequelizeModule.forFeature([VoteModel, SongModel, UserModel]),
    forwardRef(() => RoomModule), // Use forwardRef to resolve circular dependency
  ],
  controllers: [VoteController],
  providers: [VoteService],
  exports: [VoteService, SequelizeModule],
})
export class VoteModule {} 