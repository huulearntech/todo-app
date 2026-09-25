import { Body, Controller, Delete, Param, Patch } from "@nestjs/common";
import { UserService } from "./user.service";
import { UpdateUserDto } from "./dto/user.dto";
import { CurrentUser, type JwtUser } from "../auth/decorators/current-user.decorator";

@Controller("users")
export class UserController {
  constructor(
    private readonly userService: UserService,
  ) {}

  @Delete(":id")
  async deleteUser(@Param() id: string) {
    return this.userService.deleteUser(id);
  }

  @Patch("me")
  async updateCurrentUser(
    @CurrentUser() user: JwtUser,
    @Body() updateUserDto: UpdateUserDto
  ) {
    return this.userService.updateUser(user.id, updateUserDto);
  }

  @Patch(":id")
  async updateUser(
    @Param() id: string,
    @Body() updateUserDto: UpdateUserDto
  ) {
    return this.userService.updateUser(id, updateUserDto);
  }
}