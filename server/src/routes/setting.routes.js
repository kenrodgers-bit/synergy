const express = require("express");

const Setting = require("../models/Setting");
const { authenticate, authorize } = require("../middleware/auth");
const { asyncRoute } = require("../utils/asyncRoute");

const router = express.Router();

router.get(
  "/public",
  asyncRoute(async (req, res) => {
    const settings = (await Setting.findOne()) || (await Setting.create({}));
    return res.json({
      companyName: settings.companyName,
      location: settings.location,
      contactEmail: settings.contactEmail,
      phoneNumber: settings.phoneNumber,
      whatsappNumber: settings.whatsappNumber,
      logoText: settings.logoText
    });
  })
);

router.use(authenticate);

router.get(
  "/global",
  asyncRoute(async (req, res) => {
    const settings = (await Setting.findOne()) || (await Setting.create({}));
    return res.json(settings);
  })
);

router.put(
  "/global",
  authorize("super-admin", "admin"),
  asyncRoute(async (req, res) => {
    const settings = (await Setting.findOne()) || (await Setting.create({}));

    [
      "companyName",
      "recyclerPricePerKg",
      "preparedBy",
      "location",
      "contactEmail",
      "phoneNumber",
      "whatsappNumber",
      "logoText",
      "proposalReferencePrefix"
    ].forEach((field) => {
      if (req.body[field] !== undefined) {
        settings[field] = req.body[field];
      }
    });

    await settings.save();
    return res.json(settings);
  })
);

module.exports = router;
