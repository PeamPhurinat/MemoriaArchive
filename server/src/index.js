const { app, initializeStorage } = require("./app");
const { port } = require("./config/env");

const bootstrap = async () => {
  await initializeStorage();

  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`STT server running on http://localhost:${port}`);
  });
};

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start server:", error);
  process.exit(1);
});
