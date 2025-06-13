import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { QueueModel } from '../models/queue.model';
import { RoomModel } from '../models/room.model';
import UserModel from '../models/user.model';
import { SongModel } from '../models/song.model';
import { Op } from 'sequelize';

@Injectable()
export class QueueService {
  constructor(
    @InjectModel(QueueModel)
    private queueModel: typeof QueueModel,
    @InjectModel(RoomModel)
    private roomModel: typeof RoomModel,
    @InjectModel(UserModel)
    private userModel: typeof UserModel,
    @InjectModel(SongModel)
    private songModel: typeof SongModel,
  ) {}

  async addToQueue(roomId: number, songId: number, userId: number) {
    const room = await this.roomModel.findByPk(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    const user = await this.userModel.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get the current highest position in the queue
    const lastItem = await this.queueModel.findOne({
      where: { roomId },
      order: [['position', 'DESC']],
    });

    const position = lastItem ? lastItem.position + 1 : 1;

    // Create the queue item
    const queueItem = await this.queueModel.create({
      roomId,
      songId,
      userId,
      position,
      status: 'queued',
    });

    return queueItem;
  }

  async removeFromQueue(roomId: number, queueId: number, userId: number) {
    const queueItem = await this.queueModel.findOne({
      where: { id: queueId, roomId },
    });

    if (!queueItem) {
      throw new Error('Queue item not found');
    }

    // Check if user is authorized to remove the item
    if (queueItem.userId !== userId) {
      throw new Error('Not authorized to remove this item');
    }

    // Delete the queue item
    await queueItem.destroy();

    // Update positions of remaining items
    if (this.queueModel.sequelize) {
      await this.queueModel.update(
        { position: this.queueModel.sequelize.literal('position - 1') },
        {
          where: {
            roomId,
            position: {
              [Op.gt]: queueItem.position,
            },
          },
        },
      );
    }

    return { success: true };
  }

  async moveInQueue(
    roomId: number,
    fromPosition: number,
    toPosition: number,
    userId: number,
  ) {
    const queueItem = await this.queueModel.findOne({
      where: { roomId, position: fromPosition },
    });

    if (!queueItem) {
      throw new Error('Queue item not found');
    }

    // Check if user is authorized to move the item
    if (queueItem.userId !== userId) {
      throw new Error('Not authorized to move this item');
    }

    // Update positions
    if (this.queueModel.sequelize) {
      if (fromPosition < toPosition) {
        // Moving down
        await this.queueModel.update(
          { position: this.queueModel.sequelize.literal('position - 1') },
          {
            where: {
              roomId,
              position: {
                [Op.between]: [fromPosition + 1, toPosition],
              },
            },
          },
        );
      } else {
        // Moving up
        await this.queueModel.update(
          { position: this.queueModel.sequelize.literal('position + 1') },
          {
            where: {
              roomId,
              position: {
                [Op.between]: [toPosition, fromPosition - 1],
              },
            },
          },
        );
      }
    }

    // Update the moved item's position
    await queueItem.update({ position: toPosition });

    return { success: true };
  }

  async clearQueue(roomId: number, userId: number) {
    const room = await this.roomModel.findByPk(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    // Check if user is authorized to clear the queue
    if (room.hostId !== userId) {
      throw new Error('Only the room host can clear the queue');
    }

    // Delete all queue items for the room
    await this.queueModel.destroy({
      where: { roomId },
    });

    return { success: true };
  }

  async getQueue(roomId: number) {
    const queueItems = await this.queueModel.findAll({
      where: { roomId },
      include: [
        {
          model: this.songModel,
          as: 'song',
        },
        {
          model: this.userModel,
          as: 'user',
        },
      ],
      order: [['position', 'ASC']],
    });

    return queueItems;
  }
} 