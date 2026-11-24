import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { AuthService } from './auth.service';
class LoginDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(1) password!: string;
}
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}
  @Post('login') @HttpCode(200)
  login(@Body() dto: LoginDto) { return this.auth.login(dto.email, dto.password); }
}
