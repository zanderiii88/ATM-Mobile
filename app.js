let artists = [];
let byName = new Map();
let deferredInstall = null;

const storeKey = 'atm-mobile-v01'; // Keep this stable so existing personal data survives updates.
const artworkCacheKey = 'atm-mobile-artwork-v1';
const ARTWORK_ENDPOINT = 'https://atm-artwork.zanderiii88.workers.dev/';
const ARTWORK_MAX_AGE = 1000 * 60 * 60 * 24 * 60;

const state = { page: 'home', selected: null, mode: 'Similar', reach: 20, ...loadState() };
let artworkCache = loadArtworkCache();
const artworkPending = new Map();
let artworkObserver = null;

function loadState() {
  try { return JSON.parse(localStorage.getItem(storeKey) || '{}'); }
  catch { return {}; }
}
function saveState() {
  localStorage.setItem(storeKey, JSON.stringify({
    selected: state.selected,
    mode: state.mode,
    reach: state.reach,
    prefs: state.prefs || {},
    recent: state.recent || []
  }));
}
function loadArtworkCache() {
  try { return JSON.parse(localStorage.getItem(artworkCacheKey) || '{}'); }
  catch { return {}; }
}
function saveArtworkCache() {
  try { localStorage.setItem(artworkCacheKey, JSON.stringify(artworkCache)); }
  catch { /* Storage can fail in private browsing; artwork will simply be fetched again later. */ }
}
function prefs() { return state.prefs || (state.prefs = {}); }
function pref(name) {
  return prefs()[name] || (prefs()[name] = { favourite: false, explore: false, disliked: false, note: '' });
}
function setFlag(name, key) {
  const p = pref(name);
  p[key] = !p[key];
  if (key === 'disliked' && p[key]) { p.favourite = false; p.explore = false; }
  if ((key === 'favourite' || key === 'explore') && p[key]) p.disliked = false;
  touch(name, key);
  saveState();
  render();
}
function touch(name, action = 'view') {
  state.recent = state.recent || [];
  state.recent = [{ artist: name, action, ts: Date.now() }, ...state.recent.filter(x => x.artist !== name)].slice(0, 20);
  saveState();
}
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function attr(s) { return esc(s); }
function hash(s) {
  let h = 2166136261;
  for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}

function art(name) {
  const p = pref(name);
  const h = hash(name) % 360;
  const l = name.trim().charAt(0).toUpperCase();
  return `<div class="art" data-artist="${attr(name)}" style="background:radial-gradient(circle at 72% 18%,hsla(${h},65%,48%,.32),transparent 34%),radial-gradient(circle at 18% 82%,hsla(${(h + 65) % 360},70%,43%,.17),transparent 44%),#101820"><div class="art-letter">${esc(l)}</div>${p.favourite ? '<div class="star">★</div>' : ''}</div>`;
}
function cachedArtwork(name) {
  const entry = artworkCache[name];
  if (!entry || !entry.url || !entry.ts) return null;
  if (Date.now() - entry.ts > ARTWORK_MAX_AGE) {
    delete artworkCache[name];
    saveArtworkCache();
    return null;
  }
  return entry.url;
}
async function fetchArtwork(name) {
  const cached = cachedArtwork(name);
  if (cached) return cached;
  if (artworkPending.has(name)) return artworkPending.get(name);

  const request = (async () => {
    try {
      const url = `${ARTWORK_ENDPOINT}?artist=${encodeURIComponent(name)}`;
      const response = await fetch(url, { mode: 'cors', cache: 'default' });
      if (!response.ok) return null;
      const data = await response.json();
      if (!data?.ok || !data.image) return null;
      artworkCache[name] = { url: data.image, ts: Date.now(), channel: data.channel || '' };
      saveArtworkCache();
      return data.image;
    } catch {
      return null;
    } finally {
      artworkPending.delete(name);
    }
  })();

  artworkPending.set(name, request);
  return request;
}
function applyArtwork(el, url) {
  if (!el || !url) return;
  el.style.backgroundImage = `linear-gradient(180deg,rgba(5,8,12,.02),rgba(5,8,12,.16)),url("${url.replace(/"/g, '%22')}")`;
  el.style.backgroundSize = 'cover';
  el.style.backgroundPosition = 'center';
  el.classList.add('has-photo');
}
async function loadArtworkElement(el) {
  if (!el || el.dataset.artLoaded === '1') return;
  el.dataset.artLoaded = '1';
  const name = el.dataset.artist;
  const cached = cachedArtwork(name);
  if (cached) { applyArtwork(el, cached); return; }
  const url = await fetchArtwork(name);
  if (url && document.body.contains(el)) applyArtwork(el, url);
}
function hydrateArtwork() {
  if (artworkObserver) artworkObserver.disconnect();
  const els = [...document.querySelectorAll('.art[data-artist]')];
  if (!els.length) return;

  if ('IntersectionObserver' in window) {
    artworkObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          artworkObserver.unobserve(entry.target);
          loadArtworkElement(entry.target);
        }
      });
    }, { rootMargin: '180px 0px' });
    els.forEach(el => artworkObserver.observe(el));
  } else {
    els.forEach(loadArtworkElement);
  }
}

