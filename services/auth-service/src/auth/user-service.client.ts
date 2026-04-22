import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { RegisterDto } from './dto/register.dto';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';

@Injectable()
export class UserServiceClient {
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.getOrThrow<string>('services.userServiceBaseUrl');
  }

  async createUser(registerDto: RegisterDto) {
    const response = await firstValueFrom(
      this.httpService.post(`${this.baseUrl}/api/internal/users`, registerDto),
    );

    return response.data;
  }

  async findByEmail(email: string): Promise<AuthenticatedUser> {
    const response = await firstValueFrom(
      this.httpService.post(`${this.baseUrl}/api/internal/users/by-email`, { email }),
    );

    return response.data as AuthenticatedUser;
  }
}
