import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { TaskLabel } from './task-label.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTaskLabelDto, UpdateTaskLabelDto } from './task-label.dto';
import { ColorService, normalizeHexCode } from '../colors/color.service';
import { Color } from '../colors/color.entity';

@Injectable()
export class TaskLabelService {
  constructor(
    @InjectRepository(TaskLabel)
    private readonly taskLabelRepository: Repository<TaskLabel>,
    private readonly colorService: ColorService,
  ) {}

  async createTaskLabel(
    ownerId: string,
    dtoOrName: CreateTaskLabelDto | string,
    description?: string,
    rawColorHex?: string,
  ): Promise<TaskLabel> {
    let name: string;
    let desc: string | undefined;
    let hexCode = '#E0E0E0';

    if (typeof dtoOrName === 'string') {
      name = dtoOrName;
      desc = description;
      if (rawColorHex) hexCode = rawColorHex;
    } else {
      name = dtoOrName.name;
      desc = dtoOrName.description;
      if (dtoOrName.colorHexCode) hexCode = dtoOrName.colorHexCode;
    }

    const normalizedHex = normalizeHexCode(hexCode);

    let targetColor: Color | undefined;
    if (normalizedHex === '#E0E0E0') {
      const defaultColors = await this.colorService.ensureDefaultColors(ownerId);
      targetColor = defaultColors.find((c) => c.hexCode === '#E0E0E0');
    } else {
      targetColor = await this.colorService.getColorByHexCode(ownerId, normalizedHex);
    }

    const taskLabel = this.taskLabelRepository.create({
      ownerId,
      name: name.trim(),
      description: desc?.trim(),
      colorHexCode: normalizedHex,
      ...(targetColor ? { color: targetColor } : {}),
    });

    const saved = await this.taskLabelRepository.save(taskLabel);
    return (await this.getTaskLabelById(saved.id)) ?? saved;
  }

  async getAllTaskLabels(): Promise<TaskLabel[]> {
    return this.taskLabelRepository.find({ relations: { color: true } });
  }

  async getTaskLabelsByOwnerId(ownerId: string): Promise<TaskLabel[]> {
    return this.taskLabelRepository.find({
      where: { ownerId },
      relations: { color: true },
      order: { createdAt: 'DESC' },
    });
  }

  async getTaskLabelById(id: string): Promise<TaskLabel | null> {
    return this.taskLabelRepository.findOne({
      where: { id },
      relations: { color: true },
    });
  }

  async updateTaskLabel(
    id: string,
    updatedTaskLabel: Partial<UpdateTaskLabelDto>,
    ownerId?: string,
  ): Promise<TaskLabel | null> {
    const taskLabel = await this.getTaskLabelById(id);
    if (!taskLabel) {
      return null;
    }

    if (ownerId && taskLabel.ownerId !== ownerId) {
      return null;
    }

    if (updatedTaskLabel.name !== undefined) {
      taskLabel.name = updatedTaskLabel.name.trim();
    }

    if (updatedTaskLabel.description !== undefined) {
      taskLabel.description = updatedTaskLabel.description?.trim();
    }

    if (updatedTaskLabel.colorHexCode !== undefined) {
      const normalizedHex = normalizeHexCode(updatedTaskLabel.colorHexCode);
      let targetColor: Color | undefined;
      if (normalizedHex === '#E0E0E0') {
        const defaultColors = await this.colorService.ensureDefaultColors(
          taskLabel.ownerId,
        );
        targetColor = defaultColors.find((c) => c.hexCode === '#E0E0E0');
      } else {
        targetColor = await this.colorService.getColorByHexCode(
          taskLabel.ownerId,
          normalizedHex,
        );
      }
      taskLabel.colorHexCode = normalizedHex;
      if (targetColor) {
        taskLabel.color = targetColor;
      }
    }

    await this.taskLabelRepository.save(taskLabel);
    return this.getTaskLabelById(id);
  }

  async deleteTaskLabel({
    id,
    ownerId,
  }: {
    id: string;
    ownerId: string;
  }): Promise<boolean> {
    const result = await this.taskLabelRepository.delete({ id, ownerId });
    return result.affected !== 0;
  }
}
