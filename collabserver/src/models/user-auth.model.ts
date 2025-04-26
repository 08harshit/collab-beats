import {
  BelongsTo,
  Column,
  ForeignKey,
  Model,
  Table,
  DataType,
} from 'sequelize-typescript';
import UserModel from './user.model';

@Table({
  tableName: 'user_auth',
  timestamps: false,
})
export class UserAuthModel extends Model {
  @ForeignKey(() => UserModel)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare userId: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare accessToken: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare refreshToken: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  declare accessTokenExpiresAt: Date;

  @BelongsTo(() => UserModel)
  declare user: UserModel;
}
