import {
  Column,
  Model,
  Table,
  DataType,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';
import UserModel from './user.model';
import { RoomModel } from './room.model';
import { VoteModel } from './vote.model';
@Table({
  tableName: 'songs',
  timestamps: true,
})
export class SongModel extends Model {
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  title: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  artist: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  deezerId: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  duration: number;

  @Column(DataType.STRING)
  albumArtUrl: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  addedByUserId: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  roomId: number;

  @Column(DataType.DATE)
  addedAt: Date;

  @BelongsTo(() => UserModel, {
    foreignKey: 'addedByUserId',
    onDelete: 'SET NULL',
  })
  addedBy: UserModel;

  @BelongsTo(() => RoomModel, {
    foreignKey: 'roomId',
    onDelete: 'CASCADE',
  })
  room: RoomModel;

  @HasMany(() => VoteModel, {
    foreignKey: 'songId',
    onDelete: 'CASCADE',
  })
  votes: VoteModel[];
}
