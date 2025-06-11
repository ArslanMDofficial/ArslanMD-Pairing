const fs = require('fs'); const pino = require('pino'); const { default: makeWASocket, Browsers, delay, useMultiFileAuthState, BufferJSON, fetchLatestBaileysVersion, PHONENUMBER_MCC, jidNormalizedUser, makeCacheableSignalKeyStore } = require("@whiskeysockets/baileys"); const NodeCache = require("node-cache"); const chalk = require("chalk");

async function pairBot(phoneNumber) { try { const { version } = await fetchLatestBaileysVersion(); const { state, saveCreds } = await useMultiFileAuthState(./sessions/${phoneNumber}); const msgRetryCounterCache = new NodeCache();

const sock = makeWASocket({
  version,
  logger: pino({ level: 'silent' }),
  browser: Browsers.windows('Firefox'),
  auth: {
    creds: state.creds,
    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" }))
  },
  printQRInTerminal: false,
  markOnlineOnConnect: true,
  generateHighQualityLinkPreview: true,
  getMessage: async (key) => {
    const jid = jidNormalizedUser(key.remoteJid);
    const msg = await store.loadMessage(jid, key.id);
    return msg?.message || "";
  },
  msgRetryCounterCache,
  defaultQueryTimeoutMs: undefined
});

if (!sock.authState.creds.registered) {
  phoneNumber = phoneNumber.replace(/[^0-9]/g, '');

  if (!Object.keys(PHONENUMBER_MCC).some(v => phoneNumber.startsWith(v))) {
    console.log(chalk.red("Invalid phone number. Must start with country code (e.g. +92..."));
    return null;
  }

  const codeRaw = await sock.requestPairingCode(phoneNumber);
  const code = codeRaw?.match(/.{1,4}/g)?.join("-") || codeRaw;
  console.log(chalk.green("Pairing Code for " + phoneNumber + ": "), chalk.white(code));
  return code;
}

sock.ev.on("connection.update", async ({ connection }) => {
  if (connection === "open") {
    await delay(10000);
    await sock.sendMessage(sock.user.id, { text: `🎉 Bot linked successfully with your number!` });
    const session = fs.readFileSync(`./sessions/${phoneNumber}/creds.json`);
    const sent = await sock.sendMessage(sock.user.id, {
      document: session,
      mimetype: 'application/json',
      fileName: 'creds.json'
    });
    await sock.sendMessage(sock.user.id, { text: `⚠️ Do not share this file with anyone.` }, { quoted: sent });
    process.exit(0);
  }
});

sock.ev.on('creds.update', saveCreds);

} catch (err) { console.error("Pairing failed:", err); return null; } }

module.exports = pairBot;

    
