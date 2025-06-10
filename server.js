const express = require('express');
const app = express();
const path = require('path');
const PORT = process.env.PORT || 3000;

// Serve static files (if you have frontend in a folder like 'client')
app.use(express.static('client'));

// Default home route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

// Your existing code (pairing endpoint, etc.) should be here

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
