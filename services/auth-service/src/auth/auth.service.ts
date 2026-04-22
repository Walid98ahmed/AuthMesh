import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import { TokenPair } from './interfaces/token-pair.interface';
import { UserServiceClient } from './user-service.client';

@Injectable()
export class AuthService {
  constructor(
    private readonly userServiceClient: UserServiceClient,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const user = await this.userServiceClient.createUser(registerDto);
    const authUser = await this.userServiceClient.findByEmail(user.email);
    const tokens = await this.generateTokenPair(authUser);

    return {
      user,
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    const tokens = await this.generateTokenPair(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    };
  }

  async refreshTokens(refreshTokenDto: RefreshTokenDto): Promise<TokenPair> {
    const payload = await this.jwtService.verifyAsync<{
      sub: string;
      email: string;
      role: 'user' | 'admin';
      tokenType: 'refresh';
    }>(refreshTokenDto.refreshToken, {
      secret: this.configService.getOrThrow<string>('auth.refreshSecret'),
    });

    if (payload.tokenType !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.generateTokenPair({
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    });
  }

  async validateUser(email: string, password: string): Promise<AuthenticatedUser> {
    const user = await this.userServiceClient.findByEmail(email);
    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async generateTokenPair(user: Pick<AuthenticatedUser, 'id' | 'email' | 'role'>): Promise<TokenPair> {
    const accessSecret = this.configService.getOrThrow<string>('auth.accessSecret');
    const accessExpiresIn = this.configService.getOrThrow<string>('auth.accessExpiresIn');
    const refreshSecret = this.configService.getOrThrow<string>('auth.refreshSecret');
    const refreshExpiresIn = this.configService.getOrThrow<string>('auth.refreshExpiresIn');

    const accessPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const refreshPayload = {
      ...accessPayload,
      tokenType: 'refresh' as const,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: accessSecret,
        expiresIn: accessExpiresIn,
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: refreshSecret,
        expiresIn: refreshExpiresIn,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}
