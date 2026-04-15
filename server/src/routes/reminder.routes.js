const express = require("express");

const Reminder = require("../models/Reminder");
const Client = require("../models/Client");
const { authenticate, authorize } = require("../middleware/auth");
const { asyncRoute } = require("../utils/asyncRoute");

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  asyncRoute(async (req, res) => {
    const query =
      req.user.role === "collection-agent"
        ? {
            $or: [{ assignedTo: req.user._id }, { assignedTo: null }]
          }
        : {};

    const reminders = await Reminder.find(query)
      .populate("client", "name clientType location assignedAgent")
      .populate("assignedTo", "name role")
      .sort({ dueDate: 1 });

    const filteredReminders =
      req.user.role === "collection-agent"
        ? reminders.filter(
            (reminder) =>
              String(reminder.client?.assignedAgent || "") === String(req.user._id) ||
              String(reminder.assignedTo?._id || "") === String(req.user._id)
          )
        : reminders;

    return res.json(filteredReminders);
  })
);

router.post(
  "/",
  authorize("super-admin", "admin"),
  asyncRoute(async (req, res) => {
    const client = await Client.findById(req.body.clientId);

    if (!client) {
      return res.status(404).json({ message: "Client not found." });
    }

    const reminder = await Reminder.create({
      title: req.body.title,
      note: req.body.note || "",
      dueDate: req.body.dueDate,
      frequency: req.body.frequency || "one-time",
      status: req.body.status || "pending",
      client: client._id,
      assignedTo: req.body.assignedTo || client.assignedAgent || null
    });

    await reminder.populate("client", "name clientType location");
    await reminder.populate("assignedTo", "name role");
    return res.status(201).json(reminder);
  })
);

router.put(
  "/:id",
  asyncRoute(async (req, res) => {
    const reminder = await Reminder.findById(req.params.id).populate("client", "assignedAgent");

    if (!reminder) {
      return res.status(404).json({ message: "Reminder not found." });
    }

    const isOwner =
      req.user.role !== "collection-agent" ||
      String(reminder.assignedTo || "") === String(req.user._id) ||
      String(reminder.client?.assignedAgent || "") === String(req.user._id);

    if (!isOwner) {
      return res.status(403).json({ message: "You do not have permission to update this reminder." });
    }

    const editableFields =
      req.user.role === "collection-agent"
        ? ["status", "note"]
        : ["title", "note", "dueDate", "frequency", "status", "assignedTo"];

    editableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        reminder[field] = req.body[field];
      }
    });

    await reminder.save();
    await reminder.populate("client", "name clientType location");
    await reminder.populate("assignedTo", "name role");
    return res.json(reminder);
  })
);

router.delete(
  "/:id",
  authorize("super-admin", "admin"),
  asyncRoute(async (req, res) => {
    const reminder = await Reminder.findByIdAndDelete(req.params.id);

    if (!reminder) {
      return res.status(404).json({ message: "Reminder not found." });
    }

    return res.json({ message: "Reminder deleted." });
  })
);

module.exports = router;

