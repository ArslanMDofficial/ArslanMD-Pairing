const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeInMemoryStore } = require("@whiskeysockets/baileys");
const { Boom } = require('@hapi/boom');
const fs = require("fs");
const path = require("path");

async function startBot(pairingCode, userNumber) {
    const { state, saveCreds } = await useMultiFileAuthState(`./auth_info/${userNumber}`);
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    });

    sock.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {
        if (connection === "close") {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot(pairingCode, userNumber);
        } else if (connection === "open") {
            console.log("✅ Bot paired successfully!");
            await saveCreds();

            // Send welcome message with creds.json
            const credsPath = path.join(__dirname, `auth_info/${userNumber}/creds.json`);
            const credsBuffer = fs.readFileSync(credsPath);

            await sock.sendMessage(`${userNumber}@s.whatsapp.net`, {
                document: credsBuffer,
                mimetype: 'application/json',
                fileName: 'creds.json',
                caption: '🤖 Welcome to Arslan-MD Bot!\n\nHere is your bot config file.\n\nJoin our channel: https://whatsapp.com/channel/XYZ'
            });
        }
    });
}

module.exports = startBot;
