import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { QueueService } from './queue.service';

@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Post(':roomId')
  async addToQueue(
    @Param('roomId') roomId: string,
    @Body() body: { songId: number; userId: number },
  ) {
    return this.queueService.addToQueue(+roomId, body.songId, body.userId);
  }

  @Delete(':roomId/:queueId')
  async removeFromQueue(
    @Param('roomId') roomId: string,
    @Param('queueId') queueId: string,
    @Body() body: { userId: number },
  ) {
    return this.queueService.removeFromQueue(+roomId, +queueId, body.userId);
  }

  @Get(':roomId')
  async getQueue(@Param('roomId') roomId: string) {
    return this.queueService.getQueue(+roomId);
  }

  @Post(':roomId/:queueId/move')
  async moveInQueue(
    @Param('roomId') roomId: string,
    @Param('queueId') queueId: string,
    @Body() body: { newPosition: number; userId: number },
  ) {
    return this.queueService.moveInQueue(
      +roomId,
      +queueId,
      body.newPosition,
      body.userId,
    );
  }

  @Delete(':roomId')
  async clearQueue(
    @Param('roomId') roomId: string,
    @Body() body: { userId: number },
  ) {
    return this.queueService.clearQueue(+roomId, body.userId);
  }
}
