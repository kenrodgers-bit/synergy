require("dotenv").config();

const mongoose = require("mongoose");

const { connectDatabase } = require("./config/db");
const User = require("./models/User");
const Client = require("./models/Client");
const Collection = require("./models/Collection");
const Reminder = require("./models/Reminder");
const Inquiry = require("./models/Inquiry");
const Setting = require("./models/Setting");
const DocumentTemplate = require("./models/DocumentTemplate");
const { calculateCollectionFinancials, determinePaymentModel } = require("./utils/calculations");
const { defaultTemplates } = require("./utils/defaultTemplates");

function daysAgo(value) {
  return new Date(Date.now() - value * 24 * 60 * 60 * 1000);
}

async function seed() {
  await connectDatabase(process.env.MONGODB_URI);

  await Promise.all([
    Collection.deleteMany({}),
    Reminder.deleteMany({}),
    Inquiry.deleteMany({}),
    Client.deleteMany({}),
    User.deleteMany({}),
    Setting.deleteMany({}),
    DocumentTemplate.deleteMany({})
  ]);

  const [superAdmin, admin, agent] = await User.create([
    {
      name: "Rodgers Synergy",
      email: "superadmin@synergy.co.ke",
      password: "Synergy123!",
      role: "super-admin",
      phoneNumber: "+254700111222"
    },
    {
      name: "Grace Mutuma",
      email: "admin@synergy.co.ke",
      password: "Synergy123!",
      role: "admin",
      phoneNumber: "+254711222333"
    },
    {
      name: "Dennis Muriuki",
      email: "agent@synergy.co.ke",
      password: "Synergy123!",
      role: "collection-agent",
      phoneNumber: "+254722333444"
    }
  ]);

  const settings = await Setting.create({
    companyName: "Synergy",
    recyclerPricePerKg: 28,
    preparedBy: "Rodgers",
    location: "Meru Town",
    contactEmail: "+254795577637",
    phoneNumber: "+254140205383",
    whatsappNumber: "+254795577637",
    logoText: "Synergy Turning waste into value",
    proposalReferencePrefix: "SYN"
  });

  await DocumentTemplate.insertMany(defaultTemplates);

  const clientSeed = [
    {
      name: "Makutano Girls Secondary School",
      contactPerson: "Mrs. Kagendo",
      phoneNumber: "+254701000111",
      email: "makutanogirls@example.com",
      location: "Meru Town",
      clientType: "school",
      status: "active",
      agreedBuyingPricePerKg: 0,
      notes: "School prefers free supply in exchange for reliable termly pickups.",
      tags: ["active-supplier"],
      collectionFrequency: "monthly",
      estimatedWasteOutput: "High - 50 kg and above",
      assignedAgent: agent._id
    },
    {
      name: "Starlight Academy",
      contactPerson: "Mr. Njue",
      phoneNumber: "+254701000222",
      email: "starlight@example.com",
      location: "Nkubu",
      clientType: "school",
      status: "active",
      agreedBuyingPricePerKg: 5,
      notes: "KES 5 per kg agreed with the principal after pilot collections.",
      tags: ["active-supplier"],
      collectionFrequency: "bi-weekly",
      estimatedWasteOutput: "Medium - 20 to 50 kg",
      assignedAgent: agent._id
    },
    {
      name: "Meru Heights Office Park",
      contactPerson: "Faith Mwiti",
      phoneNumber: "+254701000333",
      email: "meruheights@example.com",
      location: "Meru CBD",
      clientType: "office",
      status: "active",
      agreedBuyingPricePerKg: 7,
      notes: "Office requires monthly statements and prompt payment.",
      tags: ["high-output"],
      collectionFrequency: "weekly",
      estimatedWasteOutput: "High - 50 kg and above",
      assignedAgent: agent._id
    },
    {
      name: "Green Valley Apartments",
      contactPerson: "Janet Kendi",
      phoneNumber: "+254701000444",
      email: "greenvalley@example.com",
      location: "Nairobi - Kasarani",
      clientType: "home",
      status: "active",
      agreedBuyingPricePerKg: 3,
      notes: "Custom negotiated rate because pickups are bundled with two neighbouring homes.",
      tags: ["low-output"],
      collectionFrequency: "monthly",
      estimatedWasteOutput: "Low - 1 to 20 kg",
      assignedAgent: agent._id
    },
    {
      name: "Beacon Preparatory",
      contactPerson: "Ms. Mwangi",
      phoneNumber: "+254701000555",
      email: "beaconprep@example.com",
      location: "Maua",
      clientType: "school",
      status: "prospect",
      agreedBuyingPricePerKg: 0,
      notes: "Requested a proposal before confirming participation.",
      tags: ["pending-agreement"],
      collectionFrequency: "monthly",
      estimatedWasteOutput: "Medium - 20 to 50 kg",
      assignedAgent: agent._id
    },
    {
      name: "Alpha Legal Chambers",
      contactPerson: "Brian Kibet",
      phoneNumber: "+254701000666",
      email: "alpha.legal@example.com",
      location: "Nairobi - Westlands",
      clientType: "office",
      status: "inactive",
      agreedBuyingPricePerKg: 5,
      notes: "Paused collections during office renovation.",
      tags: ["pending-agreement"],
      collectionFrequency: "monthly",
      estimatedWasteOutput: "Medium - 20 to 50 kg",
      assignedAgent: agent._id
    }
  ].map((client) => ({
    ...client,
    paymentModel: determinePaymentModel(client.agreedBuyingPricePerKg),
    negotiationHistory: [
      {
        date: daysAgo(45),
        note: client.notes,
        price: client.agreedBuyingPricePerKg
      }
    ]
  }));

  const clients = await Client.create(clientSeed);
  const clientMap = Object.fromEntries(clients.map((client) => [client.name, client]));

  const collectionSeed = [
    {
      clientName: "Makutano Girls Secondary School",
      days: 32,
      weightKg: 112,
      transportCost: 1200,
      loadingCost: 300,
      miscellaneousCost: 150,
      notes: "Term one textbook and exercise book clearance."
    },
    {
      clientName: "Starlight Academy",
      days: 26,
      weightKg: 54,
      transportCost: 600,
      loadingCost: 150,
      miscellaneousCost: 0,
      notes: "Bi-weekly pickup after classroom clean-up."
    },
    {
      clientName: "Meru Heights Office Park",
      days: 20,
      weightKg: 89,
      transportCost: 450,
      loadingCost: 200,
      miscellaneousCost: 100,
      notes: "Office archive paper and carton packaging."
    },
    {
      clientName: "Green Valley Apartments",
      days: 16,
      weightKg: 18,
      transportCost: 250,
      loadingCost: 0,
      miscellaneousCost: 50,
      notes: "Mixed household paper."
    },
    {
      clientName: "Starlight Academy",
      days: 10,
      weightKg: 37,
      transportCost: 450,
      loadingCost: 100,
      miscellaneousCost: 0,
      notes: "Short-interval pickup before exams."
    },
    {
      clientName: "Meru Heights Office Park",
      days: 7,
      weightKg: 102,
      transportCost: 550,
      loadingCost: 220,
      miscellaneousCost: 120,
      notes: "Month-end paper purge."
    },
    {
      clientName: "Makutano Girls Secondary School",
      days: 4,
      weightKg: 76,
      transportCost: 900,
      loadingCost: 250,
      miscellaneousCost: 0,
      notes: "Staff room and library paper collection."
    }
  ];

  for (const item of collectionSeed) {
    const client = clientMap[item.clientName];
    const financials = calculateCollectionFinancials({
      weightKg: item.weightKg,
      buyingPricePerKg: client.agreedBuyingPricePerKg,
      recyclerPricePerKg: settings.recyclerPricePerKg,
      transportCost: item.transportCost,
      loadingCost: item.loadingCost,
      miscellaneousCost: item.miscellaneousCost
    });

    const collection = await Collection.create({
      date: daysAgo(item.days),
      client: client._id,
      clientName: client.name,
      clientType: client.clientType,
      materialType: "Mixed paper",
      notes: item.notes,
      collectedBy: agent._id,
      collectedByName: agent.name,
      ...financials
    });

    client.lastCollectionAt = collection.date;
    await client.save();
  }

  await Reminder.create([
    {
      title: "Follow up on proposal feedback",
      note: "Call the principal and confirm whether the board approved the program.",
      dueDate: daysAgo(-2),
      frequency: "one-time",
      status: "pending",
      client: clientMap["Beacon Preparatory"]._id,
      assignedTo: admin._id
    },
    {
      title: "Monthly school pickup",
      note: "Prepare collection record and confirm gate access.",
      dueDate: daysAgo(-5),
      frequency: "monthly",
      status: "pending",
      client: clientMap["Makutano Girls Secondary School"]._id,
      assignedTo: agent._id
    }
  ]);

  await Inquiry.create([
    {
      name: "Lucy Nthiga",
      organizationName: "Cedar Ridge School",
      organizationType: "school",
      inquiryType: "partnership-request",
      phoneNumber: "+254733444555",
      email: "lucy@cedarridge.ac.ke",
      location: "Thika",
      estimatedWasteOutput: "High - 50 kg and above",
      message: "We would like a proposal and a discussion on monthly collections."
    },
    {
      name: "Samuel Maina",
      organizationName: "Bright House",
      organizationType: "home",
      inquiryType: "pickup-request",
      phoneNumber: "+254744555666",
      email: "samuel@example.com",
      location: "Meru",
      estimatedWasteOutput: "Low - 1 to 20 kg",
      message: "Need a home pickup next week."
    }
  ]);

  console.log("Seed complete.");
  console.log("Super Admin:", superAdmin.email, " / Synergy123!");
  console.log("Admin:", admin.email, " / Synergy123!");
  console.log("Agent:", agent.email, " / Synergy123!");

  await mongoose.connection.close();
}

seed().catch(async (error) => {
  console.error("Seed failed:", error);
  await mongoose.connection.close();
  process.exit(1);
});
