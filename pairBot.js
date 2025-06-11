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
    PHONENUMBER_MCC,
} = require("@whiskeysockets/baileys");

async function pairBotWithNumber(phoneNumber) {
    const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
    if (!Object.keys(PHONENUMBER_MCC).some(v => cleanNumber.startsWith(v))) {
        throw new Error("Phone number must start with a valid country code");
    }

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

    return new Promise((resolve, reject) => {
        sock.ev.on("creds.update", saveCreds);

        sock.ev.once("connection.update", async ({ connection, lastDisconnect }) => {
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

        // wait for 2 seconds before calling requestPairingCode
        setTimeout(async () => {
            try {
                if (!sock.authState.creds.registered) {
                    const code = await sock.requestPairingCode(cleanNumber);
                    const formatted = code?.match(/.{1,4}/g)?.join("-") || code;
                    console.log("✅ Pairing Code:", formatted);
                    resolve(formatted);
                } else {
                    resolve("Already registered");
                }
            } catch (err) {
                console.error("❌ Error generating pairing code:", err);
                reject(err);
            }
        }, 3000); // wait 3 seconds for stable connection
    });
}

module.exports = { pairBotWithNumber };
