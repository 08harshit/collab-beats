import { Column, Model, Table, DataType } from 'sequelize-typescript';
import { User } from './user.interface';

@Table({
  tableName: 'users',
  timestamps: true,
})
export default class UserModel extends Model<User> {
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  username: string;

  @Column({ type: DataType.STRING })
  email: string;

  @Column({ type: DataType.STRING })
  avtarUrl: string;

  @Column({ type: DataType.STRING })
  provider: string;

  @Column({ type: DataType.STRING })
  providerId: string;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  isDeleted: boolean;
}
