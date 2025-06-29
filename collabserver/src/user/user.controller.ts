import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('add-user')
  async createUser(@Body() userData: any) {
    console.log('Received user data:', userData);
    return this.userService.create(userData);
  }

  @Get('get-user-status')
  async getUsersStatus(@Query('id') userId: string) {
    return this.userService.getUsersStatus(userId); // Pass Spotify user ID as string
  }

  @Get()
  async findAll() {
    return this.userService.findAll();
  }
}
