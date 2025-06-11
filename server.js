import express from 'express'
import cors from 'cors'
import { default: makeWASocket, Browsers, fetchLatestBaileysVersion, useMultiFileAuthState, jidNormalizedUser, makeCacheableSignalKeyStore } from '@whiskeysockets/baileys'
import Pino from 'pino'

const app = express()
app.use(cors())
app.use(express.json())

// POST /pair route to generate WhatsApp pairing code
app.post('/pair', async (req, res) => {
  try {
    let { phone } = req.body
    if (!phone || typeof phone !== 'string') {
      return res.status(400).json({ error: 'Invalid phone number' })
    }
    phone = phone.trim()
    if (!phone.startsWith('+')) {
      return res.status(400).json({ error: 'Phone number must start with + and country code' })
    }

    // Fetch Baileys latest version
    const { version } = await fetchLatestBaileysVersion()

    // Initialize auth state with empty session to generate new pairing code
    const { state, saveCreds } = await useMultiFileAuthState('./sessions/' + phone.replace(/\D/g, ''))

    // Create a new Baileys socket
    const sock = makeWASocket({
      version,
      printQRInTerminal: false,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, Pino({ level: 'fatal' }).child({ level: 'fatal' }))
      },
      browser: Browsers.desktop('ArslanMD Pairing Site')
    })

    // Listen for connection update to get pairing code
    sock.ev.on('connection.update', (update) => {
      const { qr, connection, lastDisconnect } = update

      if (qr) {
        // Format pairing code in groups of 4 (WhatsApp style)
        let formattedCode = qr.match(/.{1,4}/g)?.join('-') || qr

        // Send pairing code JSON response once
        res.json({ pairingCode: formattedCode })

        // Close socket after sending code to avoid hanging connections
        sock.end()
      }

      if (connection === 'close') {
        if (lastDisconnect?.error?.output?.statusCode !== 401) {
          console.log('Disconnected unexpectedly, restarting...')
        }
      }
    })

    // Save creds on update
    sock.ev.on('creds.update', saveCreds)

  } catch (error) {
    console.error('Error generating pairing code:', error)
    return res.status(500).json({ error: 'Internal server error generating pairing code' })
  }
})

// Serve your index.html or static files here if needed
// app.use(express.static('public'))

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`ArslanMD Pairing Server listening on port ${PORT}`)
})
