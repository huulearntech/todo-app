import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';
import {
  CurrentUser,
  type JwtUser,
} from '../auth/decorators/current-user.decorator';
import type { SearchResultsDto } from '@todo/shared';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(
    @CurrentUser() user: JwtUser,
    @Query() query: SearchQueryDto,
  ): Promise<SearchResultsDto> {
    return this.searchService.search(user.id, query.q);
  }
}
