import {
  Column,
  Model,
  Table,
  DataType,
  HasMany,
  BelongsToMany,
  HasOne,
} from 'sequelize-typescript';
import { Provider } from './interfaces';
import { RoomMemberModel } from './room-member.model';
import { RoomModel } from './room.model';
import { VoteModel } from './vote.model';
import { UserAuthModel } from './user-auth.model';

@Table({
  tableName: 'users',
  timestamps: true,
})
export default class UserModel extends Model {
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: false,
  })
  declare email: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare avatarUrl: string;

  @Column({
    type: DataType.ENUM(...Object.values(Provider)),
    allowNull: false,
  })
  declare provider: Provider;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare providerId: string;

  @HasOne(() => UserAuthModel)
  declare authData: UserAuthModel;

  @HasMany(() => RoomModel, {
    foreignKey: 'hostId',
    onDelete: 'CASCADE',
  })
  declare hostedRooms: RoomModel[];

  @BelongsToMany(() => RoomModel, {
    through: () => RoomMemberModel,
    foreignKey: 'userId',
  })
  declare rooms: RoomModel[];

  @HasMany(() => VoteModel, {
    foreignKey: 'userId',
    onDelete: 'CASCADE',
  })
  declare votes: VoteModel[];
}
