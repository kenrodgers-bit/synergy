const defaultTemplates = [
  {
    slug: "collection-record",
    name: "Synergy Collection Record Form",
    description: "Print-ready paper collection form used during each pickup visit.",
    title: "Waste Paper Collection Record",
    subtitle: "To be completed and signed at every collection visit.",
    intro:
      "This collection record captures the materials received, the agreed payment arrangement, and the signatures required for accountability.",
    sections: [
      {
        heading: "Collection Details",
        body:
          "Client/School: {{client.name}}\nDate: {{collection.date}}\nCollected By: {{collection.collectedByName}}\nReference Number: {{document.referenceNumber}}\nClient Type: {{client.clientType}}\nLocation: {{client.location}}"
      },
      {
        heading: "Materials Collected",
        body:
          "Type of Material: {{document.materialType}}\nQuantity (kg): {{collection.weightKg}}\nBuying Price (KES/kg): {{collection.buyingPricePerKg}}\nTotal Cost Paid (KES): {{collection.totalCostPaid}}\nRemarks: {{collection.notes}}"
      },
      {
        heading: "Agreement Snapshot",
        body:
          "Payment Model: {{client.paymentModelLabel}}\nNegotiated Notes: {{client.notes}}\nRecycler Price (KES/kg): {{settings.recyclerPricePerKg}}\nNet Profit (KES): {{collection.netProfit}}"
      }
    ],
    footer:
      "Synergy records every collection for transparency, supplier trust, and accurate profit tracking.",
    signatureLabels: ["Client/School Representative", "Synergy Collector"]
  },
  {
    slug: "partnership-agreement",
    name: "Synergy Partnership Agreement",
    description: "Formal agreement for schools, offices, and homes joining the program.",
    title: "Waste Paper Collection Partnership Agreement",
    subtitle: "A structured collection agreement between Synergy and the client.",
    intro:
      "This agreement outlines collection responsibilities, schedule expectations, and the negotiated payment arrangement agreed with the client contact person.",
    sections: [
      {
        heading: "Parties to This Agreement",
        body:
          "Party A: Synergy Initiative represented by {{settings.preparedBy}}\nParty B: {{client.name}} represented by {{client.contactPerson}}"
      },
      {
        heading: "Purpose",
        body:
          "To establish a formal partnership for the collection and recycling of waste paper from {{client.name}} in a reliable, professional, and environmentally responsible manner."
      },
      {
        heading: "Client Responsibilities",
        body:
          "Provide a clear collection point.\nInform relevant staff or household members about the program.\nKeep paper ready before collection time.\nAvoid disposing of agreed material elsewhere during the partnership."
      },
      {
        heading: "Synergy Responsibilities",
        body:
          "Collect waste paper on the agreed schedule.\nHandle transportation and logistics.\nMaintain cleanliness during every visit.\nIssue a signed collection record form for each pickup."
      },
      {
        heading: "Buying Price Arrangement",
        body:
          "Negotiated buying price: KES {{client.agreedBuyingPricePerKg}} per kg.\nPayment model: {{client.paymentModelLabel}}.\nNegotiation notes: {{client.notes}}"
      },
      {
        heading: "Collection Schedule and Duration",
        body:
          "Preferred frequency: {{client.collectionFrequency}}\nStart date: {{document.startDate}}\nEnd date: {{document.endDate}}\nTermination notice: seven (7) days written or verbal notice."
      }
    ],
    footer:
      "Both parties confirm they have read, understood, and agreed to the terms of this partnership.",
    signatureLabels: ["Synergy Initiative", "Client Representative"]
  },
  {
    slug: "registration-form",
    name: "Synergy Registration Form",
    description: "Registration intake form for schools, offices, and homes.",
    title: "Synergy Registration Form",
    subtitle: "Complete this form to register for the Synergy Waste Paper Collection Program.",
    intro:
      "The registration form captures supplier details, estimated output, participation intent, and the collection setup preferred by the client.",
    sections: [
      {
        heading: "Client Details",
        body:
          "Name: {{client.name}}\nClient Type: {{client.clientType}}\nLocation: {{client.location}}\nContact Person: {{client.contactPerson}}\nPhone: {{client.phoneNumber}}\nEmail: {{client.email}}"
      },
      {
        heading: "Participation and Output",
        body:
          "Current status: {{client.status}}\nEstimated waste output: {{document.estimatedWasteOutput}}\nPreferred collection frequency: {{client.collectionFrequency}}\nPayment model: {{client.paymentModelLabel}}\nAgreed buying price: KES {{client.agreedBuyingPricePerKg}} per kg"
      },
      {
        heading: "Available Materials and Notes",
        body:
          "Material categories: Exercise books, textbooks, office paper, newspapers, cartons, and mixed paper.\nAdditional notes: {{client.notes}}"
      }
    ],
    footer:
      "By signing below, the client allows Synergy to collect waste paper from the premises according to the agreed schedule.",
    signatureLabels: ["Client Representative", "Synergy Representative"]
  },
  {
    slug: "school-proposal",
    name: "Synergy School Proposal",
    description: "Proposal document used when approaching schools and institutions.",
    title: "Waste Paper Collection & Recycling Partnership Proposal",
    subtitle: "Prepared for {{client.name}}",
    intro:
      "Synergy creates a structured system for collecting and recycling waste paper from schools and institutions across Kenya, helping clients maintain cleaner spaces while creating value through responsible recycling.",
    sections: [
      {
        heading: "About Synergy",
        body:
          "Synergy is a structured waste paper collection business serving schools, offices, and homes. We coordinate collection points, transport, aggregation, and recycling partner delivery with a professional service model."
      },
      {
        heading: "Purpose of This Program",
        body:
          "Improve cleanliness.\nProvide an organised collection system.\nPromote environmental responsibility.\nCreate value from materials that would otherwise go to waste."
      },
      {
        heading: "How the Program Works",
        body:
          "We help the client set up a collection point.\nA regular pickup schedule is agreed with the contact person.\nSynergy manages transport and logistics.\nCollected material is delivered to certified recycling partners."
      },
      {
        heading: "Benefits",
        body:
          "Clean spaces.\nZero extra work for the client.\nReliable pickups.\nA structured environmental program.\nPotential value through negotiated supply arrangements."
      },
      {
        heading: "Next Steps",
        body:
          "Complete the registration form and partnership agreement.\nConfirm a collection schedule.\nPrepare the first pickup.\nPrimary Synergy contact: {{settings.contactEmail}} / {{settings.whatsappNumber}}."
      }
    ],
    footer:
      "Prepared by Synergy for partnership consideration and program onboarding.",
    signatureLabels: ["Prepared by Synergy", "Client Acknowledgement"]
  }
];

module.exports = { defaultTemplates };

