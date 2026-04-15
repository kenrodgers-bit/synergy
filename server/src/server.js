require("dotenv").config();

const app = require("./app");
const { connectDatabase } = require("./config/db");
const { initializeDefaults } = require("./utils/initializeDefaults");

const port = Number(process.env.PORT || 5000);

async function startServer() {
  await connectDatabase(process.env.MONGODB_URI);
  await initializeDefaults();

  app.listen(port, () => {
    console.log(`Synergy API running on port ${port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start Synergy API:", error.message);
  process.exit(1);
});
