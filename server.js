const express = require('express');
const startBot = require('./pairBot');
const app = express();

app.use(express.json());
app.use(express.static('client'));

app.post('/pair', async (req, res) => {
    const { code, number } = req.body;

    if (!code || !number) {
        return res.status(400).json({ error: 'Pairing code or number missing.' });
    }

    // Run the bot
    try {
        await startBot(code, number);
        res.status(200).json({ message: 'Bot is pairing, please wait...' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to start bot.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
