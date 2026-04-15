const express = require("express");

const Client = require("../models/Client");
const Collection = require("../models/Collection");
const Inquiry = require("../models/Inquiry");
const Reminder = require("../models/Reminder");
const Setting = require("../models/Setting");
const { authenticate } = require("../middleware/auth");
const { asyncRoute } = require("../utils/asyncRoute");
const { buildAnalytics } = require("../utils/reporting");

const router = express.Router();

router.use(authenticate);

router.get(
  "/overview",
  asyncRoute(async (req, res) => {
    const clientQuery = req.user.role === "collection-agent" ? { assignedAgent: req.user._id } : {};
    const clients = await Client.find(clientQuery).populate("assignedAgent", "name role").lean();
    const clientIds = clients.map((client) => client._id);

    const collectionQuery = req.user.role === "collection-agent" ? { client: { $in: clientIds } } : {};
    const collections = await Collection.find(collectionQuery).lean();

    const reminderQuery =
      req.user.role === "collection-agent"
        ? {
            $or: [{ assignedTo: req.user._id }, { client: { $in: clientIds } }]
          }
        : {};

    const reminders = await Reminder.find(reminderQuery)
      .populate("client", "name clientType location assignedAgent")
      .populate("assignedTo", "name role")
      .lean();

    const inquiries =
      req.user.role === "collection-agent" ? [] : await Inquiry.find().sort({ createdAt: -1 }).lean();

    const settings = ((await Setting.findOne()) || {}).toObject?.() || {};

    return res.json(
      buildAnalytics({
        clients,
        collections,
        reminders,
        inquiries,
        settings
      })
    );
  })
);

module.exports = router;

