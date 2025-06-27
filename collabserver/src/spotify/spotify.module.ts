import { Module } from '@nestjs/common';
import { SpotifyController } from './spotify.controller';
import { SpotifyService } from './spotify.service';
import { HttpModule } from '@nestjs/axios';
import { SequelizeModule } from '@nestjs/sequelize';
import { SongModel } from '../models/song.model';

@Module({
  imports: [HttpModule, SequelizeModule.forFeature([SongModel])],
  controllers: [SpotifyController],
  providers: [SpotifyService]
})
export class SpotifyModule {}
