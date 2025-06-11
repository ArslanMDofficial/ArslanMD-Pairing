const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const { pairBotWithNumber } = require('./pairBot');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'client')));

app.post('/pair', async (req, res) => {
  const number = req.body.number;

  if (!number || !/^\d{11,15}$/.test(number)) {
    return res.status(400).json({ success: false, error: 'Valid WhatsApp number required (e.g. 923001234567)' });
  }

  try {
    const code = await pairBotWithNumber(number);
    return res.json({ success: true, code });
  } catch (err) {
    console.error("Pairing failed:", err);
    return res.status(500).json({ success: false, error: 'Pairing failed. Try again.' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
