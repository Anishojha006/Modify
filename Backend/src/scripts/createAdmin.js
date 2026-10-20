const path = require("node:path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const readline = require("node:readline/promises");
const { stdin, stdout } = require("node:process");

const Admin = require("../models/admin.model");

async function createAdmin() {
  const rl = readline.createInterface({ input: stdin, output: stdout });

  try {
    const username = (
      await rl.question("Enter admin username: ")
    ).trim();

    const password = await rl.question("Enter admin password: ");

    if (username.length < 3 || username.length > 10) {
      throw new Error("Username must be between 3 and 50 characters.");
    }

    if (password.length < 12) {
      throw new Error("Use an admin password of at least 12 characters.");
    }

    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI is not set in Backend/.env.");
    }

    await mongoose.connect(mongoUri);

    const existingAdmin = await Admin.findOne({ username });

    if (existingAdmin) {
      throw new Error("This admin username already exists.");
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await Admin.create({
      username,
      passwordHash,
      role: "admin",
    });

    console.log("Admin account created successfully.");
  } catch (error) {
    console.error("Admin setup failed:", error.message);
    process.exitCode = 1;
  } finally {
    rl.close();
    await mongoose.disconnect().catch(() => {});
  }
}

createAdmin();