const mongoose = require("mongoose");

const inquirySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    organizationName: {
      type: String,
      required: true,
      trim: true
    },
    organizationType: {
      type: String,
      enum: ["school", "office", "home"],
      required: true
    },
    inquiryType: {
      type: String,
      enum: ["pickup-request", "partnership-request", "general-inquiry"],
      required: true
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    location: {
      type: String,
      required: true,
      trim: true
    },
    estimatedWasteOutput: {
      type: String,
      default: "Not provided"
    },
    message: {
      type: String,
      default: ""
    },
    status: {
      type: String,
      enum: ["new", "contacted", "converted", "closed"],
      default: "new"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Inquiry", inquirySchema);

