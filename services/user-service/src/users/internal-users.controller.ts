import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto';
import { FindUserByEmailDto } from './dto/find-user-by-email.dto';
import { UsersService } from './users.service';

@ApiTags('Internal Users')
@Controller('internal/users')
export class InternalUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a user record for the auth service' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Post('by-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve a user by email for auth validation' })
  findByEmail(@Body() findUserByEmailDto: FindUserByEmailDto) {
    return this.usersService.findAuthUserByEmail(findUserByEmailDto.email);
  }
}
