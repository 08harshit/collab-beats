import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { RoomModel } from '../models/room.model';
import { RoomMemberModel } from '../models/room-member.model';
import UserModel from '../models/user.model';
import { SongModel } from '../models/song.model';

@Injectable()
export class RoomService {
  constructor(
    @InjectModel(RoomModel)
    private roomModel: typeof RoomModel,
    @InjectModel(RoomMemberModel)
    private roomMemberModel: typeof RoomMemberModel,
    @InjectModel(SongModel)
    private songModel: typeof SongModel,
  ) {}

  async create(createRoomDto: CreateRoomDto): Promise<RoomModel | null> {
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

  async findAll(): Promise<RoomModel[]> {
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

  async findOne(id: number): Promise<RoomModel | null> {
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
        {
          model: SongModel,
          as: 'songs',
        },
      ],
    });
  }

  async findByCode(code: string): Promise<RoomModel | null> {
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
        {
          model: SongModel,
          as: 'songs',
        },
      ],
    });
  }

  async update(
    id: number,
    updateRoomDto: UpdateRoomDto,
  ): Promise<RoomModel> {
    const room = await this.roomModel.findByPk(id);
    if (!room) {
      throw new Error('Room not found');
    }
    return room.update(updateRoomDto);
  }

  async remove(id: number): Promise<{ id: number }> {
    const room = await this.roomModel.findByPk(id);
    if (!room) {
      throw new Error('Room not found');
    }
    await room.destroy();
    return { id };
  }

  async addSongToQueue(
    roomId: number,
    songData: {
      title: string;
      artist: string;
      spotifyId: string;
      duration: number;
      albumArtUrl: string;
    },
    userId: number,
  ): Promise<RoomModel | null> {
    console.log(
      `[RoomService] Adding song to queue for room ${roomId}:`,
      songData,
    );
    const room = await this.findOne(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    // Find or create the song with required fields
    const [song, created] = await this.songModel.findOrCreate({
      where: { spotifyId: songData.spotifyId },
      defaults: {
        title: songData.title,
        artist: songData.artist,
        platformId: songData.spotifyId,
        spotifyId: songData.spotifyId,
        duration: songData.duration,
        albumArtUrl: songData.albumArtUrl,
        addedByUserId: userId,
        roomId: roomId,
        addedAt: new Date(),
      },
    });

    console.log(
      `[RoomService] Song ${created ? 'created' : 'found'}:`,
      song.toJSON(),
    );

    const updatedRoom = await this.findOne(roomId);
    console.log(
      `[RoomService] Updated room with ${updatedRoom?.songs?.length || 0} songs:`,
      updatedRoom?.songs?.map((s) => s.title),
    );

    return updatedRoom;
  }

  async addMember(
    roomId: number,
    userId: number,
    isGuest: boolean = false,
  ): Promise<RoomModel | null> {
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
