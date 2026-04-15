const mongoose = require("mongoose");

const collectionSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true
    },
    clientName: {
      type: String,
      required: true
    },
    clientType: {
      type: String,
      enum: ["school", "office", "home"],
      required: true
    },
    weightKg: {
      type: Number,
      required: true,
      min: 0
    },
    buyingPricePerKg: {
      type: Number,
      required: true,
      min: 0
    },
    recyclerPricePerKg: {
      type: Number,
      required: true,
      min: 0
    },
    totalCostPaid: {
      type: Number,
      required: true,
      min: 0
    },
    revenue: {
      type: Number,
      required: true,
      min: 0
    },
    logistics: {
      transportCost: { type: Number, default: 0 },
      loadingCost: { type: Number, default: 0 },
      miscellaneousCost: { type: Number, default: 0 }
    },
    logisticsTotal: {
      type: Number,
      default: 0
    },
    grossProfit: {
      type: Number,
      default: 0
    },
    netProfit: {
      type: Number,
      default: 0
    },
    notes: {
      type: String,
      default: ""
    },
    materialType: {
      type: String,
      default: "Mixed paper"
    },
    collectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    collectedByName: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Collection", collectionSchema);

