import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UserServiceClient } from './user-service.client';

describe('AuthService', () => {
  let service: AuthService;
  let userServiceClient: jest.Mocked<UserServiceClient>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    userServiceClient = {
      createUser: jest.fn(),
      findByEmail: jest.fn(),
    } as unknown as jest.Mocked<UserServiceClient>;

    jwtService = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    configService = {
      getOrThrow: jest.fn((key: string) => {
        const values: Record<string, string> = {
          'auth.accessSecret': 'access-secret',
          'auth.accessExpiresIn': '15m',
          'auth.refreshSecret': 'refresh-secret',
          'auth.refreshExpiresIn': '7d',
        };

        return values[key];
      }),
    } as unknown as jest.Mocked<ConfigService>;

    service = new AuthService(userServiceClient, jwtService, configService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('logs in with valid credentials', async () => {
    userServiceClient.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      role: 'user',
      passwordHash: 'hashed-password',
    });
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
    jwtService.signAsync
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');

    const result = await service.login({
      email: 'user@example.com',
      password: 'StrongPassw0rd!',
    });

    expect(result).toEqual({
      user: {
        id: 'user-1',
        email: 'user@example.com',
        role: 'user',
      },
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    expect(userServiceClient.findByEmail).toHaveBeenCalledWith('user@example.com');
  });

  it('generates access and refresh tokens with separate secrets', async () => {
    jwtService.signAsync
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');

    const result = await service.generateTokenPair({
      id: 'user-1',
      email: 'admin@example.com',
      role: 'admin',
    });

    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    expect(jwtService.signAsync).toHaveBeenNthCalledWith(
      1,
      {
        sub: 'user-1',
        email: 'admin@example.com',
        role: 'admin',
      },
      {
        secret: 'access-secret',
        expiresIn: '15m',
      },
    );
    expect(jwtService.signAsync).toHaveBeenNthCalledWith(
      2,
      {
        sub: 'user-1',
        email: 'admin@example.com',
        role: 'admin',
        tokenType: 'refresh',
      },
      {
        secret: 'refresh-secret',
        expiresIn: '7d',
      },
    );
  });

  it('rejects invalid passwords during validation', async () => {
    userServiceClient.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      role: 'user',
      passwordHash: 'hashed-password',
    });
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

    await expect(
      service.validateUser('user@example.com', 'wrong-password'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