function tags(a, n = 4) { return (a.style_tags || '').split(',').map(x => x.trim()).filter(Boolean).slice(0, n); }
function tagsHtml(a, n = 4) { return `<div class="tags">${tags(a, n).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>`; }
function yt(name) { return 'https://music.youtube.com/search?q=' + encodeURIComponent(name); }
function sp(name) { return 'https://open.spotify.com/search/' + encodeURIComponent(name); }
function links(name) {
  return `<div class="linkbar"><a class="link yt" href="${yt(name)}" target="_blank" rel="noopener">▶ YouTube Music</a><a class="link" href="${sp(name)}" target="_blank" rel="noopener">Spotify ↗</a></div>`;
}
function hero() {
  return `<div class="hero"><div class="hero-inner"><div class="wordmark"><span>Λ</span><span>T</span><span>M</span></div><div class="redline"></div><div class="fullname">Artists That Matter</div><div class="tagline">Discover more. Go deeper.</div></div></div>`;
}
function layout(content, active = 'home') {
  document.getElementById('app').innerHTML = `<main class="shell"><div class="topbar"><div class="mini-brand"><div class="mini-mark">Λ</div><div class="mini-name">ATM / Artists That Matter</div></div><button id="installTop" class="btn icon install">Install</button></div>${content}</main><nav class="bottomnav">${nav('home', '⌂', 'Home', active)}${nav('discover', '⌕', 'Discover', active)}${nav('lucky', '✦', 'Lucky', active)}${nav('favourites', '★', 'Favourites', active)}</nav>`;
  bindNav();
  const ib = document.getElementById('installTop');
  if (deferredInstall) { ib.style.display = 'block'; ib.onclick = installApp; }
  requestAnimationFrame(hydrateArtwork);
}
function nav(id, icon, label, active) { return `<button class="navbtn ${active === id ? 'active' : ''}" data-nav="${id}"><b>${icon}</b>${label}</button>`; }
function bindNav() { document.querySelectorAll('[data-nav]').forEach(b => b.onclick = () => go(b.dataset.nav)); }
function go(page) { if (page === 'lucky') return lucky(); state.page = page; render(); }
function openArtist(name) { state.selected = name; touch(name, 'view'); state.page = 'profile'; saveState(); render(); }
function lucky() {
  const disliked = new Set(Object.entries(prefs()).filter(([, p]) => p.disliked).map(([n]) => n));
  const pool = artists.filter(a => !disliked.has(a.artist));
  openArtist(pool[Math.floor(Math.random() * pool.length)].artist);
}
function kpi(v, l) { return `<div class="kpi"><strong>${esc(v)}</strong><span>${esc(l)}</span></div>`; }

