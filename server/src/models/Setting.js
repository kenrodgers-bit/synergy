const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      default: "Synergy"
    },
    recyclerPricePerKg: {
      type: Number,
      default: 28
    },
    preparedBy: {
      type: String,
      default: "Rodgers"
    },
    location: {
      type: String,
      default: "Meru Town"
    },
    contactEmail: {
      type: String,
      default: "+254795577637"
    },
    phoneNumber: {
      type: String,
      default: "+254140205383"
    },
    whatsappNumber: {
      type: String,
      default: "+254795577637"
    },
    logoText: {
      type: String,
      default: "Synergy Turning waste into value"
    },
    proposalReferencePrefix: {
      type: String,
      default: "SYN"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Setting", settingSchema);
