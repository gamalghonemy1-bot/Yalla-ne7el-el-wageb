import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { SchoolModule } from './school/school.module';
import { AssignmentsModule } from './assignments/assignments.module';
@Module({ imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, AuthModule, SchoolModule, AssignmentsModule] })
export class AppModule {}
