/** @format */

const mongoose = require("mongoose");

/**
 * Connect to MongoDB Atlas.
 *
 * The original implementation terminated the entire process on connection
 * failure (`process.exit(1)`). This caused the backend to crash during start-up
 * when the Atlas cluster is unreachable, preventing the repertory endpoints –
 * which rely solely on local JSON data – from being served.
 *
 * The updated logic treats the database as an optional dependency. If the
 * connection succeeds we log a success message; if it fails we log the error
 * but **do not exit**. The server will continue to start, allowing the
 * repertory search and analysis functionality to operate independently of the
 * MongoDB connection.
 */
const connectDB = async () => {
  console.log("DB CONNECT START");
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      family: 4,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(
      "⚠️ MongoDB connection failed – proceeding without DB:",
      err.message
    );
    console.log("DB CONNECT FAILED BUT CONTINUING");
    // Optionally, you could set a flag here to indicate DB unavailability.
  }
};

module.exports = connectDB;
