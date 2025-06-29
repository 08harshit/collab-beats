import { Controller, Get, Query, Logger } from '@nestjs/common';
import { SpotifyService } from './spotify.service';

@Controller('spotify')
export class SpotifyController {
  private readonly logger = new Logger(SpotifyController.name);
  constructor(private readonly spotifyService: SpotifyService) {
    this.logger.log('SpotifyController instantiated');
  }
  @Get('')
  test() {
    return 'test';
  }

  @Get('search')
  search(@Query('q') query: string) {
    console.log(query);
    return this.spotifyService.search(query);
  }
}
