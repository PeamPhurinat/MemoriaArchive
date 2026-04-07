const { app, initializeStorage } = require("./app");
const { port } = require("./config/env");

const listenAsync = (listenPort) =>
  new Promise((resolve, reject) => {
    const server = app.listen(listenPort);

    server.once("listening", () => resolve(server));
    server.once("error", reject);
  });

const bootstrap = async () => {
  await initializeStorage();

  await listenAsync(port);

  // eslint-disable-next-line no-console
  console.log(`STT server running on http://localhost:${port}`);
};

bootstrap().catch((error) => {
  if (error?.code === "EADDRINUSE") {
    // eslint-disable-next-line no-console
    console.error(
      `Failed to start server: port ${port} is already in use. ` +
      "Set a different SERVER_PORT in .env (for example 5001)."
    );
    process.exit(1);
    return;
  }

  // eslint-disable-next-line no-console
  console.error("Failed to start server:", error);
  process.exit(1);
});
