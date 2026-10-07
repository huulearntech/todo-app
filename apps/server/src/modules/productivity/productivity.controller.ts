import { Body, Controller, Get, Headers, Patch, Query } from '@nestjs/common';
import {
  CurrentUser,
  type JwtUser,
} from '@/src/modules/auth/decorators/current-user.decorator';
import { ProductivityService } from './productivity.service';
import { UpdateUserGoalDto } from './dto/update-user-goal.dto';

@Controller('productivity')
export class ProductivityController {
  constructor(private readonly productivityService: ProductivityService) {}

  @Get('goals')
  async getGoalProgress(
    @CurrentUser() user: JwtUser,
    @Headers('x-timezone') timezone?: string,
  ) {
    return this.productivityService.getGoalProgress(user.id, timezone);
  }

  @Patch('goals')
  async updateGoals(
    @CurrentUser() user: JwtUser,
    @Body() updateDto: UpdateUserGoalDto,
  ) {
    return this.productivityService.updateGoals(user.id, updateDto);
  }

  @Get('history')
  async getGoalHistory(
    @CurrentUser() user: JwtUser,
    @Headers('x-timezone') timezone?: string,
    @Query('days') days?: string,
  ) {
    const parsedDays = days
      ? Math.max(1, Math.min(30, parseInt(days, 10) || 7))
      : 7;
    return this.productivityService.getGoalHistory(
      user.id,
      timezone,
      parsedDays,
    );
  }
}
