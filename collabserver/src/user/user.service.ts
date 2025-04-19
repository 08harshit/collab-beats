import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import UserModel from './entities/user.model/user.model';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(UserModel)
    private userModel: typeof UserModel,
  ) {}

  // Now you can use this.userModel to query the database
  // Example:
  async findAll(): Promise<UserModel[]> {
    return this.userModel.findAll();
  }

  async create(userData: any): Promise<UserModel> {
    return this.userModel.create(userData);
  }
}
