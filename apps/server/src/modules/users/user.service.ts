import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { User } from './user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdateUserDto, UserResponseDto } from './dto/user.dto';
import { SignUpDto } from '../auth/dto/sign-up.dto';
import argon2 from 'argon2';
import { Project } from '../projects/project.entity';

@Injectable()
export class UserService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async createUser(signUp: SignUpDto): Promise<UserResponseDto> {
    const { password, ...userData } = signUp;
    const passwordHashed = await argon2.hash(password);
    const user = this.userRepository.create({
      ...userData,
      passwordHashed,
    });

    const userResponse = await this.dataSource.transaction(async (transactionalEntityManager) => {
      const savedUser = await transactionalEntityManager.save(User, user);
      const defaultProject = await transactionalEntityManager.save(Project, {
        name: 'Inbox',
        owner: savedUser,
      });
      savedUser.defaultProjectId = defaultProject.id;
      await transactionalEntityManager.save(User, savedUser);

      return {
        email: savedUser.email,
        name: savedUser.name,
        avatarUrl: savedUser.avatarUrl,
        defaultProjectId: defaultProject.id,
      };
    });

    return userResponse;
  }

  // async getAllUsers(): Promise<User[]> {
  //   return this.userRepository.find();
  // }

  async deleteUser(id: string): Promise<boolean> {
    const result = await this.userRepository.delete(id);
    return result.affected !== 0; // NOTE: What the fk?
  }

  async findByEmailIncludePassword(email: string): Promise<User | null> { // TODO: need to define stricter DTO
    return this.userRepository.findOne({ where: { email } });
  }

  async findUserByIdWhoHasRefreshToken(userId: string, refreshToken: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: {
        id: userId,
        refreshTokens: {
          token: refreshToken,
        },
      },
      // select: {
      //   id: true,
      //   email: true,
      //   name: true,
      //   passwordHashed: true,
      // },
    });
  }

  async findByRefreshToken(refreshToken: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: {
        refreshTokens: {
          token: refreshToken,
          isRevoked: false,
        },
      },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User | null> { // TODO: replace reponse user with the DTO
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      return null;
    }

    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }
}