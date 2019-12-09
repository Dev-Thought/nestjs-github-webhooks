import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { createHmac } from 'crypto';
import { GithubWebhooksModule } from '../../lib';
import { AppController } from '../github-webhook/app.controller';

describe('GithubWebhook', () => {
  let app: INestApplication;
  const hmac = createHmac('sha1', 'SomeSecret');
  const digest =
    'sha1=' + hmac.update(JSON.stringify({ event: 'push' })).digest('hex');
  console.log = jest.fn().mockImplementation(console.log);

  describe('sync module import', () => {
    it(`should return 401 because of missing signature`, async () => {
      const app = await createApp();
      return request(app.getHttpServer())
        .post('/')
        .send()
        .expect(401, {
          statusCode: 401,
          error: 'Unauthorized',
          message: `This request doesn't contain a github signature`,
        });
    });

    it(`should return 401 because of missing webhook secret`, async () => {
      const module = await Test.createTestingModule({
        imports: [GithubWebhooksModule.forRoot({ webhookSecret: null })],
        controllers: [AppController],
      }).compile();

      app = module.createNestApplication();
      await app.init();

      await request(app.getHttpServer())
        .post('/')
        .set('X-Hub-Signature', 'sha1-123456789')
        .send()
        .expect(401, { statusCode: 401, error: 'Unauthorized' });
      expect(console.log).toHaveBeenCalledTimes(1);
    });

    it(`should return 401 because of unsupported github event`, async () => {
      const app = await createApp();
      return request(app.getHttpServer())
        .post('/withGithubEvent')
        .set('X-Hub-Signature', 'sha1-123456789')
        .set('X-Github-Event', 'issue')
        .send()
        .expect(401, {
          statusCode: 401,
          error: 'Unauthorized',
          message: `An unsupported webhook event was triggered`,
        });
    });

    it(`should return 201 with correct signature and secret`, () => {
      return request(app.getHttpServer())
        .post('/')
        .set('X-Hub-Signature', digest)
        .send({ event: 'push' })
        .expect(201, { event: 'push' });
    });

    it(`should return 201 on allowed events`, async () => {
      await request(app.getHttpServer())
        .post('/withGithubEvent')
        .set('X-Hub-Signature', digest)
        .set('X-Github-Event', 'push')
        .send({ event: 'push' })
        .expect(201, { event: 'push' });

      await request(app.getHttpServer())
        .post('/withGithubEvent')
        .set('X-Hub-Signature', digest)
        .set('X-Github-Event', 'pullrequest')
        .send({ event: 'push' })
        .expect(201, { event: 'push' });
    });
  });

  describe('async module import', () => {
    it('should return 201 with correct signature and secret', async () => {
      const app = await createApp(true);
      return request(app.getHttpServer())
        .post('/')
        .set('X-Hub-Signature', digest)
        .send({ event: 'push' })
        .expect(201, { event: 'push' });
    });
  });

  afterEach(async () => {
    await app.close();
  });

  async function createApp(async = false) {
    let module = Test.createTestingModule({
      imports: [GithubWebhooksModule.forRoot({ webhookSecret: 'SomeSecret' })],
      controllers: [AppController],
    });
    if (async) {
      module = Test.createTestingModule({
        imports: [
          GithubWebhooksModule.forRootAsync({
            useFactory: () => ({ webhookSecret: 'SomeSecret' }),
          }),
        ],
        controllers: [AppController],
      });
    }

    app = (await module.compile()).createNestApplication();
    await app.init();
    return app;
  }
});
