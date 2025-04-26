import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import UserModel from '../models/user.model';
import { HttpModule } from '@nestjs/axios';
import { UserAuthModel } from '../models/user-auth.model';

@Module({
  imports: [SequelizeModule.forFeature([UserModel, UserAuthModel]), HttpModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [SequelizeModule],
})
export class UserModule {}
