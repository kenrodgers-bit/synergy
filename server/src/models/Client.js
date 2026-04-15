const mongoose = require("mongoose");

const negotiationHistorySchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      default: Date.now
    },
    note: {
      type: String,
      required: true,
      trim: true
    },
    price: {
      type: Number,
      default: 0
    }
  },
  { _id: false }
);

const clientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    contactPerson: {
      type: String,
      required: true,
      trim: true
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
    clientType: {
      type: String,
      enum: ["school", "office", "home"],
      required: true
    },
    status: {
      type: String,
      enum: ["active", "prospect", "inactive"],
      default: "prospect"
    },
    agreedBuyingPricePerKg: {
      type: Number,
      default: 0
    },
    paymentModel: {
      type: String,
      enum: ["free-supply", "paid-per-kg", "custom-negotiated"],
      default: "free-supply"
    },
    notes: {
      type: String,
      default: ""
    },
    tags: {
      type: [String],
      default: []
    },
    negotiationHistory: {
      type: [negotiationHistorySchema],
      default: []
    },
    collectionFrequency: {
      type: String,
      enum: ["weekly", "bi-weekly", "monthly", "on-demand"],
      default: "monthly"
    },
    estimatedWasteOutput: {
      type: String,
      default: "Medium - 20 to 50 kg"
    },
    assignedAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    lastCollectionAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Client", clientSchema);

