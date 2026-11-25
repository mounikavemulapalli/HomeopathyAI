/** @format */
require("dotenv").config({
  path: require("path").resolve(__dirname, ".env"),
});

const express = require("express");
const cors = require("cors");
const path = require("path");

// --- INFRASTRUCTURE IMPORTS ---
const connectDB = require("./config/db"); // MongoDB Connection
const { loadMasterRepertory } = require("./services/repertoryLoaderService.cjs");

// --- ROUTE IMPORTS ---
const repertoryRoutes = require("./routes/repertoryRoutes.js");
const { generateRubricSuggestionsFromCase } = require("./controllers/repertoryController.js");
const authMiddleware = require("./middleware/middleware");
const generateSummaryRoute = require("./routes/generate-summary");
const imageDiagnosisRoute = require("./routes/imageDiagnosis");

// Original Server Routes Fallbacks
const authRoutes = require("./routes/authRoutes");
const patientRoutes = require("./routes/patientRoutes");
const caseRoutes = require("./routes/caseRoutes");
const followupRoutes = require("./routes/followupRoutes");

// --- INITIALIZE APP ---
const app = express();
const PORT = process.env.PORT || 5000;

// --- CONNECT MONGO DATABASE ---
console.log("DB CONNECT START"); // Added for explicit logging
connectDB().catch((err) => {
  console.warn("MongoDB unavailable, continuing without DB (from server.js catch)");
  // You could optionally set a flag here to indicate DB unavailability
});

// --- LOAD MASTER REPERTORY ---
let masterRepertory = [];
let loadedCounts = { TOTAL: 0 };

(async () => {
  try {
    const result = await loadMasterRepertory();
    // ===== TEMP AUDIT START =====
    console.log(`1. masterRepertory.length immediately after loadMasterRepertory(): ${result.masterRepertory ? result.masterRepertory.length : result.length}`);
    // ===== TEMP AUDIT END =====
    masterRepertory = result.masterRepertory || result;
    loadedCounts = result.loadedCounts || {
      TOTAL: (masterRepertory && masterRepertory.length) ? masterRepertory.length : 0
    };
    global.masterRepertory = masterRepertory;
    // ===== TEMP AUDIT START =====
    console.log(`2. global.masterRepertory.length after assignment: ${global.masterRepertory.length}`);

    const sources = {};
    global.masterRepertory.forEach(rubric => {
      if (rubric.source) {
        sources[rubric.source] = (sources[rubric.source] || 0) + 1;
      }
    });
    console.log("5. First 5 source values:");
    Object.keys(sources).slice(0, 5).forEach(source => console.log(source));
    console.log("4. Counts grouped by source:");
    for (const source in sources) {
      console.log(`${source} = ${sources[source]}`);
    }
    // ===== TEMP AUDIT END =====

    console.log("\n--- Master Repertory Loading Summary ---");
    for (const source in loadedCounts) {
      if (source !== "TOTAL") {
        console.log(`✅ ${source} Loaded: ${loadedCounts[source]}`);
      }
    }
    console.log(`✅ TOTAL MASTER RUBRICS: ${loadedCounts.TOTAL}`);
    console.log("--------------------------------------\n");

  } catch (error) {
    console.error("Error loading master repertory:", error);
  }
})();

// --- CORS CONFIGURATION ---
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:3000",
      "http://localhost:5000",
      "https://homeopathy-ai-kohl.vercel.app",
      "https://homeopathy-ai-chi.vercel.app",
      "https://homeopathyai.onrender.com",
      "https://homeopathyai-mo49.onrender.com",
      "https://www.srisuryahomeoai.com",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);

// --- PARSERS & STATIC ASSETS ---
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));
app.use("/uploads", express.static(path.join(__dirname, "/uploads")));

// --- API ROUTES JUNCTION ---
app.use("/api/analyze-case", repertoryRoutes);
app.use("/api", repertoryRoutes);
// Explicitly handle the AI rubric generation route to avoid conflicts
app.post("/api/ai-rubrics/generate", generateRubricSuggestionsFromCase);


// Original Architecture Mappings
app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/cases", caseRoutes);
app.use("/api/submit-case", caseRoutes);
app.use("/api/followups", followupRoutes);

// Dual mapping for summary generation (Gemini Safety Layer)
app.use("/api/generatesummary", generateSummaryRoute);
app.use("/api/generate-summary", generateSummaryRoute);
app.use("/api/diagnose", imageDiagnosisRoute);

console.log("✅ Registered Unified API Routes (SQLite completely removed)");

// --- BASE LIVING CHECK ---
app.get("/", (req, res) => {
  res.json({
    message: "HomeopathyAi JSON-First Backend is running successfully!",
    database: "MongoDB Connected",
    engine: "3.2 Lakh Rubrics In-Memory FlexSearch",
  });
});

// --- ERROR HANDLING MIDDLEWARE ---
app.use((err, req, res, next) => {
  console.error("❌ Backend Error:", err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Internal Server Error",
  });
});

// --- SERVER STARTUP ---
let serverInstance;
if (require.main === module) {
  // This block will only be executed if server.js is run directly
  serverInstance = app.listen(PORT, () => {
    console.log(`🚀 SERVER PERSISTENT on http://localhost:${PORT}`);
    console.log("🔥 EXPRESS SERVER STARTED SUCCESSFULLY");
    console.log("SERVER STILL RUNNING");
  });

  serverInstance.on("error", (err) => {
    console.error("❌ SERVER ERROR:", err);
  });

  process.stdin.resume();
  process.on("uncaughtException", (err) =>
    console.error("❌ Uncaught Exception:", err),
  );
  process.on("unhandledRejection", (reason) =>
    console.error("❌ Unhandled Rejection:", reason),
  );
} else {
  // For testing purposes, `app` is exported, but `serverInstance` will be undefined or null
  // We don\\\'t start app.listen() in test mode.
  serverInstance = null; // Explicitly set to null for clarity in testing scenarios
}

module.exports = { app, server: serverInstance };
