const express = require("express");

const Inquiry = require("../models/Inquiry");
const { authenticate, authorize } = require("../middleware/auth");
const { asyncRoute } = require("../utils/asyncRoute");

const router = express.Router();

router.post(
  "/public",
  asyncRoute(async (req, res) => {
    const payload = {
      name: String(req.body.name || "").trim(),
      organizationName: String(req.body.organizationName || "").trim(),
      organizationType: req.body.organizationType,
      inquiryType: req.body.inquiryType,
      phoneNumber: String(req.body.phoneNumber || "").trim(),
      email: String(req.body.email || "").trim().toLowerCase(),
      location: String(req.body.location || "").trim(),
      estimatedWasteOutput: req.body.estimatedWasteOutput || "Not provided",
      message: String(req.body.message || "").trim()
    };

    if (
      !payload.name ||
      !payload.organizationName ||
      !payload.organizationType ||
      !payload.inquiryType ||
      !payload.phoneNumber ||
      !payload.location
    ) {
      return res.status(400).json({ message: "Please complete the required inquiry fields." });
    }

    const inquiry = await Inquiry.create(payload);
    return res.status(201).json(inquiry);
  })
);

router.get(
  "/",
  authenticate,
  authorize("super-admin", "admin"),
  asyncRoute(async (req, res) => {
    const query = {};

    if (req.query.status) {
      query.status = req.query.status;
    }

    const inquiries = await Inquiry.find(query).sort({ createdAt: -1 });
    return res.json(inquiries);
  })
);

router.put(
  "/:id",
  authenticate,
  authorize("super-admin", "admin"),
  asyncRoute(async (req, res) => {
    const inquiry = await Inquiry.findById(req.params.id);

    if (!inquiry) {
      return res.status(404).json({ message: "Inquiry not found." });
    }

    ["status", "message", "estimatedWasteOutput", "location"].forEach((field) => {
      if (req.body[field] !== undefined) {
        inquiry[field] = req.body[field];
      }
    });

    await inquiry.save();
    return res.json(inquiry);
  })
);

module.exports = router;

