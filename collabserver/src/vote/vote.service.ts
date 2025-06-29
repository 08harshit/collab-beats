import { Injectable } from '@nestjs/common';
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

    // Return updated vote counts
    return this.getSongVotes(songId);
  }

  async removeVote(
    songId: number,
    userId: number,
  ): Promise<{ voteCount: number; userVote: number | null }> {
    await this.voteModel.destroy({
      where: { songId, userId },
    });

    return this.getSongVotes(songId);
  }

  async getSongVotes(
    songId: number,
  ): Promise<{ voteCount: number; userVote: number | null }> {
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
      userVote: null, // Will be populated by the client when needed
    };
  }

  async getUserVoteForSong(
    songId: number,
    userId: number,
  ): Promise<number | null> {
    const vote = await this.voteModel.findOne({
      where: { songId, userId },
    });

    return vote ? vote.voteValue : null;
  }
} 