const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// In-memory store: pairingCode => phoneNumber
const pairingCodes = new Map();

// Generate 6-part pairing code (e.g. KE3FAS)
function generatePairingCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 hex chars
}

// Endpoint to generate pairing code for a given phone number
app.post('/generate-pairing-code', (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  const code = generatePairingCode();
  pairingCodes.set(code, phoneNumber);

  return res.json({ pairingCode: code });
});

// Endpoint to verify pairing code and return creds.json (dummy creds for example)
app.post('/verify-pairing-code', (req, res) => {
  const { pairingCode } = req.body;

  if (!pairingCode) {
    return res.status(400).json({ error: 'Pairing code is required' });
  }

  const phoneNumber = pairingCodes.get(pairingCode);

  if (!phoneNumber) {
    return res.status(400).json({ error: 'Invalid or expired pairing code' });
  }

  // Here generate real creds.json for the phoneNumber
  // For example, dummy creds object:
  const creds = {
    phoneNumber,
    botName: 'Arslan-MD',
    welcomeMessage: `Welcome to Arslan-MD bot! Your number ${phoneNumber} is now linked.`,
  };

  // Remove pairing code after use (one-time)
  pairingCodes.delete(pairingCode);

  return res.json({ message: 'Pairing successful', creds });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
