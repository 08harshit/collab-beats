import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { RoomService } from './room.service';
import { RoomController } from './room.controller';
import { RoomModel } from '../models/room.model';
import { RoomMemberModel } from '../models/room-member.model';

@Module({
  imports: [SequelizeModule.forFeature([RoomModel, RoomMemberModel])],
  controllers: [RoomController],
  providers: [RoomService],
})
export class RoomModule {}
