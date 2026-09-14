import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req } from "@nestjs/common";
import { UserService } from "./user.service";
import { CreateUserDto, UpdateUserDto } from "./dto/user.dto";
import { Public } from "../auth/decorators/public.decorator";
import { TaskService } from "../tasks/task.service";
import { ProjectService } from "../projects/project.service";

@Controller("users")
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly taskService: TaskService,
    private readonly projectService: ProjectService
  ) {}

  @Public() // Of course need to allow public access to user creation, otherwise no one can sign up
  // Need non-registered user
  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto);
  }

  @Delete(":id")
  async deleteUser(@Param() id: string) {
    return this.userService.deleteUser(id);
  }

  @Put("me")
  async updateCurrentUser(@Req() req: Request & { user: { id: string } }, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.updateUser(req.user.id, updateUserDto);
  }

  // NOTE: Should this be?
  @Put(":id")
  async updateUser(@Param() id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.updateUser(id, updateUserDto);
  }

  @Get("me/projects") // TODO: move
  async getMyProjects(
    @Req() req: Request & { user: { id: string } },
    @Query("title") title?: string
  ) {
    if (!title) {
      return this.projectService.getProjectsByOwnerId(req.user.id);
    }

    return this.projectService.getProjectsByOwnerIdAndTitle(req.user.id, title);
  }

  @Get(":id/tasks")
  async getTasksByOwnerId(@Param("id") ownerId: string) {
    return this.taskService.getTasksByOwnerId(ownerId);
  }
}