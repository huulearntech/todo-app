import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import argon2 from 'argon2';
import { randomUUID } from 'crypto';

import { UpdateUserDto, UserResponseDto } from './dto/user.dto';
import { SignUpDto } from '../auth/dto/sign-up.dto';
import { User } from './user.entity';
import { Project } from '../projects/project.entity';
import { Color } from '../colors/color.entity';
import { DEFAULT_COLORS } from '../colors/color.service';

import { MailerSchedulerService } from '../mailer/services/mailer-scheduler.service';

@Injectable()
export class UserService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly mailerSchedulerService: MailerSchedulerService,
  ) {}

  async createUser(signUp: SignUpDto): Promise<UserResponseDto> {
    const { password, ...userData } = signUp;
    const passwordHashed = await argon2.hash(password);

    const defaultProjectId = randomUUID(); // Generate a UUID for the default project

    const user = this.userRepository.create({
      ...userData,
      passwordHashed,
      defaultProjectId,
    });

    const userResponse = await this.dataSource.transaction(
      async (transactionalEntityManager) => {
        const savedUser = await transactionalEntityManager.save(User, user);

        // TODO: Consider redesign this
        const defaultColors = DEFAULT_COLORS.map((dc) =>
          transactionalEntityManager.create(Color, {
            ownerId: savedUser.id,
            hexCode: dc.hexCode,
            name: dc.name,
          }),
        );
        await transactionalEntityManager.save(Color, defaultColors);

        await transactionalEntityManager.save(Project, {
          id: defaultProjectId,
          name: 'Inbox',
          owner: savedUser,
          colorHexCode: '#E0E0E0',
        });

        return {
          id: savedUser.id,
          email: savedUser.email,
          name: savedUser.name,
          avatarUrl: savedUser.avatarUrl,
          defaultProjectId: savedUser.defaultProjectId,
        };
      },
    );

    // Send immediate welcome email asynchronously
    this.mailerSchedulerService
      .sendImmediateEmail({
        to: userResponse.email,
        subject: 'Welcome to Todo App!',
        templateType: 'welcome',
        context: {
          name: userResponse.name,
        },
      })
      .catch(() => {
        // Logging error is handled inside MailerSchedulerService/Worker
      });

    return userResponse;
  }

  // async getAllUsers(): Promise<User[]> {
  //   return this.userRepository.find();
  // }

  async deleteUser(id: string): Promise<boolean> {
    const result = await this.userRepository.delete(id);
    return result.affected !== 0;
  }

  async findById(id: string): Promise<UserResponseDto | null> {
    return this.userRepository.findOne({
      where: { id },
      select: {
        email: true,
        name: true,
        avatarUrl: true,
        defaultProjectId: true,
      },
    });
  }

  async updateUser(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.userRepository.findOneOrFail({ where: { id } });

    Object.assign(user, updateUserDto);
    const updatedUser = await this.userRepository.save(user);

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      avatarUrl: updatedUser.avatarUrl,
      defaultProjectId: updatedUser.defaultProjectId,
    };
  }
}
