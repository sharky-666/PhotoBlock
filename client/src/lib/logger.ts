type LogArgument = unknown;

function emit(
  level: 'debug' | 'info' | 'warn' | 'error',
  args: LogArgument[],
): void {
  if (import.meta.env.PROD && level === 'debug') return;
  console[level](...args);
}

export const logger = {
  debug: (...args: LogArgument[]) => emit('debug', args),
  info: (...args: LogArgument[]) => emit('info', args),
  warn: (...args: LogArgument[]) => emit('warn', args),
  error: (...args: LogArgument[]) => emit('error', args),
};
