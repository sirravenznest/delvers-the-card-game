// Evaluates the real database.rules.json (read/write cascade, wildcards, data/newData/root) against an in-memory tree.
const clone = v => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
const split = p => p.split('/').filter(Boolean);
const at = (tree, ks) => ks.reduce((n, k) => (n == null || typeof n != 'object' ? undefined : n[k]), tree);
function snap(tree, ks) {
  const v = at(tree, ks);
  const s = {
    exists: () => v != null, val: () => (v === undefined ? null : v), hasChild: p => at(v, split(p)) != null,
    child: p => snap(tree, ks.concat(split(p))),
  };
  return s;
}
function put(tree, ks, v) {
  if (!ks.length) return v;
  const t = clone(tree) || {};
  let n = t;
  for (let i = 0; i < ks.length - 1; i++) { if (n[ks[i]] == null || typeof n[ks[i]] != 'object') n[ks[i]] = {}; n = n[ks[i]]; }
  if (v === null || v === undefined) delete n[ks[ks.length - 1]]; else n[ks[ks.length - 1]] = v;
  return t;
}
function check(rules, kind, uid, tree, path, newVal) {
  const ks = split(path), newTree = kind == '.write' ? put(tree, ks, newVal) : tree;
  let node = rules.rules, vars = {};
  for (let i = 0; i <= ks.length; i++) {
    const expr = node[kind];
    if (expr !== undefined) {
      const f = new Function('auth', 'root', 'data', 'newData', 'now', 'vars', `with(vars){return (${expr})}`);
      const auth = uid ? { uid } : null;
      if (f(auth, snap(tree, []), snap(tree, ks.slice(0, i)), snap(newTree, ks.slice(0, i)), 0, vars)) return true;
    }
    if (i == ks.length) break;
    const k = ks[i];
    if (node[k] && typeof node[k] == 'object') node = node[k];
    else { const w = Object.keys(node).find(x => x[0] == '$'); if (!w) return false; vars[w] = k; node = node[w]; }
  }
  return false;
}
module.exports = { check };
