import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';

import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../src/modules/users/user.entity';

describe('Authorization & IDOR Protection (e2e)', () => {
  let app: INestApplication;
  let userACookies: string[];
  let userBCookies: string[];

  let userAProjectId: string;
  let userASectionId: string;
  let userALabelId: string;
  let userATaskId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    await app.init();

    const userRepo = app.get<Repository<User>>(getRepositoryToken(User));

    // 1. Register & Authenticate User A
    const userAEmail = `user_a_${Date.now()}@test.com`;
    const password = 'Password123!';

    const signUpResA = await request(app.getHttpServer())
      .post('/auth/sign-up')
      .send({ email: userAEmail, password, name: 'User A' })
      .expect(201);

    await userRepo.update({ id: signUpResA.body.id }, { isEmailVerified: true });

    const loginResA = await request(app.getHttpServer())
      .post('/auth/sign-in')
      .send({ email: userAEmail, password })
      .expect(201);

    userACookies = loginResA.headers['set-cookie'] as string[];

    // 2. Register & Authenticate User B
    const userBEmail = `user_b_${Date.now()}@test.com`;

    const signUpResB = await request(app.getHttpServer())
      .post('/auth/sign-up')
      .send({ email: userBEmail, password, name: 'User B' })
      .expect(201);

    await userRepo.update({ id: signUpResB.body.id }, { isEmailVerified: true });

    const loginResB = await request(app.getHttpServer())
      .post('/auth/sign-in')
      .send({ email: userBEmail, password })
      .expect(201);

    userBCookies = loginResB.headers['set-cookie'] as string[];

    // 3. User A creates resources: Project -> Section -> Label -> Task
    const projectRes = await request(app.getHttpServer())
      .post('/projects')
      .set('Cookie', userACookies)
      .send({ name: 'User A Private Project' })
      .expect(201);

    userAProjectId = projectRes.body.id;

    const sectionRes = await request(app.getHttpServer())
      .post('/sections')
      .set('Cookie', userACookies)
      .send({ projectId: userAProjectId, name: 'User A Section' })
      .expect(201);

    userASectionId = sectionRes.body.id;

    const labelRes = await request(app.getHttpServer())
      .post('/task-labels')
      .set('Cookie', userACookies)
      .send({ name: `Label-${Date.now()}` })
      .expect(201);

    userALabelId = labelRes.body.id;

    const taskRes = await request(app.getHttpServer())
      .post('/tasks')
      .set('Cookie', userACookies)
      .send({
        sectionId: userASectionId,
        title: 'User A Confidential Task',
        description: '',
        priority: 'high',
        timeRange: null,
        labels: [],
        reminders: [],
      })
      .expect(201);

    userATaskId = taskRes.body.id;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Projects Authorization', () => {
    it('User B cannot view User A project (returns 404)', async () => {
      await request(app.getHttpServer())
        .get(`/projects/${userAProjectId}`)
        .set('Cookie', userBCookies)
        .expect(404);
    });

    it('User B cannot update User A project (returns 404)', async () => {
      await request(app.getHttpServer())
        .patch(`/projects/${userAProjectId}`)
        .set('Cookie', userBCookies)
        .send({ name: 'Hacked Project' })
        .expect(404);
    });

    it('User B cannot delete User A project (returns 404)', async () => {
      await request(app.getHttpServer())
        .delete(`/projects/${userAProjectId}`)
        .set('Cookie', userBCookies)
        .expect(404);
    });
  });

  describe('Sections Authorization', () => {
    it('User B cannot update User A section (returns 404)', async () => {
      await request(app.getHttpServer())
        .patch(`/sections/${userASectionId}`)
        .set('Cookie', userBCookies)
        .send({ name: 'Hacked Section' })
        .expect(404);
    });

    it('User B cannot delete User A section (returns 404)', async () => {
      await request(app.getHttpServer())
        .delete(`/sections/${userASectionId}`)
        .set('Cookie', userBCookies)
        .expect(404);
    });
  });

  describe('Task Labels Authorization', () => {
    it('User B cannot view User A label (returns 404)', async () => {
      await request(app.getHttpServer())
        .get(`/task-labels/${userALabelId}`)
        .set('Cookie', userBCookies)
        .expect(404);
    });

    it('User B cannot delete User A label (returns 404)', async () => {
      await request(app.getHttpServer())
        .delete(`/task-labels/${userALabelId}`)
        .set('Cookie', userBCookies)
        .expect(404);
    });
  });

  describe('Tasks Authorization', () => {
    it('User B cannot update User A task (returns 404)', async () => {
      await request(app.getHttpServer())
        .patch(`/tasks/${userATaskId}`)
        .set('Cookie', userBCookies)
        .send({ title: 'Hacked Title' })
        .expect(404);
    });

    it('User B cannot delete User A task (returns 404)', async () => {
      await request(app.getHttpServer())
        .delete(`/tasks/${userATaskId}`)
        .set('Cookie', userBCookies)
        .expect(404);
    });

    it('User B cannot complete User A task (returns 404)', async () => {
      await request(app.getHttpServer())
        .post(`/tasks/${userATaskId}/occurrences/complete`)
        .set('Cookie', userBCookies)
        .send({})
        .expect(404);
    });

    it('User B cannot postpone User A task (returns 404)', async () => {
      await request(app.getHttpServer())
        .post(`/tasks/${userATaskId}/postpone`)
        .set('Cookie', userBCookies)
        .send({ postponeTo: new Date(Date.now() + 86400000).toISOString() })
        .expect(404);
    });
  });
});
