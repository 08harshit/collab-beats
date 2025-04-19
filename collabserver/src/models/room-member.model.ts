import {
  Column,
  Model,
  Table,
  DataType,
  ForeignKey,
} from 'sequelize-typescript';
import UserModel from './user.model';
import { RoomModel } from './room.model';

@Table({
  tableName: 'room_members',
  timestamps: true,
})
export class RoomMemberModel extends Model {
  @ForeignKey(() => RoomModel)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  roomId: number;

  @ForeignKey(() => UserModel)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  userId: number;

  @Column(DataType.DATE)
  joinedAt: Date;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  isGuest: boolean;
}
