import {
  Column,
  Model,
  Table,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import UserModel from './user.model';
import { SongModel } from './song.model';

@Table({
  tableName: 'votes',
  timestamps: true,
})
export class VoteModel extends Model {
  @ForeignKey(() => SongModel)
  @Column(DataType.INTEGER)
  songId: number;

  @ForeignKey(() => UserModel)
  @Column(DataType.INTEGER)
  userId: number;

  @Column({
    type: DataType.INTEGER,
    validate: {
      isIn: [[-1, 1]],
    },
  })
  voteValue: number;

  @Column(DataType.DATE)
  votedAt: Date;

  @BelongsTo(() => SongModel)
  song: SongModel;

  @BelongsTo(() => UserModel)
  user: UserModel;
}
