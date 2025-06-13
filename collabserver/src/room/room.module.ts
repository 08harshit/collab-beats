import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { RoomService } from './room.service';
import { RoomController } from './room.controller';
import { RoomModel } from '../models/room.model';
import { RoomMemberModel } from '../models/room-member.model';
import { RoomGateway } from './room.gateway';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [
    SequelizeModule.forFeature([RoomModel, RoomMemberModel]),
    QueueModule,
  ],
  controllers: [RoomController],
  providers: [RoomService, RoomGateway],
})
export class RoomModule {}
