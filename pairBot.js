const fs = require("fs");
const pino = require("pino");
const NodeCache = require("node-cache");
const {
    default: makeWASocket,
    Browsers,
    fetchLatestBaileysVersion,
    useMultiFileAuthState,
    makeCacheableSignalKeyStore,
} = require("@whiskeysockets/baileys");

async function pairBotWithNumber(phoneNumber) {
    const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
    const sessionPath = `./sessions/${cleanNumber}`;
    if (!fs.existsSync(sessionPath)) fs.mkdirSync(sessionPath, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: pino({ level: "silent" }),
        browser: Browsers.macOS("Desktop"),
        printQRInTerminal: false,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })),
        },
        msgRetryCounterCache: new NodeCache(),
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on('connection.update', (update) => {
      console.log('Connection update:', update);
      if (update.connection === 'close') {
        console.log('Connection closed:', update.lastDisconnect?.error?.output?.statusCode, update.lastDisconnect?.error?.message);
      }
    });

    if (!sock.authState.creds.registered) {
        try {
            const code = await sock.requestPairingCode(cleanNumber);
            const formatted = code?.match(/.{1,4}/g)?.join("-") || code;
            console.log("✅ Pairing Code:", formatted);
            return formatted;
        } catch (err) {
            console.error("❌ Pairing failed:", err);
            throw new Error("Pairing failed: " + err.message);
        }
    } else {
        throw new Error("Number is already registered.");
    }
}

module.exports = { pairBotWithNumber };
