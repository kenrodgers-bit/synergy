const mongoose = require("mongoose");

async function connectDatabase(uri) {
  if (!uri) {
    throw new Error("MONGODB_URI is not defined");
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  return mongoose.connection;
}

module.exports = { connectDatabase };