function home() {
  const favs = Object.entries(prefs()).filter(([, p]) => p.favourite).map(([n]) => n);
  const explore = Object.values(prefs()).filter(p => p.explore).length;
  const genres = new Set(artists.map(a => a.primary_genre).filter(Boolean)).size;
  const recent = (state.recent || []).slice(0, 4);
  layout(`${hero()}<section class="section"><div class="eyebrow">Artists That Matter / ATM</div><h1 class="title">Your music map.</h1><p class="subtitle">A smaller, independent ATM made for your phone. Start with something you love, or let ATM send you somewhere new.</p><div class="actions"><button class="btn primary" data-nav="discover">Discover artists →</button><button class="btn" data-nav="lucky">✦ I’m Feeling Lucky</button></div></section><section class="section grid">${kpi(artists.length, 'Artists in ATM')}${kpi(favs.length, 'Favourites')}${kpi(explore, 'Want to explore')}${kpi(genres, 'Primary genres')}</section><section class="section panel" style="padding:16px"><div class="eyebrow">Recent</div>${recent.length ? recent.map(x => rowHtml(x.artist, x.action)).join('') : '<div class="empty">Your recent artists will appear here.</div>'}</section><section class="section install-card panel"><b>ATM Mobile v0.2</b><p class="small">Real artist artwork is now loaded securely through the ATM artwork service. Favourites, dislikes, notes and history remain local to this phone.</p><button id="installHome" class="btn" style="display:none">Install ATM</button></section>`, 'home');
  document.querySelectorAll('[data-open]').forEach(b => b.onclick = () => openArtist(b.dataset.open));
  const ih = document.getElementById('installHome');
  if (deferredInstall) { ih.style.display = 'block'; ih.onclick = installApp; }
}
function rowHtml(name, action) {
  return `<div class="row"><div><b>${esc(name)}</b><small>${esc((action || 'view').replaceAll('_', ' '))}</small></div><button class="btn icon" data-open="${attr(name)}">Open →</button></div>`;
}

