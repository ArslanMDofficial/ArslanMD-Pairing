const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const generateCode = require('./generateCode');
const startBot = require('./pairBot');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('client'));

app.post('/generate', async (req, res) => {
    const number = req.body.number;

    if (!number || !/^\d{10,15}$/.test(number)) {
        return res.status(400).send('❌ Invalid number');
    }

    const pairingCode = generateCode(8); // 8-character code

    // Store pairing info
    const dbPath = path.join(__dirname, 'pairings.json');
    const db = fs.existsSync(dbPath) ? JSON.parse(fs.readFileSync(dbPath)) : {};
    db[number] = pairingCode;
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

    // Start pairing process
    startBot(pairingCode, number, (err, result) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log(`✅ Bot paired for ${number}`);
    });

    res.send(`
        <h2>✅ Pairing Code Generated</h2>
        <p><strong>Code:</strong> ${pairingCode}</p>
        <p>Open WhatsApp > Linked Devices > Link New Device > Enter this code</p>
        <a href="/">🔙 Go Back</a>
    `);
});

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});
