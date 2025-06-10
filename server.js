const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const generateCode = require('./generateCode');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('client'));

const pairingCodes = {}; // temp memory, production me DB use karein

app.post('/generate', (req, res) => {
    const { number } = req.body;
    if (!number) return res.status(400).json({ error: 'Number is required' });

    const code = generateCode(8);
    pairingCodes[code] = number;

    // TODO: Baileys se pairing karna yahan trigger hoga
    console.log(`Generated pairing code ${code} for ${number}`);
    res.json({ code });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
