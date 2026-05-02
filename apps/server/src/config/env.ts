interface AppEnv {
  NODE_ENV: 'development' | 'test' | 'production'
  HOST: string
  PORT: number
}

export const env: AppEnv = {
  NODE_ENV: (process.env['NODE_ENV'] as AppEnv['NODE_ENV'] | undefined) ?? 'development',
  HOST: process.env['HOST'] ?? '0.0.0.0',
  PORT: Number(process.env['PORT'] ?? 8083),
}
