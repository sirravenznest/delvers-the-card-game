const clk = { t: 1_000_000, now() { return clk.t; } };
// Minimal Realtime Database REST fake. Emulates: sv timestamps, immutable log entries, write-once queue/$uid/m,
// and members-only match access (the intent of database.rules.json).
function makeDb(opts = { rules: require('../database.rules.json') }) {
  const RS = opts.rules ? require('./rulesim') : null;
  const root = {};
  const get = (p) => p.split('/').filter(Boolean).reduce((n, k) => (n == null ? n : n[k]), root);
  const stamp = (v) => {
    if (v && typeof v == 'object') {
      if (v['.sv'] == 'timestamp') return clk.t;
      const o = Array.isArray(v) ? [] : {};
      for (const k of Object.keys(v)) o[k] = stamp(v[k]);
      return o;
    }
    return v;
  };
  const set = (p, v) => {
    const ks = p.split('/').filter(Boolean);
    let n = root;
    for (let i = 0; i < ks.length - 1; i++) { if (n[ks[i]] == null || typeof n[ks[i]] != 'object') n[ks[i]] = {}; n = n[ks[i]]; }
    const last = ks[ks.length - 1];
    if (v === null) delete n[last]; else n[last] = v;
  };
  function allowed(uid, method, p, body) {
    const ks = p.split('/').filter(Boolean);
    if (ks[0] == 'queue' && ks[1] && method != 'GET') {
      if (ks[2] == 'm') return get(p) == null;
      return ks[1] == uid && ks.length <= 2;
    }
    if (ks[0] == 'matches' && ks[1]) {
      const m = get(`matches/${ks[1]}/meta`);
      if (ks[2] == 'meta' && method != 'GET') return m == null;
      if (!m) return method == 'GET' || false;
      const member = m.p == uid || m.e == uid;
      if (!member) return false;
      if (ks[2] == 'log' && method != 'GET') return get(p) == null;
      if (ks[2] == 'res' && method != 'GET') return ks[3] == uid;
      return true;
    }
    if (ks[0] == 'ratings' && ks[1] && method != 'GET') return ks[1] == uid;
    if (ks[0] == 'profiles') return method == 'GET' || ks[1] == uid;
    if (ks[0] == 'codes') { if (!ks[1]) return false; return method == 'GET' || (get(p) == null && body === uid); }
    if (ks[0] == 'social') {
      const owner = ks[1];
      if (ks[2] == 'friends' && ks[3]) return method == 'GET' ? (uid == owner || uid == ks[3]) : uid == owner;
      if (ks[2] == 'in' && ks[3]) return method == 'GET' ? uid == owner : (uid == ks[3] || uid == owner);
      return method == 'GET' ? uid == owner : uid == owner;
    }
    if (ks[0] == 'invites') {
      const to = ks[1], from = ks[2];
      if (!from) return method == 'GET' && uid == to;
      if (ks[3] == 'm') return method != 'GET' ? (uid == to && get(p) == null) : uid == from || uid == to;
      if (method == 'GET') return uid == from || uid == to;
      const fr = (a, b) => get(`social/${a}/friends/${b}`) != null;
      if (uid == from && fr(to, from) && fr(from, to)) return true;
      return uid == to && method == 'DELETE';
    }
    return true;
  }
  const down = new Set();
  const fetch = async (url, opt = {}) => {
    const u = new URL(url);
    const uid = u.searchParams.get('auth');
    const R = (b, st = 200) => ({ ok: st < 400, status: st, json: async () => b });
    if (down.has(uid)) throw new Error('offline');
    const p = decodeURIComponent(u.pathname).replace(/^\//, '').replace(/\.json$/, '');
    const m = opt.method || 'GET';
    if ((m == 'GET' || m == 'HEAD') && opt.body !== undefined) throw new TypeError("Request with GET/HEAD method cannot have body.");
    const raw = opt.body === undefined ? undefined : JSON.parse(opt.body);
    if (RS) {
      const sv = stamp(raw);
      const writes = m == 'PATCH' ? Object.keys(sv).map(k => [p + '/' + k, sv[k]]) : [[p, m == 'DELETE' ? null : sv]];
      const ok = m == 'GET' ? RS.check(opts.rules, '.read', uid, root, p) : writes.every(([wp, wv]) => RS.check(opts.rules, '.write', uid, root, wp, wv));
      if (!ok) return R({ error: 'Permission denied' }, 401);
    } else if (!allowed(uid, m, p, raw)) return R({ error: 'Permission denied' }, 401);
    if (m == 'GET') {
      let v = get(p);
      const ob = u.searchParams.get('orderBy');
      if (v && ob == '"$key"') {
        const s = Number(JSON.parse(u.searchParams.get('startAt')));
        v = Object.fromEntries(Object.entries(v).filter(([k]) => Number(k) >= s));
      } else if (v && ob == '"r"') {
        const lim = Number(u.searchParams.get('limitToLast') || 1e9);
        v = Object.fromEntries(Object.entries(v).sort((a, b) => a[1].r - b[1].r).slice(-lim));
      }
      return R(v === undefined ? null : v);
    }
    const body = opt.body === undefined ? undefined : stamp(JSON.parse(opt.body));
    if (m == 'PUT') { set(p, body); return R(body); }
    if (m == 'PATCH') { for (const k of Object.keys(body)) set(p + '/' + k, body[k]); return R(body); }
    if (m == 'DELETE') { set(p, null); return R(null); }
    return R(null, 400);
  };
  return { root, fetch, get, down };
}


module.exports = { makeDb, clk };
