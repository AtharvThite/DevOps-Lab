const app = require("./app");
const connectToDatabase = require("./config/db");
const config = require("./config/env");

async function startServer() {
  try {
    await connectToDatabase(config.mongoUri);
    app.listen(config.port, () => {
      console.log(`Backend listening on port ${config.port}`);
    });
  } catch (error) {
    console.error("Failed to start backend:", error.message);
    process.exit(1);
  }
}

startServer();
