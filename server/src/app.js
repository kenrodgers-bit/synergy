const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const clientRoutes = require("./routes/client.routes");
const collectionRoutes = require("./routes/collection.routes");
const analyticsRoutes = require("./routes/analytics.routes");
const documentRoutes = require("./routes/document.routes");
const inquiryRoutes = require("./routes/inquiry.routes");
const reminderRoutes = require("./routes/reminder.routes");
const settingRoutes = require("./routes/setting.routes");
const { errorHandler, notFound } = require("./middleware/errorHandler");

const app = express();
const clientDistPath = path.resolve(__dirname, "../../client/dist");
const clientIndexPath = path.join(clientDistPath, "index.html");

app.use(
  helmet({
    crossOriginResourcePolicy: false
  })
);
app.use(
  cors({
    origin(origin, callback) {
      const configuredOrigins = [
        process.env.CLIENT_URL,
        "http://localhost:5173",
        "http://127.0.0.1:5173"
      ].filter(Boolean);

      const isRenderOrigin = typeof origin === "string" && origin.endsWith(".onrender.com");

      if (!origin || configuredOrigins.includes(origin) || isRenderOrigin) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", name: "Synergy API" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/collections", collectionRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/inquiries", inquiryRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/settings", settingRoutes);

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
}

app.use(notFound);

app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ message: "The requested API resource was not found." });
  }

  if (fs.existsSync(clientIndexPath)) {
    return res.sendFile(clientIndexPath);
  }

  return res.status(404).json({ message: "Frontend build not found. Run npm run build --prefix client." });
});

app.use(errorHandler);

module.exports = app;
