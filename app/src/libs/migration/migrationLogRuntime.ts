function getVercelEnv(): string | undefined {
  if (typeof process === 'undefined') {
    return undefined;
  }

  return process.env.NEXT_PUBLIC_VERCEL_ENV;
}

export function shouldSendMigrationLog(): boolean {
  const vercelEnv = getVercelEnv();
  return vercelEnv === 'preview' || vercelEnv === 'production';
}

export function shouldLogMigrationConsole(): boolean {
  return getVercelEnv() === 'preview';
}

export function logMigrationConsole(...args: Parameters<typeof console.info>): void {
  if (shouldLogMigrationConsole()) {
    console.info(...args);
  }
}
