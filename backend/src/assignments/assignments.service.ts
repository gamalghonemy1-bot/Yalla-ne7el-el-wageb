import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.module';
import { AuthUser } from '../auth/guards';
import { AnswerDto, CreateAssignmentDto } from './assignments.dto';

const POINTS_PER_CORRECT = 10;

@Injectable()
export class AssignmentsService {
  constructor(private prisma: PrismaService) {}

  // ---------- teacher / admin ----------
  private async teacherIdFor(user: AuthUser, classroomId: string): Promise<string | null> {
    if (user.role === 'ADMIN') return null;
    const t = await this.prisma.teacher.findUnique({ where: { userId: user.id } });
    const link = t && (await this.prisma.teacherClassroom.findUnique({ where: { teacherId_classroomId: { teacherId: t.id, classroomId } } }));
    if (!t || !link) throw new ForbiddenException('Not your classroom');
    return t.id;
  }
  async create(user: AuthUser, dto: CreateAssignmentDto) {
    if (!(await this.prisma.classroom.findUnique({ where: { id: dto.classroomId } }))) throw new NotFoundException('Classroom not found');
    for (const q of dto.questions) {
      if (q.options.filter((o) => o.isCorrect).length !== 1) throw new BadRequestException('Each question needs exactly one correct option');
    }
    const teacherId = await this.teacherIdFor(user, dto.classroomId);
    return this.prisma.assignment.create({
      data: {
        title: dto.title, classroomId: dto.classroomId, teacherId, dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        questions: { create: dto.questions.map((q, i) => ({ order: i + 1, question: { create: { text: q.text, options: { create: q.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect })) } } } })) },
      },
      select: { id: true, title: true, classroomId: true },
    });
  }
  async listAssignments(user: AuthUser) {
    let where = {};
    if (user.role === 'TEACHER') {
      const t = await this.prisma.teacher.findUnique({ where: { userId: user.id }, include: { classrooms: true } });
      where = { classroomId: { in: (t?.classrooms ?? []).map((c) => c.classroomId) } };
    }
    const l = await this.prisma.assignment.findMany({ where, orderBy: { createdAt: 'desc' }, include: { classroom: true, _count: { select: { questions: true } } } });
    return l.map((a) => ({ id: a.id, title: a.title, classroom: a.classroom.name, dueDate: a.dueDate, questionCount: a._count.questions }));
  }
  async resultsForAssignment(user: AuthUser, assignmentId: string) {
    const a = await this.prisma.assignment.findUnique({ where: { id: assignmentId }, include: { _count: { select: { questions: true } } } });
    if (!a) throw new NotFoundException();
    await this.teacherIdFor(user, a.classroomId);
    const children = await this.prisma.child.findMany({ where: { classroomId: a.classroomId }, include: { childAssignments: { where: { assignmentId } } }, orderBy: { name: 'asc' } });
    return {
      assignmentId, title: a.title, questionCount: a._count.questions,
      children: children.map((c) => {
        const ca = c.childAssignments[0];
        return { childId: c.id, name: c.name, status: ca?.status ?? 'PENDING', score: ca?.score ?? 0, correctCount: ca?.correctCount ?? 0, wrongCount: ca?.wrongCount ?? 0, completedAt: ca?.completedAt ?? null };
      }),
    };
  }

  // ---------- parent ----------
  private async assertOwns(user: AuthUser, childId: string) {
    const parent = await this.prisma.parent.findUnique({ where: { userId: user.id } });
    const rel = parent && (await this.prisma.childParentRelation.findUnique({ where: { childId_parentId: { childId, parentId: parent.id } } }));
    if (!rel) throw new ForbiddenException('Not your child');
  }
  async myChildren(user: AuthUser) {
    const rels = await this.prisma.childParentRelation.findMany({ where: { parent: { userId: user.id } }, include: { child: { include: { classroom: true } } } });
    return rels.map((r) => ({ id: r.child.id, name: r.child.name, classroom: r.child.classroom.name }));
  }
  async listForChild(user: AuthUser, childId: string) {
    await this.assertOwns(user, childId);
    const child = await this.prisma.child.findUniqueOrThrow({ where: { id: childId } });
    const list = await this.prisma.assignment.findMany({
      where: { classroomId: child.classroomId }, orderBy: { createdAt: 'desc' },
      include: { childAssignments: { where: { childId } }, _count: { select: { questions: true } } },
    });
    return list.map((a) => {
      const ca = a.childAssignments[0];
      return { id: a.id, title: a.title, dueDate: a.dueDate, questionCount: a._count.questions, status: ca?.status ?? 'PENDING', score: ca?.score ?? 0, correctCount: ca?.correctCount ?? 0, wrongCount: ca?.wrongCount ?? 0 };
    });
  }
  private async loadForChild(childId: string, assignmentId: string) {
    const child = await this.prisma.child.findUniqueOrThrow({ where: { id: childId } });
    const a = await this.prisma.assignment.findUnique({ where: { id: assignmentId } });
    if (!a || a.classroomId !== child.classroomId) throw new NotFoundException('Assignment not found');
    return a;
  }
  async start(user: AuthUser, childId: string, assignmentId: string) {
    await this.assertOwns(user, childId);
    await this.loadForChild(childId, assignmentId);
    const ca = await this.prisma.childAssignment.upsert({
      where: { childId_assignmentId: { childId, assignmentId } }, create: { childId, assignmentId }, update: {}, include: { answers: true },
    });
    if (ca.status === 'COMPLETED') throw new ConflictException('Already completed');
    const qs = await this.prisma.assignmentQuestion.findMany({
      where: { assignmentId }, orderBy: { order: 'asc' },
      include: { question: { include: { options: { select: { id: true, text: true } } } } }, // isCorrect never exposed
    });
    return {
      assignmentId, answeredQuestionIds: ca.answers.map((a) => a.questionId),
      questions: qs.map((q) => ({ questionId: q.questionId, order: q.order, text: q.question.text, options: q.question.options })),
    };
  }
  async answer(user: AuthUser, childId: string, assignmentId: string, dto: AnswerDto) {
    await this.assertOwns(user, childId);
    const ca = await this.prisma.childAssignment.findUnique({ where: { childId_assignmentId: { childId, assignmentId } } });
    if (!ca) throw new NotFoundException('Assignment not started');
    if (ca.status === 'COMPLETED') throw new ConflictException('Already completed');
    const inAssignment = await this.prisma.assignmentQuestion.findUnique({ where: { assignmentId_questionId: { assignmentId, questionId: dto.questionId } } });
    const option = await this.prisma.questionOption.findFirst({ where: { id: dto.optionId, questionId: dto.questionId } });
    if (!inAssignment || !option) throw new BadRequestException('Invalid question or option');
    try {
      const points = option.isCorrect ? POINTS_PER_CORRECT : 0;
      await this.prisma.childAnswer.create({ data: { childAssignmentId: ca.id, questionId: dto.questionId, optionId: dto.optionId, isCorrect: option.isCorrect, points } });
      return { isCorrect: option.isCorrect, points };
    } catch (e: any) {
      if (e?.code === 'P2002') throw new ConflictException('Question already answered');
      throw e;
    }
  }
  async finish(user: AuthUser, childId: string, assignmentId: string) {
    await this.assertOwns(user, childId);
    const ca = await this.prisma.childAssignment.findUnique({ where: { childId_assignmentId: { childId, assignmentId } }, include: { answers: true } });
    if (!ca) throw new NotFoundException('Assignment not started');
    if (ca.status === 'COMPLETED') throw new ConflictException('Already completed');
    const total = await this.prisma.assignmentQuestion.count({ where: { assignmentId } });
    if (ca.answers.length < total) throw new BadRequestException('Answer all questions first');
    const correctCount = ca.answers.filter((a) => a.isCorrect).length;
    const r = await this.prisma.childAssignment.update({
      where: { id: ca.id },
      data: { status: 'COMPLETED', score: ca.answers.reduce((s, a) => s + a.points, 0), correctCount, wrongCount: total - correctCount, completedAt: new Date() },
    });
    return { score: r.score, correctCount: r.correctCount, wrongCount: r.wrongCount, totalQuestions: total, completedAt: r.completedAt };
  }
  async resultsForChild(user: AuthUser, childId: string) {
    await this.assertOwns(user, childId);
    const list = await this.prisma.childAssignment.findMany({ where: { childId, status: 'COMPLETED' }, include: { assignment: true }, orderBy: { completedAt: 'desc' } });
    return list.map((r) => ({ assignmentId: r.assignmentId, title: r.assignment.title, score: r.score, correctCount: r.correctCount, wrongCount: r.wrongCount, completedAt: r.completedAt }));
  }
}
