import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { VoteModel } from '../models/vote.model';
import { SongModel } from '../models/song.model';
import UserModel from '../models/user.model';

@Injectable()
export class VoteService {
  constructor(
    @InjectModel(VoteModel)
    private voteModel: typeof VoteModel,
    @InjectModel(SongModel)
    private songModel: typeof SongModel,
  ) {}

  async voteSong(
    songId: number,
    userId: number,
    voteValue: 1 | -1,
  ): Promise<{ voteCount: number; userVote: number | null }> {
    // Validate songId
    if (!songId || songId <= 0) {
      throw new BadRequestException('Invalid songId provided');
    }

    // Check if song exists
    const song = await this.songModel.findByPk(songId);
    if (!song) {
      throw new BadRequestException(`Song with id ${songId} not found`);
    }

    // Check if user already voted for this song
    const existingVote = await this.voteModel.findOne({
      where: { songId, userId },
    });

    if (existingVote) {
      if (existingVote.voteValue === voteValue) {
        // Same vote - remove it (toggle)
        await existingVote.destroy();
      } else {
        // Different vote - update it
        await existingVote.update({
          voteValue,
          votedAt: new Date(),
        });
      }
    } else {
      // Create new vote
      await this.voteModel.create({
        songId,
        userId,
        voteValue,
        votedAt: new Date(),
      });
    }

    // Return updated vote counts with the user's current vote
    return this.getSongVotesWithUserVote(songId, userId);
  }

  async removeVote(
    songId: number,
    userId: number,
  ): Promise<{ voteCount: number; userVote: number | null }> {
    // Validate songId
    if (!songId || songId <= 0) {
      throw new BadRequestException('Invalid songId provided');
    }

    await this.voteModel.destroy({
      where: { songId, userId },
    });

    return this.getSongVotesWithUserVote(songId, userId);
  }

  async getSongVotes(
    songId: number,
  ): Promise<{ voteCount: number; userVote: number | null }> {
    // Validate songId
    if (!songId || songId <= 0) {
      throw new BadRequestException('Invalid songId provided');
    }

    const votes = await this.voteModel.findAll({
      where: { songId },
      include: [
        {
          model: UserModel,
          as: 'user',
          attributes: ['id', 'name'],
        },
      ],
    });

    // Calculate net vote count (upvotes - downvotes)
    const voteCount = votes.reduce((sum, vote) => sum + vote.voteValue, 0);

    return {
      voteCount,
      userVote: null, // This method doesn't know which user is requesting
    };
  }

  async getSongVotesWithUserVote(
    songId: number,
    userId: number,
  ): Promise<{ voteCount: number; userVote: number | null }> {
    if (!songId || songId <= 0) {
      throw new BadRequestException('Invalid songId provided');
    }

    if (!userId || userId <= 0) {
      throw new BadRequestException('Invalid userId provided');
    }

    try {
      const votes = await this.voteModel.findAll({
        where: { songId },
        attributes: ['id', 'userId', 'voteValue'],
      });

      let voteCount = 0;
      let userVote: number | null = null;

      // Process votes using Sequelize's toJSON() method for reliable data access
      for (const vote of votes) {
        const voteData = vote.toJSON();
        
        if (typeof voteData.voteValue === 'number') {
          voteCount += voteData.voteValue;
        }
        
        if (voteData.userId === userId) {
          userVote = voteData.voteValue;
        }
      }

      return {
        voteCount: isNaN(voteCount) ? 0 : voteCount,
        userVote,
      };
    } catch (error) {
      console.error(
        `[VoteService] Error getting votes for song ${songId}:`,
        error,
      );
      throw new BadRequestException('Failed to retrieve vote information');
    }
  }

  async getUserVoteForSong(
    songId: number,
    userId: number,
  ): Promise<number | null> {
    // Validate songId
    if (!songId || songId <= 0) {
      throw new BadRequestException('Invalid songId provided');
    }

    const vote = await this.voteModel.findOne({
      where: { songId, userId },
    });

    return vote ? vote.voteValue : null;
  }
}
