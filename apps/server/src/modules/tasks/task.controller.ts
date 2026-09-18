import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from "@nestjs/common";
import { TaskService } from "./task.service";
import type { Request } from "express";

import { GetMyTasksFilterDto } from "./dto/get-my-tasks.dto"; // TODO: move
import { type CreateTaskDto } from "./dto/add-task.dto"; // NOTE: why does it complain when import with no "type" keyword?


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

  @Get("me")
  async getMyTasks(
    @Req() req: Request & { user: { id: string } },
    @Query() filter: GetMyTasksFilterDto,
  ) {
    return this.taskService.getTasksByOwnerIdAndFilter(req.user.id, filter);
  }

  // TODO: @Cleanup @Temporary
  @Get("me/new")
  async getMyTasks_New(
    @Req() req: Request & { user: { id: string } },
    @Query() filter: GetMyTasksFilterDto,
  ) {
    return this.taskService.getTasksByOwnerIdAndProjectIdWithSectionIdAndName(req.user.id, filter.projectId || '');
  }

  // TODO: @Cleanup @Temporary
  @Get("tempbylabel/:labelId")
  async getMyTasksByLabelId(
    @Req() req: Request & { user: { id: string } },
    @Param("labelId") labelId: string
  ) {
    return this.taskService.getTasksByOwnerIdAndLabelId(req.user.id, labelId);
  }


  @Delete(":id")
  async deleteTask(@Param() id: string) {
    return this.taskService.deleteTask(id);
  }

  @Patch(":id/reorder")
  async updateTask(
    @Req() req: Request & { user: { id: string } }, // TODO: Factor this out
    @Param("id") id: string,
    @Body("sectionId") sectionId?: string,
    @Body("prevId") prevId?: string,
    @Body("nextId") nextId?: string
  ) {
    await this.taskService.updateTaskOrder(req.user.id, id, sectionId, prevId, nextId);
  }
}