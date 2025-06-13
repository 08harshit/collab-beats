import {
  Column,
  Model,
  Table,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { RoomModel } from './room.model';
import { SongModel } from './song.model';
import UserModel from './user.model';

@Table({
  tableName: 'queues',
  timestamps: true,
})
export class QueueModel extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @ForeignKey(() => RoomModel)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  roomId: number;

  @ForeignKey(() => SongModel)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  songId: number;

  @ForeignKey(() => UserModel)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  userId: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  position: number;

  @Column({
    type: DataType.ENUM('queued', 'playing', 'played'),
    defaultValue: 'queued',
  })
  status: string;

  @Column(DataType.DATE)
  addedAt: Date;

  @BelongsTo(() => RoomModel)
  room: RoomModel;

  @BelongsTo(() => SongModel)
  song: SongModel;

  @BelongsTo(() => UserModel)
  user: UserModel;
} 