import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from "@nestjs/common";
import { UserService } from "./user.service";
import { SignUpDto, UpdateUserProfileDto } from "./dto/user.dto";
import { Public } from "../auth/decorators/public.decorator";
import { TaskService } from "../tasks/task.service";

@Controller("users")
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly taskService: TaskService,
  ) {}

  @Public() // Of course need to allow public access to user creation, otherwise no one can sign up
  // Need non-registered user
  @Post()
  async createUser(@Body() signUpDto: SignUpDto) {
    return this.userService.createUser(signUpDto);
  }

  @Delete(":id")
  async deleteUser(@Param() id: string) {
    return this.userService.deleteUser(id);
  }

  @Patch("me")
  async updateCurrentUser(@Req() req: Request & { user: { id: string } }, @Body() updateUserDto: UpdateUserProfileDto) {
    return this.userService.updateUser(req.user.id, updateUserDto);
  }

  // NOTE: Should this be?
  @Patch(":id")
  async updateUser(@Param() id: string, @Body() updateUserDto: UpdateUserProfileDto) {
    return this.userService.updateUser(id, updateUserDto);
  }

  @Get(":id/tasks") // NOTE: Should this be here?
  async getTasksByOwnerId(@Param("id") ownerId: string) {
    return this.taskService.getTasksByOwnerId(ownerId);
  }
}