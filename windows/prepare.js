// Copies the single-file game into the Electron app so Android and Windows share one source.
const fs = require('fs');
const path = require('path');
const src = path.join(__dirname, '..', 'app', 'src', 'main', 'assets', 'index.html');
const dir = path.join(__dirname, 'game');
fs.mkdirSync(dir, { recursive: true });
for (const f of ['index.html', 'cards.js', 'engine.js']) {
  fs.copyFileSync(path.join(path.dirname(src), f), path.join(dir, f));
}
console.log('Copied game to', dir);
