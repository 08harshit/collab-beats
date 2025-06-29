import {
  Controller,
  Post,
  Delete,
  Param,
  Body,
  Get,
} from '@nestjs/common';
import { VoteService } from './vote.service';
import { RoomGateway } from '../room/room.gateway';

@Controller('vote')
export class VoteController {
  constructor(
    private readonly voteService: VoteService,
    private readonly roomGateway: RoomGateway,
  ) {}

  @Post('song/:songId')
  async voteSong(
    @Param('songId') songId: string,
    @Body() body: { userId: number; voteValue: 1 | -1; roomId: number },
  ) {
    const result = await this.voteService.voteSong(
      +songId,
      body.userId,
      body.voteValue,
    );
    
    // Broadcast vote update to all room members
    this.roomGateway.broadcastRoomUpdate(
      body.roomId.toString(),
      'voteUpdated',
      { songId: +songId, voteResult: result },
    );
    
    return result;
  }

  @Delete('song/:songId')
  async removeVote(
    @Param('songId') songId: string,
    @Body() body: { userId: number; roomId: number },
  ) {
    const result = await this.voteService.removeVote(+songId, body.userId);
    
    // Broadcast vote update to all room members
    this.roomGateway.broadcastRoomUpdate(
      body.roomId.toString(),
      'voteUpdated',
      { songId: +songId, voteResult: result },
    );
    
    return result;
  }

  @Get('song/:songId')
  async getSongVotes(@Param('songId') songId: string) {
    return this.voteService.getSongVotes(+songId);
  }
} 