function discover() {
  const sel = state.selected ? byName.get(state.selected) : null;
  const disliked = new Set(Object.entries(prefs()).filter(([, p]) => p.disliked).map(([n]) => n));
  const recs = sel ? ATMEngine.recommend(sel, artists, state.mode, state.reach, 8, disliked) : [];
  layout(`<section><div class="eyebrow">Find something new</div><h1 class="title">Discover</h1><p class="subtitle">Choose from the catalogue or start typing to filter, then decide how closely you want to stay to the original artist.</p><div class="searchbox"><input id="artistSearch" class="field" autocomplete="off" inputmode="search" placeholder="Choose or search for an artist…" value="${sel ? esc(sel.artist) : ''}" aria-label="Choose an artist"><button id="showArtistList" class="search-toggle" type="button" aria-label="Show artist list">⌄</button><div id="suggestions"></div></div><div class="seg">${['Similar', 'Adjacent', 'Wildcard'].map(m => `<button data-mode="${m}" class="${state.mode === m ? 'active' : ''}">${m}</button>`).join('')}</div><div class="range-row"><span>Safe</span><input id="reach" type="range" min="0" max="100" step="5" value="${state.reach}"><span>Wild <b id="reachVal">${state.reach}</b></span></div></section>${sel ? selectedHead(sel) + `<section class="section"><div class="eyebrow">Top recommendations</div><div class="cards">${recs.map((r, i) => recCard(r, i + 1)).join('')}</div></section>` : '<div class="panel empty section">Choose an artist above, or tap ✦ Lucky.</div>'}`, 'discover');
  bindDiscover();
}
function selectedHead(a) {
  const p = pref(a.artist);
  return `<section class="artist-head"><div>${art(a.artist)}</div><div class="panel artist-info"><div class="eyebrow">${esc(a.primary_genre || 'Unclassified')} · ${esc(a.era || '')}</div><h2>${esc(a.artist)}</h2>${tagsHtml(a)}<div class="meta">${esc(a.mood || '')}<br>${esc(a.atmosphere || '')}</div>${links(a.artist)}</div></section><div class="state-row"><button class="btn ${p.favourite ? 'gold' : ''}" data-flag="favourite">${p.favourite ? '★ Favourite' : '☆ Favourite'}</button><button class="btn" data-flag="explore">${p.explore ? '✓ Explore' : '+ Explore'}</button><button class="btn" data-flag="disliked">${p.disliked ? '✕ Disliked' : '− Dislike'}</button></div>`;
}
function recCard(r, rank) {
  const a = r.artist;
  return `<article class="card"><div class="card-top">${art(a.artist)}<div class="card-body"><div class="rank">#${rank}</div><div class="artist-name">${esc(a.artist)}</div><div class="match">${Math.round(r.score * 100)}% match</div>${tagsHtml(a, 3)}<div class="why">${esc(r.why)}</div></div></div><div class="card-actions"><button class="btn" data-open="${attr(a.artist)}">Profile</button><a class="link yt" href="${yt(a.artist)}" target="_blank" rel="noopener">▶ YouTube Music</a></div></article>`;
}
function defaultArtistChoices(limit = 50) {
  const out = [];
  const seen = new Set();
  const push = name => {
    if (!name || seen.has(name) || !byName.has(name) || out.length >= limit) return;
    seen.add(name);
    out.push(byName.get(name));
  };
  (state.recent || []).forEach(x => push(x.artist));
  Object.entries(prefs()).filter(([, p]) => p.favourite).forEach(([name]) => push(name));
  artists.forEach(a => push(a.artist));
  return out;
}
function filteredArtistChoices(query, limit = 60) {
  const q = query.trim().toLocaleLowerCase();
  if (!q) return defaultArtistChoices(limit);
  return artists
    .map(a => {
      const n = a.artist.toLocaleLowerCase();
      let rank = 3;
      if (n === q) rank = 0;
      else if (n.startsWith(q)) rank = 1;
      else if (n.includes(q)) rank = 2;
      else rank = 99;
      return { a, rank };
    })
    .filter(x => x.rank < 99)
    .sort((x, y) => x.rank - y.rank || x.a.artist.localeCompare(y.a.artist))
    .slice(0, limit)
    .map(x => x.a);
}
function bindDiscover() {
  const inp = document.getElementById('artistSearch');
  const sug = document.getElementById('suggestions');
  const toggle = document.getElementById('showArtistList');
  const initialValue = inp.value;
  let userEdited = false;

  function showList(forceAll = false) {
    const query = forceAll || (!userEdited && inp.value === initialValue) ? '' : inp.value;
    const matches = filteredArtistChoices(query);
    sug.className = 'suggestions';
    sug.innerHTML = matches.length
      ? `<div class="suggestion-note">${query ? `Matches for “${esc(query)}”` : 'Choose an artist · type to filter all 1,820'}</div>${matches.map(a => `<button class="suggestion" data-pick="${attr(a.artist)}"><b>${esc(a.artist)}</b><small>${esc(a.primary_genre || '')} · ${esc(a.style_tags || '')}</small></button>`).join('')}`
      : '<div class="suggestion-note">No artists found.</div>';
    sug.querySelectorAll('[data-pick]').forEach(b => b.onclick = () => {
      state.selected = b.dataset.pick;
      touch(state.selected, 'discover');
      saveState();
      render();
    });
  }
  function hideList() { sug.className = ''; sug.innerHTML = ''; }

  inp.onfocus = () => showList(false);
  inp.onclick = () => showList(false);
  inp.oninput = () => { userEdited = true; showList(false); };
  toggle.onclick = e => { e.preventDefault(); e.stopPropagation(); inp.focus(); showList(true); };

  document.onclick = e => {
    if (!e.target.closest('.searchbox')) hideList();
  };

  document.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => { state.mode = b.dataset.mode; saveState(); render(); });
  const rg = document.getElementById('reach');
  rg.oninput = () => document.getElementById('reachVal').textContent = rg.value;
  rg.onchange = () => { state.reach = Number(rg.value); saveState(); render(); };
  document.querySelectorAll('[data-open]').forEach(b => b.onclick = () => openArtist(b.dataset.open));
  document.querySelectorAll('[data-flag]').forEach(b => b.onclick = () => setFlag(state.selected, b.dataset.flag));
}

