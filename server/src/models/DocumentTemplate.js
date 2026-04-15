const mongoose = require("mongoose");

const templateSectionSchema = new mongoose.Schema(
  {
    heading: {
      type: String,
      required: true,
      trim: true
    },
    body: {
      type: String,
      required: true
    }
  },
  { _id: false }
);

const documentTemplateSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true
    },
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ""
    },
    title: {
      type: String,
      required: true
    },
    subtitle: {
      type: String,
      default: ""
    },
    intro: {
      type: String,
      default: ""
    },
    sections: {
      type: [templateSectionSchema],
      default: []
    },
    footer: {
      type: String,
      default: ""
    },
    signatureLabels: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("DocumentTemplate", documentTemplateSchema);

