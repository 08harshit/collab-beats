import {
  Column,
  Model,
  Table,
  DataType,
  HasMany,
  BelongsToMany,
  HasOne,
} from 'sequelize-typescript';
import { Provider, IUser } from './interfaces';
import { RoomMemberModel } from './room-member.model';
import { RoomModel } from './room.model';
import { VoteModel } from './vote.model';
import { UserAuthModel } from './user-auth.model'; // Import the new model

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
  providerId?: string;

  // 🧠 New relation to auth model (assuming one auth entry per user)
  @HasOne(() => UserAuthModel, {
    foreignKey: 'userId',
    onDelete: 'CASCADE',
  })
  authData: UserAuthModel;

  // 🎤 Rooms hosted by the user
  @HasMany(() => RoomModel, {
    foreignKey: 'hostId',
    onDelete: 'CASCADE',
  })
  hostedRooms: RoomModel[];

  // 🧑‍🤝‍🧑 Rooms the user is a member of
  @BelongsToMany(() => RoomModel, {
    through: () => RoomMemberModel,
    foreignKey: 'userId',
  })
  rooms: RoomModel[];

  // 🗳 Votes cast by the user
  @HasMany(() => VoteModel, {
    foreignKey: 'userId',
    onDelete: 'CASCADE',
  })
  votes: VoteModel[];
}
