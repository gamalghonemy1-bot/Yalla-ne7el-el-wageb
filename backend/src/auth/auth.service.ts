import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.module';
@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}
  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw new UnauthorizedException('Invalid credentials');
    const accessToken = await this.jwt.signAsync({ sub: user.id, role: user.role });
    return { accessToken, user: { id: user.id, name: user.name, role: user.role } };
  }
}
