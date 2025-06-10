const express = require('express');
const path = require('path');
const app = express();

// Static serve
app.use(express.static(path.join(__dirname, 'client')));

// Home page show karega index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/index.html'));
});

// Your existing code (pairing endpoint, etc.) should be here

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
