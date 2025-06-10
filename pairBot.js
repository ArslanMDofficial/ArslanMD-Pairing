const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, makeInMemoryStore } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');

const sessionsDir = './sessions';
if (!fs.existsSync(sessionsDir)) fs.mkdirSync(sessionsDir);

const store = makeInMemoryStore({});

async function startBot(pairingCode, number, onDone) {
    const sessionFolder = path.join(sessionsDir, number);
    if (!fs.existsSync(sessionFolder)) fs.mkdirSync(sessionFolder);

    const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        browser: ['Arslan-MD', 'Chrome', '110.0'],
        generateHighQualityLinkPreview: true,
        syncFullHistory: false
    });

    store.bind(sock.ev);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (connection === 'open') {
            await saveCreds();

            const credsPath = path.join(sessionFolder, 'creds.json');
            const message = `🤖 *Welcome to Arslan-MD Bot!*\n\n✅ Your bot is now paired.\n\n📄 Attached is your *creds.json* file. You can now deploy your bot using this.`;

            await sock.sendMessage(sock.user.id, { document: fs.readFileSync(credsPath), fileName: 'creds.json', mimetype: 'application/json', caption: message });

            if (onDone) onDone(null, 'Success');
            await sock.ws.close();
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                startBot(pairingCode, number, onDone);
            } else {
                if (onDone) onDone('Disconnected');
            }
        }
    });

    try {
        await sock.requestPairingCode(`${number}@s.whatsapp.net`);
        console.log(`Pairing code generated for ${number}`);
    } catch (err) {
        console.error('Failed to generate pairing code:', err);
        if (onDone) onDone('Pairing failed');
    }
}

module.exports = startBot;
