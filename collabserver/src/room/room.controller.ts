import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { RoomService } from './room.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { RoomGateway } from './room.gateway';

@Controller('room')
export class RoomController {
  constructor(
    private readonly roomService: RoomService,
    private readonly roomGateway: RoomGateway,
  ) {}

  @Post()
  async create(@Body() createRoomDto: CreateRoomDto) {
    const room = await this.roomService.create(createRoomDto);
    if (room) {
      this.roomGateway.broadcastRoomUpdate(
        room.id.toString(),
        'roomCreated',
        room,
      );
    }
    return room;
  }

  @Post(':id/join')
  async joinRoom(
    @Param('id') id: string,
    @Body() body: { userId: number; isGuest?: boolean },
  ) {
    const room = await this.roomService.addMember(
      +id,
      body.userId,
      body.isGuest,
    );
    if (room) {
      this.roomGateway.broadcastRoomUpdate(id, 'userJoined', room);
    }
    return room;
  }

  @Post(':id/songs')
  async addSongToQueue(
    @Param('id') id: string,
    @Body() body: { songId: number },
  ) {
    const room = await this.roomService.addSongToQueue(+id, body.songId);
    if (room) {
      this.roomGateway.broadcastRoomUpdate(id, 'songAdded', room);
    }
    return room;
  }

  @Get()
  findAll() {
    return this.roomService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roomService.findOne(+id);
  }

  @Get('code/:code')
  findByCode(@Param('code') code: string) {
    return this.roomService.findByCode(code);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateRoomDto: UpdateRoomDto) {
    const room = await this.roomService.update(+id, updateRoomDto);
    if (room) {
      this.roomGateway.broadcastRoomUpdate(id, 'roomUpdated', room);
    }
    return room;
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.roomService.remove(+id);
    this.roomGateway.broadcastRoomUpdate(id, 'roomDeleted', { id: result.id });
    return result;
  }
}