function profile() {
  const a = byName.get(state.selected) || artists[0];
  state.selected = a.artist;
  const p = pref(a.artist);
  layout(`<section><div class="eyebrow">Artist profile</div><div class="artist-head"><div>${art(a.artist)}</div><div class="panel artist-info"><div class="eyebrow">${esc(a.primary_genre || '')} · ${esc(a.era || '')}</div><h2>${esc(a.artist)}</h2>${tagsHtml(a, 5)}<div class="meta">${esc(a.mood || '')}<br>${esc(a.atmosphere || '')}</div>${links(a.artist)}</div></div><div class="state-row"><button class="btn ${p.favourite ? 'gold' : ''}" data-flag="favourite">${p.favourite ? '★ Favourite' : '☆ Favourite'}</button><button class="btn" data-flag="explore">${p.explore ? '✓ Explore' : '+ Explore'}</button><button class="btn" data-flag="disliked">${p.disliked ? '✕ Disliked' : '− Dislike'}</button></div></section><section class="section panel profile-panel"><div class="eyebrow">Sonic profile</div>${meters(a)}${a.similar_to ? `<p class="small"><b>Related:</b> ${esc(a.similar_to)}</p>` : ''}${a.notes ? `<p class="small">${esc(a.notes)}</p>` : ''}</section><section class="section panel profile-panel"><div class="eyebrow">Personal note</div><textarea id="note" class="note" placeholder="Optional note…">${esc(p.note || '')}</textarea><button id="saveNote" class="btn" style="margin-top:8px">Save note</button></section><section class="section"><button class="btn primary" id="similarFromProfile">Find similar artists →</button></section>`, '');
  document.querySelectorAll('[data-flag]').forEach(b => b.onclick = () => setFlag(a.artist, b.dataset.flag));
  document.getElementById('saveNote').onclick = () => { pref(a.artist).note = document.getElementById('note').value; saveState(); toast('Note saved'); };
  document.getElementById('similarFromProfile').onclick = () => { state.page = 'discover'; render(); };
}
function meters(a) {
  return `<div class="meters">${[['Energy', 'energy'], ['Aggression', 'aggression'], ['Darkness', 'darkness'], ['Experimental', 'experimental'], ['Electronic', 'organic_electronic'], ['Accessibility', 'accessibility'], ['Rhythm', 'rhythm'], ['Studio / sample', 'studio']].map(([l, k]) => `<div class="meter"><span>${l}</span><div class="track"><div class="fill" style="width:${Number(a[k] || 0) * 10}%"></div></div><b>${a[k] ?? '–'}</b></div>`).join('')}</div>`;
}
function favourites() {
  const favs = Object.entries(prefs()).filter(([, p]) => p.favourite).map(([n]) => byName.get(n)).filter(Boolean).sort((a, b) => a.artist.localeCompare(b.artist));
  layout(`<section><div class="eyebrow">Your collection</div><h1 class="title">Favourites</h1><p class="subtitle">Artists you’ve starred on this phone.</p></section><section class="panel" style="padding:16px">${favs.length ? favs.map(a => rowHtml(a.artist, a.primary_genre)).join('') : '<div class="empty">No favourites yet. Tap ☆ Favourite on an artist to add one.</div>'}</section>`, 'favourites');
  document.querySelectorAll('[data-open]').forEach(b => b.onclick = () => openArtist(b.dataset.open));
}
function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1400);
}
function render() {
  if (state.page === 'discover') discover();
  else if (state.page === 'profile') profile();
  else if (state.page === 'favourites') favourites();
  else home();
}
async function installApp() {
  if (!deferredInstall) return;
  deferredInstall.prompt();
  await deferredInstall.userChoice;
  deferredInstall = null;
  render();
}
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; render(); });
window.addEventListener('appinstalled', () => { deferredInstall = null; toast('ATM installed'); });

fetch('catalog.json')
  .then(r => { if (!r.ok) throw new Error('catalog'); return r.json(); })
  .then(d => { artists = d.artists; byName = new Map(artists.map(a => [a.artist, a])); render(); })
  .catch(() => { document.getElementById('app').innerHTML = '<div class="loading"><div class="logo-a">Λ</div><p>ATM could not load its catalogue.<br>Run it from a web server rather than opening index.html directly.</p></div>'; });

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(() => {}));
}
