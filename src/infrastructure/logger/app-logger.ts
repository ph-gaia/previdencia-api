export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}

export class AppLogger implements Logger {
  constructor(private readonly prefix: string = 'PrevidenciaApp') {}

  debug(message: string, context: Record<string, unknown> = {}): void {
    this.print('debug', message, context);
  }

  info(message: string, context: Record<string, unknown> = {}): void {
    this.print('info', message, context);
  }

  warn(message: string, context: Record<string, unknown> = {}): void {
    this.print('warn', message, context);
  }

  error(message: string, context: Record<string, unknown> = {}): void {
    this.print('error', message, context);
  }

  private print(
    level: LogLevel,
    message: string,
    context: Record<string, unknown>,
  ): void {
    console[level](
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        prefix: this.prefix,
        message,
        ...context,
      }),
    );
  }
}
