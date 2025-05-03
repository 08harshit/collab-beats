import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { RoomModel } from '../models/room.model';
import { RoomMemberModel } from '../models/room-member.model';
import UserModel from '../models/user.model';

@Injectable()
export class RoomService {
  constructor(
    @InjectModel(RoomModel)
    private roomModel: typeof RoomModel,
    @InjectModel(RoomMemberModel)
    private roomMemberModel: typeof RoomMemberModel,
  ) {}

  async create(createRoomDto: CreateRoomDto) {
    try {
      const existingRoom = await this.roomModel.findOne({
        where: { code: createRoomDto.code },
      });

      if (existingRoom) {
        throw new Error('Room with this code already exists');
      }

      // Create room
      const room = await this.roomModel.create({
        ...createRoomDto,
        isActive: true,
      });

      // Add host as room member
      await this.roomMemberModel.create({
        roomId: room.id,
        userId: createRoomDto.hostId,
        isGuest: false,
        joinedAt: new Date(),
      });

      // Return room with members
      return this.findOne(room.id);
    } catch (error) {
      console.error('Error creating room:', error);
      throw error;
    }
  }

  async findAll() {
    return this.roomModel.findAll({
      include: [
        {
          model: UserModel,
          as: 'members',
          through: { attributes: [] },
        },
      ],
    });
  }

  async findOne(id: number) {
    return this.roomModel.findByPk(id, {
      include: [
        {
          model: UserModel,
          as: 'members',
          through: { attributes: [] },
        },
        {
          model: UserModel,
          as: 'host',
        },
      ],
    });
  }

  async findByCode(code: string) {
    return this.roomModel.findOne({
      where: { code },
      include: [
        {
          model: UserModel,
          as: 'members',
          through: { attributes: [] },
        },
        {
          model: UserModel,
          as: 'host',
        },
      ],
    });
  }

  async update(id: number, updateRoomDto: UpdateRoomDto) {
    const room = await this.roomModel.findByPk(id);
    if (!room) {
      throw new Error('Room not found');
    }
    return room.update(updateRoomDto);
  }

  async remove(id: number) {
    const room = await this.roomModel.findByPk(id);
    if (!room) {
      throw new Error('Room not found');
    }
    await room.destroy();
    return { id };
  }

  async addMember(roomId: number, userId: number, isGuest: boolean = false) {
    const room = await this.findOne(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    const existingMember = await this.roomMemberModel.findOne({
      where: { roomId, userId },
    });

    if (!existingMember) {
      await this.roomMemberModel.create({
        roomId,
        userId,
        isGuest,
        joinedAt: new Date(),
      });
    }

    return this.findOne(roomId);
  }
}
