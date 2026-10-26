const mongoose = require("mongoose");
const dns = require("node:dns");

const connectToDB = async () => {
    const configuredDnsServers = process.env.MONGODB_DNS_SERVERS
        ?.split(",")
        .map((server) => server.trim())
        .filter(Boolean);

    if (configuredDnsServers?.length) {
        dns.setServers(configuredDnsServers);
    }

    await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 10_000,
    });
    console.log("Connected to database");
};

module.exports = connectToDB;
