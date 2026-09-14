import { Body, Controller, Delete, Get, Param, Post, Query, Req } from "@nestjs/common";
import { TaskService } from "./task.service";
import type { Request } from "express";
import type { TaskPriority } from "./enums/task-priority.enum";
import { GetMyTasksFilterDto } from "./dto/get-my-tasks.dto";


// TODO: @Cleanup @Robustness

type CreateTaskReqDto = {
  title: string; description?: string;
  dueDate?: Date;
  priority?: TaskPriority;
  completed?: boolean;
};

@Controller("tasks")
export class TasksController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  async createTask(
    @Req() req: Request & { user: { id: string } },
    @Body() createTaskReqDto: CreateTaskReqDto
  ) {
    return this.taskService.createTask(req.user.id, createTaskReqDto);
  }

  // @Get()
  // async getAllTasks( // TODO: @Cleanup @Robustness @Confuse
  //   @Req() req: Request & { user: { id: string } },
  //   @Query() projectId?: string
  // ) {
  //   if (projectId) {
  //     return this.taskService.getTasksByOwnerIdAndProjectId(req.user.id, projectId);
  //   }
  //   return this.taskService.getAllTasks();
  // }

  @Get("me")
  async getMyTasks(
    @Req() req: Request & { user: { id: string } },
    @Query() filter: GetMyTasksFilterDto,
  ) {
    return this.taskService.getTasksByOwnerIdAndFilter(req.user.id, filter);
  }


  @Delete(":id")
  async deleteTask(@Param() id: number) {
    return this.taskService.deleteTask(id);
  }
}