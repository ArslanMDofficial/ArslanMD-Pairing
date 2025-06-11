const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const { pairBotWithNumber } = require("./pairBot");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("client"));

app.post("/generate", async (req, res) => {
    const { number } = req.body;

    if (!number) return res.status(400).json({ error: "Number required" });

    try {
        const code = await pairBotWithNumber(number);
        res.json({ pairingCode: code });
    } catch (error) {
        console.error("Pairing failed:", error);
        res.status(500).json({ error: "Pairing failed, try again" });
    }
});

app.listen(port, () => console.log("Server running on port", port));
