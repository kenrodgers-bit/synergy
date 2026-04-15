const express = require("express");

const Client = require("../models/Client");
const Collection = require("../models/Collection");
const Setting = require("../models/Setting");
const User = require("../models/User");
const { authenticate, authorize } = require("../middleware/auth");
const { asyncRoute } = require("../utils/asyncRoute");
const { calculateCollectionFinancials } = require("../utils/calculations");

const router = express.Router();

async function getAccessibleClientIds(user) {
  if (user.role !== "collection-agent") {
    return null;
  }

  const clients = await Client.find({ assignedAgent: user._id }).select("_id");
  return clients.map((client) => client._id);
}

router.use(authenticate);

router.get(
  "/",
  asyncRoute(async (req, res) => {
    const query = {};

    if (req.query.clientId) {
      query.client = req.query.clientId;
    }

    if (req.query.startDate || req.query.endDate) {
      query.date = {};
      if (req.query.startDate) {
        query.date.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        query.date.$lte = new Date(req.query.endDate);
      }
    }

    if (req.user.role === "collection-agent") {
      const accessibleClientIds = await getAccessibleClientIds(req.user);
      query.client = query.client
        ? { $in: accessibleClientIds.filter((id) => String(id) === String(query.client)) }
        : { $in: accessibleClientIds };
    }

    const collections = await Collection.find(query)
      .populate("client", "name clientType location status assignedAgent")
      .populate("collectedBy", "name role")
      .sort({ date: -1 });

    return res.json(collections);
  })
);

router.post(
  "/",
  authorize("super-admin", "admin", "collection-agent"),
  asyncRoute(async (req, res) => {
    const client = await Client.findById(req.body.clientId);

    if (!client) {
      return res.status(404).json({ message: "Client not found." });
    }

    if (req.user.role === "collection-agent" && String(client.assignedAgent) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can only record collections for your assigned clients." });
    }

    const settings = (await Setting.findOne()) || (await Setting.create({}));
    let collector = req.user;

    if (req.body.collectedById && req.user.role !== "collection-agent") {
      const selectedCollector = await User.findById(req.body.collectedById).select("name role");
      if (selectedCollector) {
        collector = selectedCollector;
      }
    }

    const financials = calculateCollectionFinancials({
      weightKg: req.body.weightKg,
      buyingPricePerKg:
        req.body.buyingPricePerKg !== undefined ? req.body.buyingPricePerKg : client.agreedBuyingPricePerKg,
      recyclerPricePerKg: settings.recyclerPricePerKg,
      transportCost: req.body.transportCost,
      loadingCost: req.body.loadingCost,
      miscellaneousCost: req.body.miscellaneousCost
    });

    const collection = await Collection.create({
      date: req.body.date || new Date(),
      client: client._id,
      clientName: client.name,
      clientType: client.clientType,
      materialType: req.body.materialType || "Mixed paper",
      notes: req.body.notes || "",
      collectedBy: collector._id,
      collectedByName: collector.name,
      ...financials
    });

    client.lastCollectionAt = collection.date;
    await client.save();

    await collection.populate("client", "name clientType location status assignedAgent");
    await collection.populate("collectedBy", "name role");

    return res.status(201).json(collection);
  })
);

router.put(
  "/:id",
  authorize("super-admin", "admin"),
  asyncRoute(async (req, res) => {
    const collection = await Collection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({ message: "Collection not found." });
    }

    const client = await Client.findById(req.body.clientId || collection.client);

    if (!client) {
      return res.status(404).json({ message: "Client not found." });
    }

    const settings = (await Setting.findOne()) || (await Setting.create({}));
    const collector = req.body.collectedById
      ? await User.findById(req.body.collectedById).select("name role")
      : await User.findById(collection.collectedBy).select("name role");

    const financials = calculateCollectionFinancials({
      weightKg: req.body.weightKg !== undefined ? req.body.weightKg : collection.weightKg,
      buyingPricePerKg:
        req.body.buyingPricePerKg !== undefined ? req.body.buyingPricePerKg : collection.buyingPricePerKg,
      recyclerPricePerKg: settings.recyclerPricePerKg,
      transportCost:
        req.body.transportCost !== undefined ? req.body.transportCost : collection.logistics.transportCost,
      loadingCost: req.body.loadingCost !== undefined ? req.body.loadingCost : collection.logistics.loadingCost,
      miscellaneousCost:
        req.body.miscellaneousCost !== undefined
          ? req.body.miscellaneousCost
          : collection.logistics.miscellaneousCost
    });

    Object.assign(collection, {
      date: req.body.date || collection.date,
      client: client._id,
      clientName: client.name,
      clientType: client.clientType,
      materialType: req.body.materialType || collection.materialType,
      notes: req.body.notes !== undefined ? req.body.notes : collection.notes,
      collectedBy: collector ? collector._id : collection.collectedBy,
      collectedByName: collector ? collector.name : collection.collectedByName,
      ...financials
    });

    await collection.save();
    client.lastCollectionAt = collection.date;
    await client.save();
    await collection.populate("client", "name clientType location status assignedAgent");
    await collection.populate("collectedBy", "name role");

    return res.json(collection);
  })
);

router.delete(
  "/:id",
  authorize("super-admin", "admin"),
  asyncRoute(async (req, res) => {
    const collection = await Collection.findByIdAndDelete(req.params.id);

    if (!collection) {
      return res.status(404).json({ message: "Collection not found." });
    }

    return res.json({ message: "Collection deleted." });
  })
);

module.exports = router;

