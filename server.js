const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { generateCode } = require('./generateCode');
const { pairBot } = require('./pairBot');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'client')));

// Route to generate code and start pairing
app.post('/generate', async (req, res) => {
  const { number } = req.body;
  if (!number || number.length < 10) return res.status(400).json({ error: 'Invalid number' });

  const code = generateCode(8);
  try {
    await pairBot(code, number);
    res.json({ code });
  } catch (err) {
    console.error('Pairing failed:', err);
    res.status(500).json({ error: 'Pairing failed' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Arslan-MD Server is running on http://localhost:${PORT}`);
});
