// Runs against TEST_DATABASE_URL only. Test data is created here, never in production code.
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.module';

describe('Phase 1 full scenario', () => {
  let app: INestApplication; let prisma: PrismaService;
  const http = () => request(app.getHttpServer());
  const login = async (email: string, password: string) => (await http().post('/auth/login').send({ email, password }).expect(200)).body.accessToken as string;

  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = mod.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    prisma = app.get(PrismaService);
    for (const m of ['childAnswer', 'childAssignment', 'assignmentQuestion', 'assignment', 'questionOption', 'question', 'childParentRelation', 'teacherClassroom', 'child', 'classroom', 'teacher', 'parent', 'auditLog', 'user']) await (prisma as any)[m].deleteMany();
    await prisma.user.create({ data: { email: 'admin@test.local', passwordHash: await bcrypt.hash('Admin#12345', 10), name: 'Admin', role: 'ADMIN' } });
  });
  afterAll(async () => { await app.close(); });

  it('manager -> teacher homework -> child solves -> teacher sees result', async () => {
    const admin = await login('admin@test.local', 'Admin#12345');                                   // 1
    const A = { Authorization: `Bearer ${admin}` };
    const room = (await http().post('/classrooms').set(A).send({ name: 'KG1-A' }).expect(201)).body; // 2
    const child = (await http().post('/children').set(A).send({ name: 'Ali', classroomId: room.id }).expect(201)).body; // 3
    const other = (await http().post('/children').set(A).send({ name: 'Omar', classroomId: room.id }).expect(201)).body;
    await http().post('/parents').set(A).send({ email: 'p1@test.local', password: 'Parent#1234', name: 'P1', childIds: [child.id] }).expect(201); // 4
    await http().post('/parents').set(A).send({ email: 'p2@test.local', password: 'Parent#1234', name: 'P2', childIds: [other.id] }).expect(201);
    await http().post('/teachers').set(A).send({ email: 't@test.local', password: 'Teacher#1234', name: 'T', classroomIds: [room.id] }).expect(201);

    const T = { Authorization: `Bearer ${await login('t@test.local', 'Teacher#1234')}` };
    const questions = [1, 2, 3, 4, 5].map((n) => ({ text: `Q${n}`, options: [{ text: 'a', isCorrect: true }, { text: 'b', isCorrect: false }, { text: 'c', isCorrect: false }] }));
    await http().post('/assignments').set(T).send({ title: 'HW1', classroomId: room.id, questions: [{ text: 'bad', options: [{ text: 'x', isCorrect: true }, { text: 'y', isCorrect: true }] }] }).expect(400); // two correct -> rejected
    const hw = (await http().post('/assignments').set(T).send({ title: 'HW1', classroomId: room.id, questions }).expect(201)).body; // 5

    expect((await http().get('/assignments').set(T).expect(200)).body).toHaveLength(1);

    const P = { Authorization: `Bearer ${await login('p1@test.local', 'Parent#1234')}` };
    const kids = (await http().get('/me/children').set(P).expect(200)).body;
    expect(kids.map((k: any) => k.id)).toEqual([child.id]);
    const list = (await http().get(`/children/${child.id}/assignments`).set(P).expect(200)).body; // 6
    expect(list).toHaveLength(1); expect(list[0].status).toBe('PENDING');
    await http().get(`/children/${other.id}/assignments`).set(P).expect(403);                       // privacy

    const started = (await http().post(`/children/${child.id}/assignments/${hw.id}/start`).set(P).expect(201)).body; // 7
    expect(started.questions).toHaveLength(5);
    expect(JSON.stringify(started)).not.toContain('isCorrect');
    await http().post(`/children/${child.id}/assignments/${hw.id}/finish`).set(P).expect(400);      // not all answered

    for (let i = 0; i < 5; i++) {
      const q = started.questions[i];
      const opts = await prisma.questionOption.findMany({ where: { questionId: q.questionId } });
      const pick = opts.find((o) => (i < 3 ? o.isCorrect : !o.isCorrect))!;                          // 3 correct, 2 wrong
      const r = (await http().post(`/children/${child.id}/assignments/${hw.id}/answers`).set(P).send({ questionId: q.questionId, optionId: pick.id }).expect(201)).body;
      expect(r.points).toBe(i < 3 ? 10 : 0);
      if (i === 0) await http().post(`/children/${child.id}/assignments/${hw.id}/answers`).set(P).send({ questionId: q.questionId, optionId: pick.id }).expect(409); // no double answer
    }
    const res = (await http().post(`/children/${child.id}/assignments/${hw.id}/finish`).set(P).expect(201)).body; // 8
    expect(res).toMatchObject({ score: 30, correctCount: 3, wrongCount: 2 });

    const row = await prisma.childAssignment.findFirstOrThrow({ where: { childId: child.id } });     // 9
    expect(row.score).toBe(30); expect(row.status).toBe('COMPLETED');

    const view = (await http().get(`/results/assignments/${hw.id}`).set(T).expect(200)).body;         // 10
    expect(view.children.find((c: any) => c.childId === child.id)).toMatchObject({ status: 'COMPLETED', score: 30 });
    expect(view.children.find((c: any) => c.childId === other.id).status).toBe('PENDING');
    await http().get(`/results/assignments/${hw.id}`).set(P).expect(403);                              // parent can't use admin results
  });
});
