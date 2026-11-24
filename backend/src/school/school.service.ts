import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.module';
import { ChildDto, ClassroomDto, ParentDto, TeacherDto } from './school.dto';

@Injectable()
export class SchoolService {
  constructor(private prisma: PrismaService) {}
  private audit(userId: string, action: string, entity: string, entityId?: string) {
    return this.prisma.auditLog.create({ data: { userId, action, entity, entityId } });
  }
  private fail(e: any): never {
    if (e?.code === 'P2002') throw new ConflictException('Already exists');
    if (e?.code === 'P2003') throw new BadRequestException('Invalid reference');
    throw e;
  }
  async createClassroom(actor: string, dto: ClassroomDto) {
    try { const c = await this.prisma.classroom.create({ data: { name: dto.name } }); await this.audit(actor, 'CREATE', 'Classroom', c.id); return c; } catch (e) { this.fail(e); }
  }
  async createTeacher(actor: string, dto: TeacherDto) {
    try {
      const u = await this.prisma.user.create({
        data: {
          email: dto.email.toLowerCase(), name: dto.name, role: Role.TEACHER, passwordHash: await bcrypt.hash(dto.password, 10),
          teacher: { create: { classrooms: { create: (dto.classroomIds ?? []).map((classroomId) => ({ classroomId })) } } },
        },
        include: { teacher: true },
      });
      await this.audit(actor, 'CREATE', 'Teacher', u.teacher!.id);
      return { userId: u.id, teacherId: u.teacher!.id, email: u.email, name: u.name };
    } catch (e) { this.fail(e); }
  }
  async createChild(actor: string, dto: ChildDto) {
    try {
      const c = await this.prisma.child.create({ data: { name: dto.name, classroomId: dto.classroomId, birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined } });
      await this.audit(actor, 'CREATE', 'Child', c.id); return c;
    } catch (e) { this.fail(e); }
  }
  async createParent(actor: string, dto: ParentDto) {
    try {
      const u = await this.prisma.user.create({
        data: {
          email: dto.email.toLowerCase(), name: dto.name, role: Role.PARENT, passwordHash: await bcrypt.hash(dto.password, 10),
          parent: { create: { children: { create: (dto.childIds ?? []).map((childId) => ({ childId })) } } },
        },
        include: { parent: true },
      });
      await this.audit(actor, 'CREATE', 'Parent', u.parent!.id);
      return { userId: u.id, parentId: u.parent!.id, email: u.email, name: u.name };
    } catch (e) { this.fail(e); }
  }
  async linkChild(actor: string, parentId: string, childId: string) {
    try { const r = await this.prisma.childParentRelation.create({ data: { parentId, childId } }); await this.audit(actor, 'LINK', 'ChildParentRelation', r.id); return r; } catch (e) { this.fail(e); }
  }
  listClassrooms() { return this.prisma.classroom.findMany({ orderBy: { name: 'asc' } }); }
  listChildren() { return this.prisma.child.findMany({ include: { classroom: true }, orderBy: { name: 'asc' } }); }
}
