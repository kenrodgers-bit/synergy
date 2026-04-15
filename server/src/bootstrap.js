require("dotenv").config();

const mongoose = require("mongoose");

const { connectDatabase } = require("./config/db");
const User = require("./models/User");
const Setting = require("./models/Setting");

async function bootstrap() {
  await connectDatabase(process.env.MONGODB_URI);

  let settings = await Setting.findOne();

  if (!settings) {
    settings = await Setting.create({
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
    console.log("Created default Synergy settings.");
  } else {
    console.log("Settings already exist. Skipping settings creation.");
  }

  const adminEmail = process.env.BOOTSTRAP_ADMIN_EMAIL || "superadmin@synergy.co.ke";
  const adminPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD || "Synergy123!";
  const adminName = process.env.BOOTSTRAP_ADMIN_NAME || "Rodgers Synergy";
  const adminPhone = process.env.BOOTSTRAP_ADMIN_PHONE || "+254140205383";

  const existingUser = await User.findOne({ email: adminEmail.toLowerCase() });

  if (!existingUser) {
    await User.create({
      name: adminName,
      email: adminEmail.toLowerCase(),
      password: adminPassword,
      role: "super-admin",
      phoneNumber: adminPhone
    });

    console.log("Created initial Super Admin account.");
    console.log(`Login email: ${adminEmail}`);
    console.log(`Login password: ${adminPassword}`);
  } else {
    console.log(`User ${adminEmail} already exists. Skipping user creation.`);
  }

  await mongoose.connection.close();
}

bootstrap().catch(async (error) => {
  console.error("Bootstrap failed:", error);
  await mongoose.connection.close();
  process.exit(1);
});
