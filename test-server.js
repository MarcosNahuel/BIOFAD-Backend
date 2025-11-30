// Test simple server
const express = require('express');
const app = express();
const PORT = 3001;

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`✓ Test server running on http://localhost:${PORT}`);
  console.log(`✓ Health: http://localhost:${PORT}/health`);
});
