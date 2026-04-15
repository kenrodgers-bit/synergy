const mongoose = require("mongoose");

const reminderSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    note: {
      type: String,
      default: ""
    },
    dueDate: {
      type: Date,
      required: true
    },
    frequency: {
      type: String,
      enum: ["one-time", "weekly", "bi-weekly", "monthly"],
      default: "one-time"
    },
    status: {
      type: String,
      enum: ["pending", "completed", "skipped"],
      default: "pending"
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Reminder", reminderSchema);

