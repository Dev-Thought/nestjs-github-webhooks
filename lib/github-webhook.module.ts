import { Module } from '@nestjs/common';
import { DynamicModule, Provider } from '@nestjs/common/interfaces';
import {
  GithubWebhookModuleOptions,
  GithubWebhookAsyncOptions,
  GithubWebhookOptionsFactory,
} from './interfaces/github-webhook-module-options.interface';
import { GITHUB_WEBHOOKS_OPTIONS } from './github-webhook.constants';
import { GithubGuard } from './services/github-webhook.guard';

@Module({
  providers: [GithubGuard],
  exports: [GithubGuard, GITHUB_WEBHOOKS_OPTIONS],
})
export class GithubWebhooksModule {
  static forRoot(options: GithubWebhookModuleOptions): DynamicModule {
    return {
      module: GithubWebhooksModule,
      providers: [
        {
          provide: GITHUB_WEBHOOKS_OPTIONS,
          useValue: options,
        },
      ],
    };
  }

  static forRootAsync(options: GithubWebhookAsyncOptions): DynamicModule {
    return {
      module: GithubWebhooksModule,
      imports: options.imports,
      providers: [...this.createAsyncProviders(options)],
    };
  }

  private static createAsyncProviders(
    options: GithubWebhookAsyncOptions,
  ): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)];
    }
    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: options.useClass,
        useClass: options.useClass,
      },
    ];
  }

  private static createAsyncOptionsProvider(
    options: GithubWebhookAsyncOptions,
  ): Provider {
    if (options.useFactory) {
      return {
        provide: GITHUB_WEBHOOKS_OPTIONS,
        useFactory: async (...args: any[]) => await options.useFactory(...args),
        inject: options.inject || [],
      };
    }
    return {
      provide: GITHUB_WEBHOOKS_OPTIONS,
      useFactory: async (optionsFactory: GithubWebhookOptionsFactory) =>
        await optionsFactory.createWebhookOptions(),
      inject: [options.useExisting || options.useClass],
    };
  }
}
