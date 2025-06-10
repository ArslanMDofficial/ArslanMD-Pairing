const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors()); // Frontend se request allow karne ke liye
app.use(bodyParser.json()); // JSON body parse karne ke liye

// Simple in-memory store for pairing codes (production me DB use karna chahiye)
const pairingCodes = new Map();

function generatePairingCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for(let i=0; i<6; i++){
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// API route for generating pairing code
app.post('/generate-pairing-code', (req, res) => {
  const { phoneNumber } = req.body;
  
  if(!phoneNumber) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  // Generate unique code (6 chars)
  let code;
  do {
    code = generatePairingCode();
  } while(pairingCodes.has(code));

  // Save pairing code with phone number
  pairingCodes.set(code, phoneNumber);

  res.json({ pairingCode: code });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
