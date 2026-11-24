import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { AuthUser, CurrentUser, JwtAuthGuard, Roles, RolesGuard } from '../auth/guards';
import { ChildDto, ClassroomDto, LinkChildDto, ParentDto, TeacherDto } from './school.dto';
import { SchoolService } from './school.service';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class SchoolController {
  constructor(private s: SchoolService) {}
  @Post('classrooms') @Roles('ADMIN') classroom(@CurrentUser() u: AuthUser, @Body() d: ClassroomDto) { return this.s.createClassroom(u.id, d); }
  @Get('classrooms') @Roles('ADMIN', 'TEACHER') classrooms() { return this.s.listClassrooms(); }
  @Post('teachers') @Roles('ADMIN') teacher(@CurrentUser() u: AuthUser, @Body() d: TeacherDto) { return this.s.createTeacher(u.id, d); }
  @Post('children') @Roles('ADMIN') child(@CurrentUser() u: AuthUser, @Body() d: ChildDto) { return this.s.createChild(u.id, d); }
  @Get('children') @Roles('ADMIN', 'TEACHER') children() { return this.s.listChildren(); }
  @Post('parents') @Roles('ADMIN') parent(@CurrentUser() u: AuthUser, @Body() d: ParentDto) { return this.s.createParent(u.id, d); }
  @Post('parents/:parentId/children') @Roles('ADMIN')
  link(@CurrentUser() u: AuthUser, @Param('parentId', ParseUUIDPipe) p: string, @Body() d: LinkChildDto) { return this.s.linkChild(u.id, p, d.childId); }
}
