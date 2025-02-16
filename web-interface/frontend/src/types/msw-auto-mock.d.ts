declare module 'msw-auto-mock' {
  import type { HttpResponse } from 'msw';

  type HandlerConfig<T> = {
    baseUrl: string;
    endpoints: {
      [K in keyof T]?: {
        [M in keyof T[K]]?: {
          success: (data: any) => HttpResponse;
          error: (config: { status?: number; message?: string }) => HttpResponse;
          loading: (config: { delay?: number }) => Promise<void>;
        }
      }
    }
  };

  export function generateHandlers<T>(config: HandlerConfig<T>): unknown[];
}
