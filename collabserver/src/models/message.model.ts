import {
  Column,
  Model,
  Table,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { RoomModel } from './room.model';
import UserModel from './user.model';

@Table({
  tableName: 'messages',
  timestamps: true,
})
export class MessageModel extends Model {
  @ForeignKey(() => RoomModel)
  @Column(DataType.INTEGER)
  roomId: number;

  @ForeignKey(() => UserModel)
  @Column(DataType.INTEGER)
  userId: number;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  content: string;

  @Column(DataType.DATE)
  sentAt: Date;

  @BelongsTo(() => RoomModel)
  room: RoomModel;

  @BelongsTo(() => UserModel)
  user: UserModel;
}
