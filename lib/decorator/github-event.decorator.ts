import { SetMetadata } from '@nestjs/common';
import { GITHUB_WEBHOOK_EVENTS } from '../github-webhook.constants';

export const GithubWebhookEvents = (events: string[]) =>
  SetMetadata(GITHUB_WEBHOOK_EVENTS, events);
