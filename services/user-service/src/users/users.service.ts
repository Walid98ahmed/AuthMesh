import {
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { User } from './entities/user.entity';
import { AuthUser } from './interfaces/auth-user.interface';
import { SafeUser } from './interfaces/safe-user.interface';
import { UserRole } from './user-role.enum';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.ensureSeedAdmin();
  }

  async create(createUserDto: CreateUserDto): Promise<SafeUser> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(createUserDto.password, 10);
    const user = this.usersRepository.create({
      email: createUserDto.email.toLowerCase(),
      passwordHash,
      role: createUserDto.role ?? UserRole.USER,
    });

    const savedUser = await this.usersRepository.save(user);
    return this.toSafeUser(savedUser);
  }

  async findAuthUserByEmail(email: string): Promise<AuthUser> {
    const user = await this.usersRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      role: user.role,
    };
  }

  async findAll(): Promise<SafeUser[]> {
    const users = await this.usersRepository.find({
      order: { createdAt: 'DESC' },
    });

    return users.map((user) => this.toSafeUser(user));
  }

  async findById(id: string): Promise<SafeUser> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toSafeUser(user);
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<SafeUser> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateProfileDto.email) {
      const normalizedEmail = updateProfileDto.email.toLowerCase();
      const duplicate = await this.usersRepository.findOne({
        where: { email: normalizedEmail },
      });

      if (duplicate && duplicate.id !== user.id) {
        throw new ConflictException('User with this email already exists');
      }

      user.email = normalizedEmail;
    }

    if (updateProfileDto.password) {
      user.passwordHash = await bcrypt.hash(updateProfileDto.password, 10);
    }

    const updatedUser = await this.usersRepository.save(user);
    return this.toSafeUser(updatedUser);
  }

  async updateRole(userId: string, role: UserRole): Promise<SafeUser> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.role = role;
    const updatedUser = await this.usersRepository.save(user);
    return this.toSafeUser(updatedUser);
  }

  private async ensureSeedAdmin(): Promise<void> {
    const adminEmail = this.configService.get<string>('seed.adminEmail');
    const adminPassword = this.configService.get<string>('seed.adminPassword');

    if (!adminEmail || !adminPassword) {
      return;
    }

    const existingAdmin = await this.usersRepository.findOne({
      where: { email: adminEmail.toLowerCase() },
    });

    if (existingAdmin) {
      return;
    }

    await this.create({
      email: adminEmail,
      password: adminPassword,
      role: UserRole.ADMIN,
    });
  }

  private toSafeUser(user: User): SafeUser {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
