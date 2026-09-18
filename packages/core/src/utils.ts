export function env(name: string, defaultVal?: string): string {
  const value = process.env[name];
  if (!value && defaultVal) return defaultVal;
  if (!value) throw new Error(`Environment variable [${name}] is not set`);
  return value;
}
