import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query, Req } from "@nestjs/common";
import { TaskService } from "./task.service";

// import { Dto_Filter_GetTasks } from "./dto/get-my-tasks.dto"; // TODO: move
import { UpdateTaskDto, type CreateTaskDto } from "./dto/add-task.dto"; // NOTE: why does it complain when import with no "type" keyword?

import { DateTime } from "luxon";
import { CurrentUser, type JwtUser } from "../auth/decorators/current-user.decorator";


@Controller("tasks")
export class TasksController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  async createTask(
    @CurrentUser() user: JwtUser,
    @Body() createTaskReqDto: CreateTaskDto
  ) {
    return this.taskService.createTask(user.id, createTaskReqDto);
  }

  // TODO: @Temporary @Cleanup
  // NOTE: What does even "today" mean? it depends on the timezone of the user, not the server.
  // So we need to get the timezone of the user somehow.
  @Get("me/due-today")
  async getMyTasksDueToday(
    @CurrentUser() user: JwtUser,
    @Headers("x-timezone") timezone: string
  ) {
    const nowInUserTimezone = DateTime.now().setZone(timezone);
    const startOfDay = nowInUserTimezone.startOf("day").toJSDate();
    const endOfDay = nowInUserTimezone.endOf("day").toJSDate();

    return this.taskService.getTasksByOwnerIdThatDueInTimeRange(user.id, startOfDay, endOfDay);
  }


  @Delete(":id")
  async deleteTask(@Param() id: string) {
    return this.taskService.deleteTask(id);
  }

  @Patch(":id")
  async updateTask(
    // @CurrentUser() user: JwtUser,
    @Param("id") id: string,
    @Body() updateTaskDto: UpdateTaskDto
  ) {
    return this.taskService.updateTask(id, updateTaskDto);
  }

  @Patch(":id/reorder")
  async updateTaskOrder(
    @CurrentUser() user: JwtUser,
    @Param("id") id: string,
    @Body() { sectionId, prevId }: { sectionId: string; prevId: string | null }
  ) {
    await this.taskService.updateTaskOrder_New({
      ownerId: user.id,
      taskId: id,
      sectionId,
      prevId,
    });
  }
}