import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import argon2 from 'argon2';
import { randomUUID } from 'crypto';
import { AUTH_ERROR_CODES } from '@todo/shared';

import { UpdateUserDto, UserResponseDto } from './dto/user.dto';
import { SignUpDto } from '../auth/dto/sign-up.dto';
import { User } from './user.entity';
import { Project } from '../projects/project.entity';
import { UserGoal } from './entities/user-goal.entity';

@Injectable()
export class UserService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async createUser(signUp: SignUpDto): Promise<UserResponseDto> {
    const normalizedEmail = signUp.email.trim().toLowerCase();

    const existingUser = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      if (existingUser.isEmailVerified) {
        throw new ConflictException({
          code: AUTH_ERROR_CODES.EMAIL_ALREADY_EXISTS,
          message: 'An account with this email already exists. Please sign in.',
        });
      }

      // Re-registration of an unverified account:
      // Update credentials and name to the newly provided values.
      const passwordHashed = await argon2.hash(signUp.password);
      existingUser.passwordHashed = passwordHashed;
      if (signUp.name) {
        existingUser.name = signUp.name.trim();
      }

      const savedUser = await this.userRepository.save(existingUser);

      return {
        id: savedUser.id,
        email: savedUser.email,
        name: savedUser.name,
        avatarUrl: savedUser.avatarUrl,
        defaultProjectId: savedUser.defaultProjectId,
        isEmailVerified: savedUser.isEmailVerified,
      };
    }

    const { password, ...userData } = signUp;
    const passwordHashed = await argon2.hash(password);

    const defaultProjectId = randomUUID(); // Generate a UUID for the default project

    const user = this.userRepository.create({
      ...userData,
      email: normalizedEmail,
      passwordHashed,
      defaultProjectId,
    });

    const userResponse = await this.dataSource.transaction(
      async (transactionalEntityManager) => {
        const savedUser = await transactionalEntityManager.save(User, user);

        await transactionalEntityManager.save(Project, {
          id: defaultProjectId,
          name: 'Inbox',
          owner: savedUser,
          colorKey: 'slate',
        });

        await transactionalEntityManager.save(UserGoal, {
          userId: savedUser.id,
          dailyGoal: 5,
          weeklyGoal: 20,
          effectiveFrom: new Date(),
          effectiveTo: null,
        });

        return {
          id: savedUser.id,
          email: savedUser.email,
          name: savedUser.name,
          avatarUrl: savedUser.avatarUrl,
          defaultProjectId: savedUser.defaultProjectId,
          isEmailVerified: savedUser.isEmailVerified,
        };
      },
    );

    return userResponse;
  }

  async deleteUser(id: string): Promise<void> {
    const result = await this.userRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }
  }

  async findById(id: string): Promise<UserResponseDto | null> {
    return this.userRepository.findOne({
      where: { id },
      select: {
        id: true,
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
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

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
