import { Controller, Post, Delete, Param, Body, Get, BadRequestException } from '@nestjs/common';
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
    const parsedSongId = parseInt(songId, 10);
    
    if (isNaN(parsedSongId)) {
      throw new BadRequestException('Invalid songId provided');
    }

    const result = await this.voteService.voteSong(
      parsedSongId,
      body.userId,
      body.voteValue,
    );

    // Broadcast vote update to all room members
    this.roomGateway.broadcastRoomUpdate(
      body.roomId.toString(),
      'voteUpdated',
      { songId: parsedSongId, voteResult: result },
    );

    return result;
  }

  @Delete('song/:songId')
  async removeVote(
    @Param('songId') songId: string,
    @Body() body: { userId: number; roomId: number },
  ) {
    const parsedSongId = parseInt(songId, 10);
    
    if (isNaN(parsedSongId)) {
      throw new BadRequestException('Invalid songId provided');
    }

    const result = await this.voteService.removeVote(parsedSongId, body.userId);
    
    // Broadcast vote update to all room members
    this.roomGateway.broadcastRoomUpdate(
      body.roomId.toString(),
      'voteUpdated',
      { songId: parsedSongId, voteResult: result },
    );
    
    return result;
  }

  @Get('song/:songId')
  async getSongVotes(@Param('songId') songId: string) {
    const parsedSongId = parseInt(songId, 10);
    
    if (isNaN(parsedSongId)) {
      throw new BadRequestException('Invalid songId provided');
    }

    return this.voteService.getSongVotes(parsedSongId);
  }

  @Get('song/:songId/user/:userId')
  async getSongVotesWithUser(
    @Param('songId') songId: string,
    @Param('userId') userId: string,
  ) {
    const parsedSongId = parseInt(songId, 10);
    const parsedUserId = parseInt(userId, 10);
    
    if (isNaN(parsedSongId)) {
      throw new BadRequestException('Invalid songId provided');
    }
    
    if (isNaN(parsedUserId)) {
      throw new BadRequestException('Invalid userId provided');
    }

    return this.voteService.getSongVotesWithUserVote(parsedSongId, parsedUserId);
  }
} 