import {
  Column,
  Model,
  Table,
  DataType,
  BelongsTo,
  HasMany,
  BelongsToMany,
  HasOne,
} from 'sequelize-typescript';
import { IRoom } from './interfaces';
import UserModel from './user.model';
import { RoomMemberModel } from './room-member.model';
import { SongModel } from './song.model';
import { PlaybackStateModel } from './playback-state.model';
import { MessageModel } from './message.model';

@Table({
  tableName: 'rooms',
  timestamps: true,
})
export class RoomModel extends Model<IRoom> {
  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: false,
  })
  code: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  name?: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  hostId: number;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  isActive: boolean;

  // Relations
  @BelongsTo(() => UserModel, {
    foreignKey: 'hostId',
    onDelete: 'CASCADE',
  })
  host: UserModel;

  @BelongsToMany(() => UserModel, {
    through: () => RoomMemberModel,
    foreignKey: 'roomId',
  })
  members: UserModel[];

  @HasMany(() => SongModel, {
    foreignKey: 'roomId',
    onDelete: 'CASCADE',
  })
  songs: SongModel[];

  @HasOne(() => PlaybackStateModel, {
    foreignKey: 'roomId',
    onDelete: 'CASCADE',
  })
  playbackState: PlaybackStateModel;

  @HasMany(() => MessageModel, {
    foreignKey: 'roomId',
    onDelete: 'CASCADE',
  })
  messages: MessageModel[];
}
