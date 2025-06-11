const fs = require('fs');
const Pino = require('pino');
const NodeCache = require('node-cache');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  PHONENUMBER_MCC,
  makeCacheableSignalKeyStore,
  jidNormalizedUser,
  Browsers
} = require('@whiskeysockets/baileys');
const chalk = require('chalk');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function pairBot(phoneNumber) {
  if (!phoneNumber) throw new Error('Phone number is required');

  phoneNumber = phoneNumber.replace(/[^0-9]/g, '');

  if (!Object.keys(PHONENUMBER_MCC).some(v => phoneNumber.startsWith(v))) {
    throw new Error('Phone number must start with correct country code (e.g. +92)');
  }

  const { state, saveCreds } = await useMultiFileAuthState('./sessions/' + phoneNumber);
  const msgRetryCounterCache = new NodeCache();
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger: Pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: Browsers.windows('ArslanMD'),
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, Pino({ level: "fatal" }).child({ level: "fatal" }))
    },
    msgRetryCounterCache
  });

  let pairingCode = null;

  if (!sock.authState.creds.registered) {
    pairingCode = await sock.requestPairingCode(phoneNumber);
    pairingCode = pairingCode?.slice(0, 8).match(/.{1,4}/g)?.join('-') || pairingCode;
    console.log(chalk.greenBright("Pairing Code:"), pairingCode);
  }

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection } = update;

    if (connection === 'open') {
      await delay(4000);
      const file = fs.readFileSync(`./sessions/${phoneNumber}/creds.json`);
      await sock.sendMessage(sock.user.id, { text: `🎉 Bot Connected Successfully\n\nWelcome to Arslan-MD!` });
      await sock.sendMessage(sock.user.id, {
        document: file,
        mimetype: 'application/json',
        fileName: 'creds.json'
      });

      await delay(3000);
      process.exit(0); // End process after pairing and sending
    }
  });

  return { code: pairingCode };
}

module.exports = pairBot;
