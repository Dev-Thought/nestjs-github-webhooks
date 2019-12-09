import { Post, Body, UseGuards, Controller } from '@nestjs/common';
import { GithubGuard, GithubWebhookEvents } from '../../lib';

@Controller('')
export class AppController {
  @UseGuards(GithubGuard)
  @Post()
  hookedByGithub(@Body() body: any) {
    return body;
  }

  @UseGuards(GithubGuard)
  @GithubWebhookEvents(['push', 'pullrequest'])
  @Post('withGithubEvent')
  withGithubEvent(@Body() body: any) {
    return body;
  }
}
