import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Inject,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { createHmac } from 'crypto';
import { GithubWebhookModuleOptions } from '../interfaces/github-webhook-module-options.interface';
import {
  GITHUB_WEBHOOKS_OPTIONS,
  GITHUB_WEBHOOK_EVENTS,
} from '../github-webhook.constants';
import { Reflector } from '@nestjs/core';

@Injectable()
export class GithubGuard implements CanActivate {
  constructor(
    @Inject(GITHUB_WEBHOOKS_OPTIONS)
    private githubWebhookModuleOptions: GithubWebhookModuleOptions,
    private readonly reflector: Reflector,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const restrictedEvents = this.reflector.get<string[]>(
      GITHUB_WEBHOOK_EVENTS,
      context.getHandler(),
    );

    const request = context.switchToHttp().getRequest<Request>();

    const signature: string = request.headers['x-hub-signature'];
    const githubEvent: string = request.headers['x-github-event'];

    if (!signature) {
      throw new UnauthorizedException(
        `This request doesn't contain a github signature`,
      );
    }

    if (
      githubEvent &&
      restrictedEvents &&
      restrictedEvents.length > 0 &&
      restrictedEvents.find(
        event => event.toLowerCase() === githubEvent.toLowerCase(),
      ) === undefined
    ) {
      throw new UnauthorizedException(
        `An unsupported webhook event was triggered`,
      );
    }

    if (!this.githubWebhookModuleOptions.webhookSecret) {
      console.log(`There is no webhook secret set`);
      throw new UnauthorizedException();
    }

    return this.calculateSignature(
      signature,
      request.body,
      this.githubWebhookModuleOptions.webhookSecret,
    );
  }

  private calculateSignature(signature: string, payload: any, secret: string) {
    const hmac = createHmac('sha1', secret);
    const digest = 'sha1=' + hmac.update(JSON.stringify(payload)).digest('hex');
    if (!signature || !digest || signature !== digest) {
      throw new UnauthorizedException(
        `Request body digest (${digest}) does not match ${signature}`,
      );
    }

    return true;
  }
}
