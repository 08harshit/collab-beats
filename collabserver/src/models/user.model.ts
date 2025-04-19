import {
  Column,
  Model,
  Table,
  DataType,
  HasMany,
  BelongsToMany,
} from 'sequelize-typescript';
import { Provider, IUser } from './interfaces';
import { RoomMemberModel } from './room-member.model';
import { RoomModel } from './room.model';
import { VoteModel } from './vote.model';
@Table({
  tableName: 'users',
  timestamps: true,
})
export default class UserModel extends Model<IUser> {
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name: string;

  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: false,
  })
  email: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  avatarUrl?: string;

  @Column({
    type: DataType.ENUM(...Object.values(Provider)),
    allowNull: false,
  })
  provider: Provider;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  deezerId?: string;

  // Relations with explicit foreign keys
  @HasMany(() => RoomModel, {
    foreignKey: 'hostId',
    onDelete: 'CASCADE',
  })
  hostedRooms: RoomModel[];

  @BelongsToMany(() => RoomModel, {
    through: () => RoomMemberModel,
    foreignKey: 'userId',
  })
  rooms: RoomModel[];

  @HasMany(() => VoteModel, {
    foreignKey: 'userId',
    onDelete: 'CASCADE',
  })
  votes: VoteModel[];
}
