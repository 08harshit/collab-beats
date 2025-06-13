import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { QueueController } from './queue.controller';
import { QueueService } from './queue.service';
import { QueueModel } from '../models/queue.model';
import { RoomModel } from '../models/room.model';
import UserModel from '../models/user.model';
import { SongModel } from '../models/song.model';

@Module({
  imports: [
    SequelizeModule.forFeature([
      QueueModel,
      RoomModel,
      UserModel,
      SongModel,
    ]),
  ],
  controllers: [QueueController],
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {} 