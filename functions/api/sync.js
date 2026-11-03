// POST /api/sync — merge the caller's song data into their copy on Cloudflare KV and return the merged set.
// Each item is {t: last-write ms, v: value or null when deleted}; the newest t per key wins.
// Sign-in reuses the Nattpong Property Supabase accounts: the browser sends its Supabase access token.
const SUPABASE_URL = 'https://rpewrivpjkdaxqyrzejx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_uJ2tTa3nBasSL0-TDAcNtg_1yY0rykM';
const KEY_RE = /^cp\.(text\.|user$|sp\.)/;

const json = (o, status = 200) => new Response(JSON.stringify(o), {status, headers: {'content-type': 'application/json', 'cache-control': 'no-store'}});

async function userId(request) {
  const auth = request.headers.get('authorization') || '';
  if (!auth.startsWith('Bearer ')) return null;
  const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {headers: {apikey: SUPABASE_KEY, authorization: auth}});
  if (!r.ok) return null;
  const u = await r.json();
  return (u && u.id) || null;
}

export async function onRequestPost({request, env}) {
  const uid = await userId(request);
  if (!uid) return json({error: 'unauthorized'}, 401);
  let body;
  try { body = await request.json(); } catch { return json({error: 'bad json'}, 400); }
  const incoming = body && typeof body.items === 'object' && body.items ? body.items : {};
  const key = 'u:' + uid;
  const stored = (await env.CHORDPLOEN.get(key, 'json')) || {items: {}};
  let changed = false;
  for (const [k, it] of Object.entries(incoming)) {
    if (!KEY_RE.test(k) || !it || typeof it.t !== 'number') continue;
    const cur = stored.items[k];
    if (!cur || it.t > cur.t) { stored.items[k] = {t: it.t, v: it.v === undefined ? null : it.v}; changed = true; }
  }
  if (changed) { stored.updated = Date.now(); await env.CHORDPLOEN.put(key, JSON.stringify(stored)); }
  return json({items: stored.items});
}
