import { ModuleMetadata, Type } from '@nestjs/common/interfaces';

export interface GithubWebhookModuleOptions {
  webhookSecret: string;
}

export interface GithubWebhookOptionsFactory {
  createWebhookOptions():
    | Promise<GithubWebhookModuleOptions>
    | GithubWebhookModuleOptions;
}

export interface GithubWebhookAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<GithubWebhookOptionsFactory>;
  useClass?: Type<GithubWebhookOptionsFactory>;
  useFactory?: (
    ...args: any[]
  ) => Promise<GithubWebhookModuleOptions> | GithubWebhookModuleOptions;
  inject?: any[];
}
