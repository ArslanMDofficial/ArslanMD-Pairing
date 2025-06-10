// generateCode.js
function generateCode() {
  const parts = [];
  for (let i = 0; i < 6; i++) {
    parts.push(Math.random().toString(36).substr(2, 2).toUpperCase());
  }
  return parts.join('-');
}

module.exports = { generateCode };
