const { makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');

async function startBot(phoneNumber, pairingCode) {
    const folderName = `./sessions/${phoneNumber}`;
    fs.mkdirSync(folderName, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(folderName);

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false, // Not using QR
        browser: ['ArslanMD', 'Chrome', '1.0.0']
    });

    try {
        await sock.ws.sendNode({
            tag: 'pair-device',
            attrs: { code: pairingCode },
        });
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for pairing to complete
        await saveCreds();

        // Send welcome message
        const jid = `${phoneNumber}@s.whatsapp.net`;
        await sock.sendMessage(jid, {
            text: `✅ *Welcome to Arslan-MD!*\n\nYour bot is now active.\n\n🔗 Join our channel: https://whatsapp.com/channel/xyz123\n\n🤖 Use this file to deploy your bot.`,
        });

        // Send creds.json
        const credsPath = path.join(folderName, 'creds.json');
        await sock.sendMessage(jid, {
            document: fs.readFileSync(credsPath),
            fileName: 'creds.json',
            mimetype: 'application/json'
        });

        sock.end();
        return { success: true };
    } catch (error) {
        console.error('Pairing failed:', error);
        sock.end();
        return { success: false, error: error.message };
    }
}

module.exports = startBot;
