import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { AuthUser, CurrentUser, JwtAuthGuard, Roles, RolesGuard } from '../auth/guards';
import { AnswerDto, CreateAssignmentDto } from './assignments.dto';
import { AssignmentsService } from './assignments.service';

const U = () => new ParseUUIDPipe();
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssignmentsController {
  constructor(private s: AssignmentsService) {}
  @Post('assignments') @Roles('TEACHER', 'ADMIN') create(@CurrentUser() u: AuthUser, @Body() d: CreateAssignmentDto) { return this.s.create(u, d); }
  @Get('assignments') @Roles('TEACHER', 'ADMIN') listAll(@CurrentUser() u: AuthUser) { return this.s.listAssignments(u); }
  @Get('results/assignments/:id') @Roles('TEACHER', 'ADMIN') results(@CurrentUser() u: AuthUser, @Param('id', U()) id: string) { return this.s.resultsForAssignment(u, id); }

  @Get('me/children') @Roles('PARENT') myChildren(@CurrentUser() u: AuthUser) { return this.s.myChildren(u); }
  @Get('children/:childId/assignments') @Roles('PARENT') list(@CurrentUser() u: AuthUser, @Param('childId', U()) c: string) { return this.s.listForChild(u, c); }
  @Get('children/:childId/results') @Roles('PARENT') childResults(@CurrentUser() u: AuthUser, @Param('childId', U()) c: string) { return this.s.resultsForChild(u, c); }
  @Post('children/:childId/assignments/:assignmentId/start') @Roles('PARENT')
  start(@CurrentUser() u: AuthUser, @Param('childId', U()) c: string, @Param('assignmentId', U()) a: string) { return this.s.start(u, c, a); }
  @Post('children/:childId/assignments/:assignmentId/answers') @Roles('PARENT')
  answer(@CurrentUser() u: AuthUser, @Param('childId', U()) c: string, @Param('assignmentId', U()) a: string, @Body() d: AnswerDto) { return this.s.answer(u, c, a, d); }
  @Post('children/:childId/assignments/:assignmentId/finish') @Roles('PARENT')
  finish(@CurrentUser() u: AuthUser, @Param('childId', U()) c: string, @Param('assignmentId', U()) a: string) { return this.s.finish(u, c, a); }
}
