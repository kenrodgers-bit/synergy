require("dotenv").config();

const mongoose = require("mongoose");

const { connectDatabase } = require("./config/db");
const { initializeDefaults } = require("./utils/initializeDefaults");

async function bootstrap() {
  await connectDatabase(process.env.MONGODB_URI);
  await initializeDefaults();

  await mongoose.connection.close();
}

bootstrap().catch(async (error) => {
  console.error("Bootstrap failed:", error);
  await mongoose.connection.close();
  process.exit(1);
});
