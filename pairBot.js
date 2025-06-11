// pairBot.js

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

    return new Promise(async (resolve, reject) => {
        let handled = false;

        sock.ev.on("connection.update", async ({ connection, lastDisconnect }) => {
            if (handled) return;
            handled = true;

            if (connection === "open") {
                console.log("✅ Already paired");
                return resolve("Already paired");
            }

            if (connection === "close") {
                const code = lastDisconnect?.error?.output?.statusCode || 0;
                if (code !== 401) {
                    return reject(new Error("Connection closed unexpectedly"));
                }
            }
        });

        try {
            if (!sock.authState.creds.registered) {
                const code = await sock.requestPairingCode(cleanNumber);
                const formatted = code?.match(/.{1,4}/g)?.join("-") || code;
                console.log("✅ Pairing Code:", formatted);
                return resolve(formatted);
            } else {
                return resolve("Already registered");
            }
        } catch (err) {
            console.error("❌ Error generating pairing code:", err);
            return reject(err);
        }
    });
}

module.exports = { pairBotWithNumber };
