// Guards the starter decks against edits that make them illegal.
const test = require('node:test'), assert = require('assert'), path = require('path');
const A = path.join(__dirname, '..', 'app', 'src', 'main', 'assets');
const C = require(path.join(A, 'cards.js')), P = require(path.join(A, 'pvp.js'));
test('three legal starter decks, Common/Uncommon only', () => {
  assert.strictEqual(C.STARTERS.length, 3);
  for (const d of C.STARTERS) { assert.strictEqual(d.list.length, 30); assert(P.validRanked(d.list), d.name); assert(d.list.every(n => C.BN[n] && C.BN[n].rar <= 1), d.name + ' rarity'); }
  assert(C.STARTER_PRICE > 0);
});
