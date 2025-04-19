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
  tableName: 'playback_states',
  timestamps: true,
})
export class PlaybackStateModel extends Model {
  @ForeignKey(() => RoomModel)
  @Column(DataType.INTEGER)
  roomId: number;

  @ForeignKey(() => SongModel)
  @Column(DataType.INTEGER)
  currentSongId: number;

  @Column(DataType.DATE)
  startedAt: Date;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  isPlaying: boolean;

  @ForeignKey(() => UserModel)
  @Column(DataType.INTEGER)
  controlledBy: number;

  @BelongsTo(() => RoomModel)
  room: RoomModel;

  @BelongsTo(() => SongModel)
  currentSong: SongModel;

  @BelongsTo(() => UserModel)
  controller: UserModel;
}
