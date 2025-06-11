const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const pairBot = require("./pairBot"); // pairBot.js function import
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "client"))); // Serve frontend

// Route to serve HTML
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "index.html"));
});

// Route to receive number from frontend
app.post("/pair", async (req, res) => {
  const { number } = req.body;

  if (!number || number.length < 10) {
    return res.status(400).json({ success: false, message: "Invalid number" });
  }

  try {
    const result = await pairBot(number);
    res.status(200).json({ success: true, message: "Pairing started", code: result.code });
  } catch (error) {
    console.error("Pairing failed:", error);
    res.status(500).json({ success: false, message: "Pairing failed", error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
