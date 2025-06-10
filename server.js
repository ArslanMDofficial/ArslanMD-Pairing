const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helper function to generate random 6-part pairing code (A1B2-C3D4-E5F6 style)
function generatePairingCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  function part() {
    let s = '';
    for (let i = 0; i < 4; i++) {
      s += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return s;
  }
  return `${part()}-${part()}-${part()}`;
}

// API route to generate code based on user number input
app.post('/generate-code', (req, res) => {
  const { number } = req.body;

  if (!number || !/^\d{10,15}$/.test(number)) {
    return res.status(400).json({ error: 'Invalid WhatsApp number' });
  }

  // Yahan aap pairing logic ya database me save kar sakte hain agar chahen
  const pairingCode = generatePairingCode();

  console.log(`Pairing code generated for ${number}: ${pairingCode}`);

  // Response me code bhej rahe hain
  res.json({ code: pairingCode });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
