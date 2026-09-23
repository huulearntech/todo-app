import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query, Req } from "@nestjs/common";
import { TaskService } from "./task.service";
import type { Request } from "express";

// import { Dto_Filter_GetTasks } from "./dto/get-my-tasks.dto"; // TODO: move
import { UpdateTaskDto, type CreateTaskDto } from "./dto/add-task.dto"; // NOTE: why does it complain when import with no "type" keyword?

import { DateTime } from "luxon";


@Controller("tasks")
export class TasksController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  async createTask(
    @Req() req: Request & { user: { id: string } },
    @Body() createTaskReqDto: CreateTaskDto
  ) {
    return this.taskService.createTask(req.user.id, createTaskReqDto);
  }

  // TODO: @Temporary @Cleanup
  // NOTE: What does even "today" mean? it depends on the timezone of the user, not the server.
  // So we need to get the timezone of the user somehow.
  @Get("me/due-today")
  async getMyTasksDueToday(
    @Req() req: Request & { user: { id: string } },
    @Headers("x-timezone") timezone: string
  ) {
    const nowInUserTimezone = DateTime.now().setZone(timezone);
    const startOfDay = nowInUserTimezone.startOf("day").toJSDate();
    const endOfDay = nowInUserTimezone.endOf("day").toJSDate();

    return this.taskService.getTasksByOwnerIdThatDueInTimeRange(req.user.id, startOfDay, endOfDay);
  }


  @Delete(":id")
  async deleteTask(@Param() id: string) {
    return this.taskService.deleteTask(id);
  }

  @Patch(":id")
  async updateTask(
    @Req() req: Request & { user: { id: string } }, // TODO: Factor this out
    @Param("id") id: string,
    @Body() updateTaskDto: UpdateTaskDto
  ) {
    console.log("updateTaskDto", updateTaskDto);
    console.log("updateTaskDto.dueAt", typeof updateTaskDto.dueAt, updateTaskDto.dueAt);
    return this.taskService.updateTask(id, updateTaskDto);
  }

  @Patch(":id/reorder")
  async updateTaskOrder(
    @Req() req: Request & { user: { id: string } }, // TODO: Factor this out
    @Param("id") id: string,
    @Body() { sectionId, prevId }: { sectionId: string; prevId: string | null }
  ) {
    await this.taskService.updateTaskOrder_New({
      ownerId: req.user.id,
      taskId: id,
      sectionId,
      prevId,
    });
  }
}