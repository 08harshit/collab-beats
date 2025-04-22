import {
  Column,
  Model,
  Table,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import UserModel from './user.model';

@Table({
  tableName: 'user_auth',
  timestamps: true,
})
export class UserAuthModel extends Model {
  @ForeignKey(() => UserModel)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  userId: number;

  @BelongsTo(() => UserModel)
  user: UserModel;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  accessToken: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  refreshToken: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  accessTokenExpiresAt: Date;
}
