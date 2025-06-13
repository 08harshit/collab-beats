import { Controller, Get, Query } from '@nestjs/common';
import { SearchService, SearchResult } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('songs')
  async searchSongs(@Query('q') query: string): Promise<SearchResult> {
    if (!query) {
      return { items: [] };
    }
    return this.searchService.searchSongs(query);
  }
}
