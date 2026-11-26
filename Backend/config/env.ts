function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value?.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  NODE_ENV:
    (process.env.NODE_ENV as "development" | "production" | "test") ??
    "development",
  get isProduction() {
    return this.NODE_ENV === "production";
  },
  get isDevelopment() {
    return this.NODE_ENV === "development";
  },
  get DATABASE_URL() {
    return getRequiredEnv("DATABASE_URL");
  },
  get JWT_SECRET() {
    return getRequiredEnv("JWT_SECRET");
  },
  get PORT() {
    const port = Number(process.env.PORT ?? 4000);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error("PORT must be an integer between 1 and 65535");
    }
    return port;
  },
  get CLIENT_ORIGINS() {
    return (process.env.CLIENT_ORIGINS ?? "http://localhost:3000")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean);
  },
} as const;
