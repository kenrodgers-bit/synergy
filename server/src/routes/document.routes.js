const express = require("express");

const DocumentTemplate = require("../models/DocumentTemplate");
const { authenticate, authorize } = require("../middleware/auth");
const { asyncRoute } = require("../utils/asyncRoute");
const { defaultTemplates } = require("../utils/defaultTemplates");

const router = express.Router();

async function ensureTemplates() {
  const existingTemplates = await DocumentTemplate.find();

  if (existingTemplates.length === 0) {
    await DocumentTemplate.insertMany(defaultTemplates);
    return DocumentTemplate.find().sort({ name: 1 });
  }

  return existingTemplates.sort((a, b) => a.name.localeCompare(b.name));
}

router.use(authenticate);

router.get(
  "/templates",
  asyncRoute(async (req, res) => {
    const templates = await ensureTemplates();
    return res.json(templates);
  })
);

router.put(
  "/templates/:slug",
  authorize("super-admin", "admin"),
  asyncRoute(async (req, res) => {
    const updates = {
      name: req.body.name,
      description: req.body.description,
      title: req.body.title,
      subtitle: req.body.subtitle,
      intro: req.body.intro,
      sections: Array.isArray(req.body.sections) ? req.body.sections : [],
      footer: req.body.footer,
      signatureLabels: Array.isArray(req.body.signatureLabels) ? req.body.signatureLabels : []
    };

    const template = await DocumentTemplate.findOneAndUpdate({ slug: req.params.slug }, updates, {
      new: true,
      upsert: true,
      runValidators: true
    });

    return res.json(template);
  })
);

module.exports = router;
