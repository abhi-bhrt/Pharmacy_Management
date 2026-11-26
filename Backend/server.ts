import dotenv from "dotenv";

dotenv.config({ path: [".env.local", ".env"] });

async function startServer() {
  const [{ createApp }, { env }] = await Promise.all([
    import("./app"),
    import("./config/env"),
  ]);
  const app = createApp();
  const server = app.listen(env.PORT, () => {
    console.log(`Pharmacy API listening on port ${env.PORT}`);
  });

  const shutdown = () => {
    server.close(() => {
      void import("./lib/db/client").then(({ prisma }) => prisma.$disconnect());
    });
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

void startServer().catch((error: unknown) => {
  console.error("Failed to start Pharmacy API:", error);
  process.exitCode = 1;
});