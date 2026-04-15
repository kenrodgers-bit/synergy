const express = require("express");

const Client = require("../models/Client");
const { authenticate, authorize } = require("../middleware/auth");
const { asyncRoute } = require("../utils/asyncRoute");
const { determinePaymentModel, toNumber } = require("../utils/calculations");

const router = express.Router();

function normalizeTags(tags) {
  if (Array.isArray(tags)) {
    return tags.filter(Boolean);
  }

  if (typeof tags === "string") {
    return tags
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function buildClientPayload(body) {
  const agreedBuyingPricePerKg = toNumber(body.agreedBuyingPricePerKg);
  return {
    name: String(body.name || "").trim(),
    contactPerson: String(body.contactPerson || "").trim(),
    phoneNumber: String(body.phoneNumber || "").trim(),
    email: String(body.email || "").trim().toLowerCase(),
    location: String(body.location || "").trim(),
    clientType: body.clientType,
    status: body.status,
    agreedBuyingPricePerKg,
    paymentModel: body.paymentModel || determinePaymentModel(agreedBuyingPricePerKg),
    notes: String(body.notes || "").trim(),
    tags: normalizeTags(body.tags),
    collectionFrequency: body.collectionFrequency || "monthly",
    estimatedWasteOutput: body.estimatedWasteOutput || "Medium - 20 to 50 kg",
    assignedAgent: body.assignedAgent || null
  };
}

router.use(authenticate);

router.get(
  "/",
  asyncRoute(async (req, res) => {
    const query = {};

    if (req.user.role === "collection-agent") {
      query.assignedAgent = req.user._id;
    }

    if (req.query.clientType) {
      query.clientType = req.query.clientType;
    }

    if (req.query.status) {
      query.status = req.query.status;
    }

    if (req.query.paymentModel) {
      query.paymentModel = req.query.paymentModel;
    }

    if (req.query.location) {
      query.location = new RegExp(req.query.location, "i");
    }

    if (req.query.search) {
      query.$or = [
        { name: new RegExp(req.query.search, "i") },
        { contactPerson: new RegExp(req.query.search, "i") },
        { location: new RegExp(req.query.search, "i") }
      ];
    }

    const clients = await Client.find(query)
      .populate("assignedAgent", "name email role")
      .sort({ createdAt: -1 });

    return res.json(clients);
  })
);

router.post(
  "/",
  authorize("super-admin", "admin"),
  asyncRoute(async (req, res) => {
    const payload = buildClientPayload(req.body);

    if (!payload.name || !payload.contactPerson || !payload.phoneNumber || !payload.location || !payload.clientType) {
      return res
        .status(400)
        .json({ message: "Name, contact person, phone number, location, and client type are required." });
    }

    const client = await Client.create({
      ...payload,
      negotiationHistory: req.body.initialNegotiationNote
        ? [
            {
              note: req.body.initialNegotiationNote,
              price: payload.agreedBuyingPricePerKg
            }
          ]
        : []
    });

    await client.populate("assignedAgent", "name email role");
    return res.status(201).json(client);
  })
);

router.put(
  "/:id",
  authorize("super-admin", "admin"),
  asyncRoute(async (req, res) => {
    const client = await Client.findById(req.params.id);

    if (!client) {
      return res.status(404).json({ message: "Client not found." });
    }

    Object.assign(client, buildClientPayload(req.body));
    await client.save();
    await client.populate("assignedAgent", "name email role");
    return res.json(client);
  })
);

router.post(
  "/:id/history",
  authorize("super-admin", "admin"),
  asyncRoute(async (req, res) => {
    const client = await Client.findById(req.params.id);

    if (!client) {
      return res.status(404).json({ message: "Client not found." });
    }

    const note = String(req.body.note || "").trim();

    if (!note) {
      return res.status(400).json({ message: "Negotiation note is required." });
    }

    client.negotiationHistory.unshift({
      note,
      price: req.body.price !== undefined ? toNumber(req.body.price) : client.agreedBuyingPricePerKg,
      date: req.body.date || new Date()
    });

    await client.save();
    await client.populate("assignedAgent", "name email role");
    return res.json(client);
  })
);

router.delete(
  "/:id",
  authorize("super-admin", "admin"),
  asyncRoute(async (req, res) => {
    const client = await Client.findByIdAndDelete(req.params.id);

    if (!client) {
      return res.status(404).json({ message: "Client not found." });
    }

    return res.json({ message: "Client deleted." });
  })
);

module.exports = router;
