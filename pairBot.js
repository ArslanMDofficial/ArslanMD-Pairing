// pairBot.js const makeWASocket = require('@whiskeysockets/baileys').default; const { useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require('@whiskeysockets/baileys'); const P = require('pino'); const fs = require('fs');

async function startBot(pairingCode, userNumber) { const { state, saveCreds } = await useMultiFileAuthState(./auth_info/${userNumber}); const { version } = await fetchLatestBaileysVersion();

const sock = makeWASocket({
    version,
    logger: P({ level: 'silent' }),
    printQRInTerminal: false,
    auth: state,
    browser: ['Arslan-MD Pairing', 'Safari', '1.0.0']
});

// Attempt pairing
try {
    await sock.requestPairingCode(`${userNumber}@s.whatsapp.net`);
    console.log(`[+] Pairing Code sent to ${userNumber}`);
} catch (err) {
    console.error("[-] Failed to pair:", err);
    return;
}

sock.ev.on('creds.update', saveCreds);

sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        if (shouldReconnect) startBot(pairingCode, userNumber);
    } else if (connection === 'open') {
        console.log(`[+] Connected to WhatsApp for ${userNumber}`);

        // Send welcome message with info
        await sock.sendMessage(`${userNumber}@s.whatsapp.net`, {
            text: `✅ Welcome to *Arslan-MD Bot*\n\nYour bot is now linked!\n\n🔗 Join our channel: https://whatsapp.com/channel/example-link`,
        });

        // Send creds.json
        const credsPath = `./auth_info/${userNumber}/creds.json`;
        if (fs.existsSync(credsPath)) {
            await sock.sendMessage(`${userNumber}@s.whatsapp.net`, {
                document: { url: credsPath },
                mimetype: 'application/json',
                fileName: 'creds.json',
                caption: '🔐 This is your Arslan-MD Bot creds.json file. Keep it safe!'
            });
        }
    }
});

}

module.exports = startBot;

                           
