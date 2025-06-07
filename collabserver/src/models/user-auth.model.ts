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
  timestamps: true,
})
export class UserAuthModel extends Model {
  @ForeignKey(() => UserModel)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare userId: number;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare accessToken: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare refreshToken: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  declare accessTokenExpiresAt: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  declare createdAt: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  declare updatedAt: Date;

  @BelongsTo(() => UserModel)
  declare user: UserModel;
}
