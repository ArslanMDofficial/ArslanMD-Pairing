// pairBot.js

const fs = require("fs");
const pino = require("pino");
const { default: makeWASocket, Browsers, fetchLatestBaileysVersion, useMultiFileAuthState, makeCacheableSignalKeyStore, PHONENUMBER_MCC } = require("@whiskeysockets/baileys");
const NodeCache = require("node-cache");

async function pairBotWithNumber(phoneNumber) {
    const sessionFolder = `./sessions/${phoneNumber}`;
    if (!fs.existsSync(sessionFolder)) fs.mkdirSync(sessionFolder, { recursive: true });

    const { version } = await fetchLatestBaileysVersion();
    const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);

    const sock = makeWASocket({
        version,
        printQRInTerminal: false,
        browser: Browsers.macOS("Desktop"),
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })),
        },
        msgRetryCounterCache: new NodeCache(),
    });

    if (!sock.authState.creds.registered) {
        const code = await sock.requestPairingCode(phoneNumber);
        console.log("Generated Pairing Code:", code);
        return code;
    } else {
        throw new Error("Number already registered.");
    }
}

module.exports = { pairBotWithNumber };
