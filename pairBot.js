const { default: makeWASocket, useSingleFileAuthState, DisconnectReason, fetchLatestBaileysVersion, delay } = require('@whiskeysockets/baileys');
const P = require('pino');
const fs = require('fs');
const path = require('path');

const authFolder = './auth_sessions';

async function pairBot(code, userNumber) {
  if (!fs.existsSync(authFolder)) fs.mkdirSync(authFolder, { recursive: true });

  const authFile = path.join(authFolder, `${code}.json`);
  const { state, saveState } = useSingleFileAuthState(authFile);

  const { version, isLatest } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: true,
    logger: P({ level: 'silent' }),
  });

  return new Promise((resolve, reject) => {
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log('QR Received. User scan kare:', qr);
      }

      if (connection === 'open') {
        console.log('WhatsApp connected for code:', code);

        // Save creds.json file path
        const credsFile = authFile;

        // Wait thoda time for Baileys to finalize saving
        await delay(2000);

        // WhatsApp message bhejna user ko with creds file (as attachment)
        await sendCredsAndWelcome(sock, userNumber, credsFile);

        resolve();
      }

      if (connection === 'close') {
        const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
        if (!shouldReconnect) {
          reject(new Error('Logged out, please scan QR again.'));
        }
      }
    });

    sock.ev.on('creds.update', saveState);
  });
}

async function sendCredsAndWelcome(sock, userNumber, credsFile) {
  try {
    // Send welcome message
    await sock.sendMessage(userNumber + '@s.whatsapp.net', { 
      text: `Assalamualaikum! Apka pairing successful ho gaya hai. Ab aap apna Arslan-MD bot chalane ke liye apni creds.json file istemal kar sakte hain. File niche attach ki gayi hai.` 
    });

    // Send creds.json file
    const fileData = fs.readFileSync(credsFile);
    await sock.sendMessage(userNumber + '@s.whatsapp.net', {
      document: fileData,
      mimetype: 'application/json',
      fileName: 'creds.json',
      caption: 'Yeh aapki WhatsApp bot creds.json file hai. Isko safe rakhain.'
    });

    // Bot info message
    await sock.sendMessage(userNumber + '@s.whatsapp.net', { 
      text: `Arslan-MD Bot ke WhatsApp channel se juda rehne ke liye hamare social links check karain.\n\n- GitHub: https://github.com/ArslanMDofficial\n- Website: https://arslanmd.com\n\nShukriya!`
    });

  } catch (e) {
    console.error('Error sending creds or messages:', e);
  }
}

module.exports = { pairBot };
