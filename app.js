let artists = [];
let byName = new Map();
let deferredInstall = null;
let vibeData = { genres: [], styles: [], moods: [] };

const APP_VERSION = '0.3';
const storeKey = 'atm-mobile-v01'; // Intentionally stable so personal data survives app updates.
const artworkCacheKey = 'atm-mobile-artwork-v1';
const ARTWORK_ENDPOINT = 'https://atm-artwork.zanderiii88.workers.dev/';
const ARTWORK_MAX_AGE = 1000 * 60 * 60 * 24 * 60;

const persisted = loadState();
const state = {
  page: 'home',
  selected: null,
  mode: 'Similar',
  reach: 20,
  prefs: {},
  recent: [],
  vibe: { genres: [], styles: [], moods: [] },
  vibeMatch: 'all',
  vibeSort: 'az',
  vibeApplied: false,
  listSort: { favourite: 'az', explore: 'az' },
  ...persisted,
};
state.vibe = { genres: [], styles: [], moods: [], ...(state.vibe || {}) };
state.listSort = { favourite: 'az', explore: 'az', ...(state.listSort || {}) };

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
    recent: state.recent || [],
    vibe: state.vibe || { genres: [], styles: [], moods: [] },
    vibeMatch: state.vibeMatch || 'all',
    vibeSort: state.vibeSort || 'az',
    vibeApplied: !!state.vibeApplied,
    listSort: state.listSort || { favourite: 'az', explore: 'az' },
  }));
}
function loadArtworkCache() {
  try { return JSON.parse(localStorage.getItem(artworkCacheKey) || '{}'); }
  catch { return {}; }
}
function saveArtworkCache() {
  try { localStorage.setItem(artworkCacheKey, JSON.stringify(artworkCache)); }
  catch { /* Private browsing/storage limits: artwork simply refetches later. */ }
}
function prefs() { return state.prefs || (state.prefs = {}); }
function pref(name) {
  return prefs()[name] || (prefs()[name] = { favourite: false, explore: false, disliked: false, note: '' });
}
function setFlag(name, key) {
  const p = pref(name);
  p[key] = !p[key];
  if (p[key] && (key === 'favourite' || key === 'explore')) p[`${key}Ts`] = Date.now();
  if (!p[key] && (key === 'favourite' || key === 'explore')) p[`${key}Ts`] = null;
  if (key === 'disliked' && p[key]) { p.favourite = false; p.explore = false; }
  if ((key === 'favourite' || key === 'explore') && p[key]) p.disliked = false;
  touch(name, key);
  saveState();
  render();
}
function touch(name, action = 'view') {
  state.recent = state.recent || [];
  state.recent = [{ artist: name, action, ts: Date.now() }, ...state.recent.filter(x => x.artist !== name)].slice(0, 30);
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
    } catch { return null; }
    finally { artworkPending.delete(name); }
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
  } else els.forEach(loadArtworkElement);
}

function splitTags(a) { return (a.style_tags || '').split(',').map(x => x.trim()).filter(Boolean); }
function splitMoods(a) { return (a.mood || '').split(/\s*\/\s*|,\s*|;\s*/).map(x => x.trim()).filter(Boolean); }
function tags(a, n = 4) { return splitTags(a).slice(0, n); }
function tagsHtml(a, n = 4) { return `<div class="tags">${tags(a, n).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>`; }
function yt(name) { return 'https://music.youtube.com/search?q=' + encodeURIComponent(name); }
function sp(name) { return 'https://open.spotify.com/search/' + encodeURIComponent(name); }
function links(name) {
  return `<div class="linkbar"><a class="link yt" href="${yt(name)}" target="_blank" rel="noopener">▶ YouTube Music</a><a class="link" href="${sp(name)}" target="_blank" rel="noopener">Spotify ↗</a></div>`;
}
function hero() {
  return `<div class="hero"><div class="hero-inner"><div class="wordmark"><span>Λ</span><span>T</span><span>M</span></div><div class="redline"></div><div class="fullname">Artists That Matter</div><div class="tagline">Discover more. Go deeper.</div></div></div>`;
}

function currentRoute() { return { atm: true, page: state.page, selected: state.selected, listType: state.listType || null }; }
function pushRoute(replace = false) {
  try {
    const method = replace ? 'replaceState' : 'pushState';
    history[method](currentRoute(), '', `#${state.page}`);
  } catch { /* PWA/browser history can be unavailable in restrictive modes. */ }
}
function navigate(page, opts = {}, push = true) {
  Object.assign(state, opts);
  state.page = page;
  if (push) pushRoute(false);
  render();
}
function go(page) {
  if (page === 'lucky') return lucky();
  if (page === 'explore') return navigate('explore');
  navigate(page);
}
function openArtist(name) {
  state.selected = name;
  touch(name, 'view');
  saveState();
  navigate('profile', { selected: name });
}
function lucky() {
  const disliked = new Set(Object.entries(prefs()).filter(([, p]) => p.disliked).map(([n]) => n));
  const pool = artists.filter(a => !disliked.has(a.artist));
  if (!pool.length) return;
  openArtist(pool[Math.floor(Math.random() * pool.length)].artist);
}

function layout(content, active = 'home') {
  const showBack = state.page !== 'home';
  document.getElementById('app').innerHTML = `<main class="shell"><div class="topbar"><div class="topbar-left">${showBack ? '<button id="backBtn" class="top-icon" aria-label="Back">←</button>' : ''}<button class="brand-button" data-nav="home"><span class="mini-mark">Λ</span><span class="mini-name">ATM / Artists That Matter</span></button></div><div class="top-actions"><button class="top-icon" data-nav="guide" aria-label="Guide">?</button><button id="installTop" class="btn icon install">Install</button></div></div>${content}</main><nav class="bottomnav five">${nav('home', '⌂', 'Home', active)}${nav('discover', '⌕', 'Discover', active)}${nav('vibe', '◇', 'Vibe', active)}${nav('lucky', '✦', 'Lucky', active)}${nav('favourites', '★', 'Favourites', active)}</nav>`;
  bindNav();
  const back = document.getElementById('backBtn');
  if (back) back.onclick = () => history.back();
  const ib = document.getElementById('installTop');
  if (deferredInstall && ib) { ib.style.display = 'block'; ib.onclick = installApp; }
  requestAnimationFrame(hydrateArtwork);
}
function nav(id, icon, label, active) { return `<button class="navbtn ${active === id ? 'active' : ''}" data-nav="${id}"><b>${icon}</b>${label}</button>`; }
function bindNav() { document.querySelectorAll('[data-nav]').forEach(b => b.onclick = () => go(b.dataset.nav)); }
function kpi(v, l, extra = '') { return `<div class="kpi"><strong>${esc(v)}</strong><span>${esc(l)}</span>${extra ? `<small>${esc(extra)}</small>` : ''}</div>`; }
function kpiLink(v, l, page, extra = '') { return `<button class="kpi kpi-link" data-nav="${page}"><strong>${esc(v)}</strong><span>${esc(l)}</span>${extra ? `<small>${esc(extra)}</small>` : ''}<i>→</i></button>`; }

function home() {
  const favs = Object.entries(prefs()).filter(([, p]) => p.favourite).map(([n]) => n);
  const explore = Object.entries(prefs()).filter(([, p]) => p.explore).map(([n]) => n);
  const recent = (state.recent || []).slice(0, 4);
  layout(`${hero()}<section class="section"><div class="eyebrow">Artists That Matter / ATM</div><h1 class="title">Your music map.</h1><p class="subtitle">Start with something you love, build your own lists, or describe the kind of thing you fancy and let ATM find the artists.</p><div class="actions"><button class="btn primary" data-nav="discover">Discover artists →</button><button class="btn" data-nav="lucky">✦ I’m Feeling Lucky</button></div></section><section class="section grid home-grid">${kpi(artists.length, 'Artists in ATM')}${kpiLink(favs.length, 'Favourites', 'favourites', 'Your starred artists')}${kpiLink(explore.length, 'Want to explore', 'explore', 'Your listening queue')}${kpiLink('Mix', 'Explore by Vibe', 'vibe', 'Genres, styles & moods')}</section><section class="section panel pad"><div class="eyebrow">Recently viewed</div>${recent.length ? recent.map(x => rowHtml(x.artist, humanAction(x.action))).join('') : '<div class="empty">Your recent artists will appear here.</div>'}</section><section class="section install-card panel"><div class="version-line"><b>ATM Mobile v${APP_VERSION}</b><span id="versionStatus">Checking for updates…</span></div><p class="small">Your favourites, Want to Explore list, dislikes, notes and history stay on this device.</p><div class="mini-actions"><button class="btn" data-nav="guide">Guide</button><button id="exportHome" class="btn">Export my ATM data</button><button id="installHome" class="btn" style="display:none">Install ATM</button></div></section>`, 'home');
  document.querySelectorAll('[data-open]').forEach(b => b.onclick = () => openArtist(b.dataset.open));
  const ih = document.getElementById('installHome');
  if (deferredInstall && ih) { ih.style.display = 'block'; ih.onclick = installApp; }
  const ex = document.getElementById('exportHome');
  if (ex) ex.onclick = exportPersonalData;
  checkVersion();
}
function humanAction(action) {
  return ({ favourite: 'Added to Favourites', explore: 'Added to Want to Explore', disliked: 'Marked Dislike', discover: 'Used in Discover', view: 'Viewed' })[action] || String(action || 'Viewed').replaceAll('_', ' ');
}
function rowHtml(name, detail, matched = '') {
  return `<div class="row"><div class="row-copy"><b>${esc(name)}</b><small>${esc(detail || '')}</small>${matched ? `<small class="matched">${esc(matched)}</small>` : ''}</div><button class="btn icon" data-open="${attr(name)}">Open →</button></div>`;
}

const discoverModes = {
  Similar: { label: 'Closest Match', help: 'Stay closest to the artist’s scene, tags and overall sonic profile.' },
  Adjacent: { label: 'Broaden It', help: 'Keep a meaningful musical connection while allowing more stylistic distance.' },
  Wildcard: { label: 'Wildcard', help: 'Push further afield while keeping at least a thread of overlap.' },
};
function discover() {
  const sel = state.selected ? byName.get(state.selected) : null;
  const disliked = new Set(Object.entries(prefs()).filter(([, p]) => p.disliked).map(([n]) => n));
  const recs = sel ? ATMEngine.recommend(sel, artists, state.mode, state.reach, 8, disliked) : [];
  const mode = discoverModes[state.mode] || discoverModes.Similar;
  const reach = state.mode === 'Wildcard' ? '' : `<div class="range-title"><b>Adventure</b><span>${state.mode === 'Similar' ? 'Fine-tune how far the closest matches can wander.' : 'Increase this to give Broaden It more room.'}</span></div><div class="range-row"><span>Safe</span><input id="reach" type="range" min="0" max="100" step="5" value="${state.reach}"><span>Wild <b id="reachVal">${state.reach}</b></span></div>`;
  layout(`<section><div class="eyebrow">Find something new</div><h1 class="title">Discover</h1><p class="subtitle">Choose an artist, then tell ATM how closely you want the recommendations to stay to it.</p><div class="searchbox"><input id="artistSearch" class="field" autocomplete="off" inputmode="search" placeholder="Choose or search for an artist…" value="${sel ? esc(sel.artist) : ''}" aria-label="Choose an artist"><button id="showArtistList" class="search-toggle" type="button" aria-label="Show artist list">⌄</button><div id="suggestions"></div></div><div class="seg discover-seg">${Object.entries(discoverModes).map(([key, info]) => `<button data-mode="${key}" class="${state.mode === key ? 'active' : ''}">${esc(info.label)}</button>`).join('')}</div><div class="mode-help"><b>${esc(mode.label)}</b><span>${esc(mode.help)}</span></div>${reach}</section>${sel ? selectedHead(sel) + `<section class="section"><div class="eyebrow">Top recommendations</div><div class="cards">${recs.map((r, i) => recCard(r, i + 1)).join('')}</div></section>` : '<div class="panel empty section">Choose an artist above, or tap ✦ Lucky.</div>'}`, 'discover');
  bindDiscover();
}
function selectedHead(a) {
  const p = pref(a.artist);
  return `<section class="artist-head"><div>${art(a.artist)}</div><div class="panel artist-info"><div class="eyebrow">${esc(a.primary_genre || 'Unclassified')} · ${esc(a.era || '')}</div><h2>${esc(a.artist)}</h2>${tagsHtml(a)}<div class="meta">${esc(a.mood || '')}<br>${esc(a.atmosphere || '')}</div>${links(a.artist)}</div></section><div class="state-row"><button class="btn ${p.favourite ? 'gold' : ''}" data-flag="favourite">${p.favourite ? '★ Favourite' : '☆ Favourite'}</button><button class="btn" data-flag="explore">${p.explore ? '✓ Want to Explore' : '+ Want to Explore'}</button><button class="btn" data-flag="disliked">${p.disliked ? '✕ Disliked' : '− Dislike'}</button></div>`;
}
function recCard(r, rank) {
  const a = r.artist;
  return `<article class="card"><div class="card-top">${art(a.artist)}<div class="card-body"><div class="rank">#${rank}</div><div class="artist-name">${esc(a.artist)}</div><div class="match">${Math.round(r.score * 100)}% match</div>${tagsHtml(a, 3)}<div class="why">${esc(r.why)}</div></div></div><div class="card-actions"><button class="btn" data-open="${attr(a.artist)}">Profile</button><a class="link yt" href="${yt(a.artist)}" target="_blank" rel="noopener">▶ YouTube Music</a></div></article>`;
}
function defaultArtistChoices() {
  const out = [], seen = new Set();
  const push = name => {
    if (!name || seen.has(name) || !byName.has(name)) return;
    seen.add(name); out.push(byName.get(name));
  };
  (state.recent || []).forEach(x => push(x.artist));
  Object.entries(prefs()).filter(([, p]) => p.favourite).forEach(([name]) => push(name));
  artists.forEach(a => push(a.artist));
  return out;
}
function filteredArtistChoices(query) {
  const q = query.trim().toLocaleLowerCase();
  if (!q) return defaultArtistChoices();
  return artists.map(a => {
    const n = a.artist.toLocaleLowerCase();
    let rank = 99;
    if (n === q) rank = 0;
    else if (n.startsWith(q)) rank = 1;
    else if (n.includes(q)) rank = 2;
    return { a, rank };
  }).filter(x => x.rank < 99).sort((x, y) => x.rank - y.rank || x.a.artist.localeCompare(y.a.artist)).map(x => x.a);
}
function bindDiscover() {
  const inp = document.getElementById('artistSearch');
  const sug = document.getElementById('suggestions');
  const toggle = document.getElementById('showArtistList');
  const initialValue = inp.value;
  let userEdited = false;
  const suggestionHtml = a => `<button class="suggestion" data-pick="${attr(a.artist)}"><b>${esc(a.artist)}</b><small>${esc(a.primary_genre || '')} · ${esc(a.style_tags || '')}</small></button>`;
  function showList(forceAll = false) {
    const query = forceAll || (!userEdited && inp.value === initialValue) ? '' : inp.value;
    const matches = filteredArtistChoices(query);
    sug.className = 'suggestions';
    if (!matches.length) { sug.innerHTML = '<div class="suggestion-note">No artists found.</div>'; return; }
    const label = query ? `Matches for “${esc(query)}”` : 'Choose an artist · type to filter';
    sug.innerHTML = `<div class="suggestion-note"><span>${label}</span><span>${matches.length} artists</span></div>${matches.map(suggestionHtml).join('')}`;
    sug.scrollTop = 0;
  }
  function hideList() { sug.className = ''; sug.innerHTML = ''; }
  sug.onclick = e => {
    const pick = e.target.closest('[data-pick]');
    if (!pick) return;
    state.selected = pick.dataset.pick;
    touch(state.selected, 'discover');
    saveState();
    render();
  };
  inp.onfocus = () => showList(false);
  inp.onclick = () => showList(false);
  inp.oninput = () => { userEdited = true; showList(false); };
  toggle.onclick = e => { e.preventDefault(); e.stopPropagation(); inp.focus(); showList(true); };
  document.onclick = e => { if (!e.target.closest('.searchbox')) hideList(); };
  document.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => { state.mode = b.dataset.mode; saveState(); render(); });
  const rg = document.getElementById('reach');
  if (rg) {
    rg.oninput = () => document.getElementById('reachVal').textContent = rg.value;
    rg.onchange = () => { state.reach = Number(rg.value); saveState(); render(); };
  }
  document.querySelectorAll('[data-open]').forEach(b => b.onclick = () => openArtist(b.dataset.open));
  document.querySelectorAll('[data-flag]').forEach(b => b.onclick = () => setFlag(state.selected, b.dataset.flag));
}

function profile() {
  const a = byName.get(state.selected) || artists[0];
  state.selected = a.artist;
  const p = pref(a.artist);
  layout(`<section><div class="eyebrow">Artist profile</div><div class="artist-head"><div>${art(a.artist)}</div><div class="panel artist-info"><div class="eyebrow">${esc(a.primary_genre || '')} · ${esc(a.era || '')}</div><h2>${esc(a.artist)}</h2>${tagsHtml(a, 5)}<div class="meta">${esc(a.mood || '')}<br>${esc(a.atmosphere || '')}</div>${links(a.artist)}</div></div><div class="state-row sticky-actions"><button class="btn ${p.favourite ? 'gold' : ''}" data-flag="favourite">${p.favourite ? '★ Favourite' : '☆ Favourite'}</button><button class="btn" data-flag="explore">${p.explore ? '✓ Want to Explore' : '+ Want to Explore'}</button><button class="btn" data-flag="disliked">${p.disliked ? '✕ Disliked' : '− Dislike'}</button></div></section><section class="section panel profile-panel"><div class="eyebrow">Sonic profile</div>${meters(a)}${a.similar_to ? `<p class="small"><b>Related:</b> ${esc(a.similar_to)}</p>` : ''}${a.notes ? `<p class="small">${esc(a.notes)}</p>` : ''}</section><section class="section panel profile-panel"><div class="eyebrow">Personal note</div><textarea id="note" class="note" placeholder="Optional note…">${esc(p.note || '')}</textarea><button id="saveNote" class="btn" style="margin-top:8px">Save note</button></section><section class="section"><button class="btn primary" id="similarFromProfile">Find recommendations from ${esc(a.artist)} →</button></section>`, '');
  document.querySelectorAll('[data-flag]').forEach(b => b.onclick = () => setFlag(a.artist, b.dataset.flag));
  document.getElementById('saveNote').onclick = () => { pref(a.artist).note = document.getElementById('note').value; saveState(); toast('Note saved'); };
  document.getElementById('similarFromProfile').onclick = () => navigate('discover', { selected: a.artist });
}
function meters(a) {
  return `<div class="meters">${[['Energy', 'energy'], ['Aggression', 'aggression'], ['Darkness', 'darkness'], ['Experimental', 'experimental'], ['Electronic', 'organic_electronic'], ['Accessibility', 'accessibility'], ['Rhythm', 'rhythm'], ['Studio / sample', 'studio']].map(([l, k]) => `<div class="meter"><span>${l}</span><div class="track"><div class="fill" style="width:${Number(a[k] || 0) * 10}%"></div></div><b>${a[k] ?? '–'}</b></div>`).join('')}</div>`;
}

function personalList(kind) {
  const isFav = kind === 'favourite';
  const title = isFav ? 'Favourites' : 'Want to Explore';
  const subtitle = isFav ? 'Artists you’ve starred on this phone.' : 'Artists you’ve saved to come back and try.';
  const active = isFav ? 'favourites' : '';
  layout(`<section><div class="eyebrow">Your collection</div><h1 class="title">${title}</h1><p class="subtitle">${subtitle}</p><div class="list-tools"><input id="listSearch" class="field" inputmode="search" placeholder="Search this list…"><select id="listSort" class="field select"><option value="az" ${state.listSort[kind] === 'az' ? 'selected' : ''}>A–Z</option><option value="recent" ${state.listSort[kind] === 'recent' ? 'selected' : ''}>Recently added</option></select></div></section><section id="listRows" class="panel pad"></section>`, active);
  const inp = document.getElementById('listSearch');
  const sort = document.getElementById('listSort');
  const rows = document.getElementById('listRows');
  function draw() {
    const q = inp.value.trim().toLowerCase();
    let list = Object.entries(prefs()).filter(([, p]) => !!p[kind]).map(([name, p]) => ({ a: byName.get(name), p })).filter(x => x.a);
    if (q) list = list.filter(x => x.a.artist.toLowerCase().includes(q) || (x.a.primary_genre || '').toLowerCase().includes(q) || (x.a.style_tags || '').toLowerCase().includes(q));
    if (sort.value === 'recent') list.sort((x, y) => Number(y.p[`${kind}Ts`] || 0) - Number(x.p[`${kind}Ts`] || 0) || x.a.artist.localeCompare(y.a.artist));
    else list.sort((x, y) => x.a.artist.localeCompare(y.a.artist));
    rows.innerHTML = list.length ? list.map(x => `<div class="row"><div class="row-copy"><b>${esc(x.a.artist)}</b><small>${esc(x.a.primary_genre || '')}</small></div><div class="row-actions"><button class="btn quiet" data-remove="${attr(x.a.artist)}">Remove</button><button class="btn icon" data-open="${attr(x.a.artist)}">Open →</button></div></div>`).join('') : `<div class="empty">${q ? 'No matching artists in this list.' : isFav ? 'No favourites yet. Tap ☆ Favourite on an artist to add one.' : 'Nothing saved yet. Tap + Want to Explore on an artist to add one.'}</div>`;
    rows.querySelectorAll('[data-open]').forEach(b => b.onclick = () => openArtist(b.dataset.open));
    rows.querySelectorAll('[data-remove]').forEach(b => b.onclick = () => setFlag(b.dataset.remove, kind));
  }
  inp.oninput = draw;
  sort.onchange = () => { state.listSort[kind] = sort.value; saveState(); draw(); };
  draw();
}
function favourites() { personalList('favourite'); }
function exploreList() { personalList('explore'); }

function canonicalGenre(g) {
  if (g === 'Punk') return 'Punk / Hardcore';
  if (g === 'Folk') return 'Folk / Singer-Songwriter / Country';
  return g || 'Unclassified';
}
function buildVibeData() {
  const genreCounts = new Map(), styleCounts = new Map(), moodCounts = new Map();
  for (const a of artists) {
    const g = canonicalGenre(a.primary_genre);
    genreCounts.set(g, (genreCounts.get(g) || 0) + 1);
    for (const s of splitTags(a)) styleCounts.set(s, (styleCounts.get(s) || 0) + 1);
    for (const m of splitMoods(a)) moodCounts.set(m, (moodCounts.get(m) || 0) + 1);
  }
  const sorter = ([a, ac], [b, bc]) => bc - ac || a.localeCompare(b);
  vibeData = {
    genres: [...genreCounts.entries()].sort(sorter),
    styles: [...styleCounts.entries()].sort(sorter),
    moods: [...moodCounts.entries()].sort(sorter),
  };
}
function selectedSet(type) { return new Set(state.vibe[type] || []); }
function setVibeValue(type, value, checked) {
  const set = selectedSet(type);
  checked ? set.add(value) : set.delete(value);
  state.vibe[type] = [...set];
  state.vibeApplied = false;
  saveState();
  updateVibeSelectionUi();
}
function filterOptionHtml(type, value, count) {
  const checked = selectedSet(type).has(value) ? 'checked' : '';
  return `<label class="check-row"><input type="checkbox" data-vibe-type="${type}" value="${attr(value)}" ${checked}><span>${esc(value)}</span><small>${count}</small></label>`;
}
function filterList(type, query = '') {
  const q = query.trim().toLowerCase();
  const data = vibeData[type];
  const selected = selectedSet(type);
  let matches = q ? data.filter(([name]) => name.toLowerCase().includes(q)) : data.slice(0, type === 'genres' ? data.length : 60);
  const selectedRows = data.filter(([name]) => selected.has(name) && !matches.some(([n]) => n === name));
  matches = [...selectedRows, ...matches];
  const capped = matches.slice(0, q ? 160 : matches.length);
  return { html: capped.map(([name, count]) => filterOptionHtml(type, name, count)).join(''), shown: capped.length, total: q ? matches.length : data.length };
}
function vibeChips() {
  const groups = [['genres', 'Genre'], ['styles', 'Style'], ['moods', 'Mood']];
  const chips = [];
  groups.forEach(([type, label]) => (state.vibe[type] || []).forEach(value => chips.push(`<button class="filter-chip" data-vibe-remove="1" data-type="${type}" data-value="${attr(value)}"><span>${esc(label)}:</span> ${esc(value)} ×</button>`)));
  return chips.length ? chips.join('') : '<span class="small">No vibe filters selected yet.</span>';
}
function updateVibeSelectionUi() {
  const chips = document.getElementById('vibeChips');
  if (chips) {
    chips.innerHTML = vibeChips();
    chips.querySelectorAll('[data-vibe-remove]').forEach(b => b.onclick = () => {
      setVibeValue(b.dataset.type, b.dataset.value, false);
      const box = document.querySelector(`input[data-vibe-type="${b.dataset.type}"][value="${CSS.escape(b.dataset.value)}"]`);
      if (box) box.checked = false;
    });
  }
  const show = document.getElementById('showVibeResults');
  if (show) show.textContent = `Show artists${vibeSelectedCount() ? ` (${vibeSelectedCount()} filters)` : ''}`;
}
function vibeSelectedCount() { return ['genres', 'styles', 'moods'].reduce((n, t) => n + (state.vibe[t] || []).length, 0); }
function vibeArtistMatch(a) {
  const genres = state.vibe.genres || [], styles = state.vibe.styles || [], moods = state.vibe.moods || [];
  const artistGenre = canonicalGenre(a.primary_genre);
  const artistStyles = new Set(splitTags(a).map(x => x.toLowerCase()));
  const artistMoods = new Set(splitMoods(a).map(x => x.toLowerCase()));
  const genreMatches = genres.filter(g => g === artistGenre);
  const styleMatches = styles.filter(s => artistStyles.has(s.toLowerCase()));
  const moodMatches = moods.filter(m => artistMoods.has(m.toLowerCase()));
  const total = genres.length + styles.length + moods.length;
  if (!total) return null;
  let ok;
  if (state.vibeMatch === 'any') ok = !!(genreMatches.length || styleMatches.length || moodMatches.length);
  else {
    const genreOk = !genres.length || genreMatches.length > 0; // Multiple primary genres are alternatives.
    const styleOk = styleMatches.length === styles.length;
    const moodOk = moodMatches.length === moods.length;
    ok = genreOk && styleOk && moodOk;
  }
  if (!ok) return null;
  const matched = [...genreMatches, ...styleMatches, ...moodMatches];
  const weighted = genreMatches.length * 1.2 + styleMatches.length * 2 + moodMatches.length * 1.4;
  const denom = Math.max(1, genres.length * 1.2 + styles.length * 2 + moods.length * 1.4);
  return { a, matched, score: weighted / denom };
}
function currentVibeResults() {
  const disliked = new Set(Object.entries(prefs()).filter(([, p]) => p.disliked).map(([n]) => n));
  let rows = artists.filter(a => !disliked.has(a.artist)).map(vibeArtistMatch).filter(Boolean);
  if (state.vibeSort === 'best') rows.sort((x, y) => y.score - x.score || x.a.artist.localeCompare(y.a.artist));
  else rows.sort((x, y) => x.a.artist.localeCompare(y.a.artist));
  return rows;
}
function vibe() {
  const results = state.vibeApplied ? currentVibeResults() : [];
  const resultHtml = !state.vibeApplied ? '<div class="panel empty section">Choose one or more filters, then tap Show artists.</div>' : `<section class="section"><div class="result-head"><div><div class="eyebrow">Results</div><h2>${results.length} artist${results.length === 1 ? '' : 's'}</h2></div><div class="result-actions"><select id="vibeSort" class="field select compact"><option value="az" ${state.vibeSort === 'az' ? 'selected' : ''}>A–Z</option><option value="best" ${state.vibeSort === 'best' ? 'selected' : ''}>Best match</option></select><button id="vibeSurprise" class="btn" ${results.length ? '' : 'disabled'}>✦ Surprise me</button></div></div><div class="panel pad vibe-results">${results.length ? results.map(r => rowHtml(r.a.artist, r.a.primary_genre, `Matched: ${r.matched.join(' · ')}`)).join('') : '<div class="empty">No artists match that combination. Try Match any, or remove one filter.</div>'}</div></section>`;
  layout(`<section><div class="eyebrow">Mix the catalogue</div><h1 class="title">Explore by Vibe</h1><p class="subtitle">Combine genres, sub-genres and moods. ATM will find artists that fit the combination, excluding anything you’ve disliked.</p><div id="vibeChips" class="filter-chips">${vibeChips()}</div><div class="match-toggle"><span>Matching</span><button data-vibe-match="all" class="${state.vibeMatch === 'all' ? 'active' : ''}">Match all</button><button data-vibe-match="any" class="${state.vibeMatch === 'any' ? 'active' : ''}">Match any</button></div><p class="small">With Match all, multiple primary genres are treated as alternatives; all selected styles and moods must match.</p></section><section class="section filter-stack"><details open class="filter-panel"><summary>Genres <span>${state.vibe.genres.length || ''}</span></summary><div id="genreOptions" class="check-list genres">${filterList('genres').html}</div></details><details class="filter-panel"><summary>Sub-genres & styles <span>${state.vibe.styles.length || ''}</span></summary><div class="filter-search"><input id="styleFilterSearch" class="field" placeholder="Find a sub-genre or style…"></div><div id="styleOptions" class="check-list">${filterList('styles').html}</div><div id="styleCount" class="filter-count">Showing the most common styles. Search to reach the full list.</div></details><details class="filter-panel"><summary>Moods <span>${state.vibe.moods.length || ''}</span></summary><div class="filter-search"><input id="moodFilterSearch" class="field" placeholder="Find a mood…"></div><div id="moodOptions" class="check-list">${filterList('moods').html}</div><div id="moodCount" class="filter-count">Showing the most common moods. Search to reach the full list.</div></details><div class="vibe-actions"><button id="clearVibe" class="btn">Clear filters</button><button id="showVibeResults" class="btn primary">Show artists${vibeSelectedCount() ? ` (${vibeSelectedCount()} filters)` : ''}</button></div></section>${resultHtml}`, 'vibe');
  bindVibe();
}
function bindVibe() {
  function bindChecks(container) {
    container.querySelectorAll('input[data-vibe-type]').forEach(box => box.onchange = () => setVibeValue(box.dataset.vibeType, box.value, box.checked));
  }
  document.querySelectorAll('.check-list').forEach(bindChecks);
  document.querySelectorAll('[data-vibe-match]').forEach(b => b.onclick = () => { state.vibeMatch = b.dataset.vibeMatch; state.vibeApplied = false; saveState(); render(); });
  updateVibeSelectionUi();
  const styleSearch = document.getElementById('styleFilterSearch');
  const moodSearch = document.getElementById('moodFilterSearch');
  function redrawOptions(type, query, id, countId) {
    const result = filterList(type, query);
    const box = document.getElementById(id);
    box.innerHTML = result.html || '<div class="empty">No matching filters.</div>';
    bindChecks(box);
    const note = document.getElementById(countId);
    if (note) note.textContent = query ? `Showing ${result.shown} of ${result.total} matching filters.` : 'Showing the most common options. Search to reach the full list.';
  }
  if (styleSearch) styleSearch.oninput = () => redrawOptions('styles', styleSearch.value, 'styleOptions', 'styleCount');
  if (moodSearch) moodSearch.oninput = () => redrawOptions('moods', moodSearch.value, 'moodOptions', 'moodCount');
  document.getElementById('clearVibe').onclick = () => { state.vibe = { genres: [], styles: [], moods: [] }; state.vibeApplied = false; saveState(); render(); };
  document.getElementById('showVibeResults').onclick = () => { if (!vibeSelectedCount()) return toast('Choose at least one filter'); state.vibeApplied = true; saveState(); render(); setTimeout(() => document.querySelector('.result-head')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50); };
  const sort = document.getElementById('vibeSort');
  if (sort) sort.onchange = () => { state.vibeSort = sort.value; saveState(); render(); };
  const surprise = document.getElementById('vibeSurprise');
  if (surprise) surprise.onclick = () => { const rows = currentVibeResults(); if (rows.length) openArtist(rows[Math.floor(Math.random() * rows.length)].a.artist); };
  document.querySelectorAll('[data-open]').forEach(b => b.onclick = () => openArtist(b.dataset.open));
}

function guide() {
  layout(`<section><div class="eyebrow">Help & how it works</div><h1 class="title">Guide</h1><p class="subtitle">ATM is designed to answer two simple questions: “I like this — what else?” and “I fancy this kind of thing — who should I try?”</p></section><section class="guide-stack"><article class="panel guide-card"><h2>⌕ Discover</h2><p>Pick any artist from the full catalogue. <b>Closest Match</b> stays nearest to their scene and sonic profile. <b>Broaden It</b> keeps a meaningful connection but allows more distance. <b>Wildcard</b> deliberately pushes further away.</p><p>The Adventure slider fine-tunes Closest Match and Broaden It. Wildcard has no slider because it is already designed to roam.</p></article><article class="panel guide-card"><h2>◇ Explore by Vibe</h2><p>Mix primary genres, sub-genres/styles and moods, then tap <b>Show artists</b>. Results are alphabetical by default, with an optional Best Match sort.</p><p><b>Match all</b> requires every selected style and mood to fit; if you choose several primary genres, an artist can belong to any one of them. <b>Match any</b> gives a much broader pool. Disliked artists are excluded.</p></article><article class="panel guide-card"><h2>★ Your lists</h2><p><b>Favourite</b> is for artists you already value. <b>Want to Explore</b> is your listening queue. Both lists can be searched and sorted A–Z or by recently added. <b>Dislike</b> removes an artist from those lists and keeps them out of Lucky and Vibe results.</p></article><article class="panel guide-card"><h2>✦ Lucky & listening</h2><p><b>I’m Feeling Lucky</b> picks a random artist from ATM, excluding dislikes. Artist pages link directly to YouTube Music first, with Spotify as a secondary option.</p></article><article class="panel guide-card"><h2>↩ Navigation</h2><p>ATM now uses normal app/browser history, so Back should return through the artist pages and screens you visited rather than throwing you somewhere unrelated.</p></article><article class="panel guide-card"><h2>▣ Your data & backup</h2><p>Favourites, Want to Explore, dislikes, notes and history are stored locally on this device. They are not shared with other family members using the same hosted ATM site.</p><p>Use <b>Export my ATM data</b> to download a small JSON backup. <b>Restore backup</b> can restore one of those files on this device. Restoring replaces the current local ATM personal data.</p><div class="mini-actions"><button id="exportGuide" class="btn primary">Export my ATM data</button><button id="importGuide" class="btn">Restore backup</button><input id="importFile" type="file" accept="application/json,.json" hidden></div></article><article class="panel guide-card"><h2>▤ Updates & artwork</h2><p>ATM Mobile is a PWA. New versions are published to the same GitHub Pages address and installed copies normally update when reopened online. Artist images come through the secure ATM artwork service; the YouTube API key is not stored in this app.</p><div class="version-line"><b>ATM Mobile v${APP_VERSION}</b><span id="versionStatus">Checking for updates…</span></div></article></section>`, '');
  document.getElementById('exportGuide').onclick = exportPersonalData;
  const importBtn = document.getElementById('importGuide');
  const importFile = document.getElementById('importFile');
  importBtn.onclick = () => importFile.click();
  importFile.onchange = () => { if (importFile.files?.[0]) restorePersonalData(importFile.files[0]); };
  checkVersion();
}
function exportPersonalData() {
  const payload = {
    app: 'Artists That Matter Mobile',
    exportVersion: 1,
    appVersion: APP_VERSION,
    exportedAt: new Date().toISOString(),
    prefs: state.prefs || {},
    recent: state.recent || [],
    discovery: { selected: state.selected, mode: state.mode, reach: state.reach },
    vibe: { filters: state.vibe, match: state.vibeMatch, sort: state.vibeSort },
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `atm-mobile-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast('ATM backup exported');
}
async function restorePersonalData(file) {
  try {
    const data = JSON.parse(await file.text());
    if (data.app !== 'Artists That Matter Mobile' || !data.prefs || !Array.isArray(data.recent)) throw new Error('invalid');
    if (!confirm('Restore this ATM backup? This will replace the personal ATM data currently stored on this device.')) return;
    state.prefs = data.prefs || {};
    state.recent = data.recent || [];
    if (data.discovery) {
      state.selected = data.discovery.selected || state.selected;
      state.mode = data.discovery.mode || state.mode;
      state.reach = Number.isFinite(Number(data.discovery.reach)) ? Number(data.discovery.reach) : state.reach;
    }
    if (data.vibe) {
      state.vibe = { genres: [], styles: [], moods: [], ...(data.vibe.filters || {}) };
      state.vibeMatch = data.vibe.match || 'all';
      state.vibeSort = data.vibe.sort || 'az';
    }
    saveState();
    toast('ATM backup restored');
    setTimeout(() => navigate('home'), 500);
  } catch { alert('That file does not look like an ATM Mobile backup.'); }
}
async function checkVersion() {
  const el = document.getElementById('versionStatus');
  if (!el) return;
  try {
    const r = await fetch(`version.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!r.ok) throw new Error('version');
    const d = await r.json();
    if (d.version === APP_VERSION) { el.textContent = '• Up to date'; el.className = 'version-ok'; }
    else { el.textContent = `• v${d.version} available`; el.className = 'version-update'; }
  } catch { el.textContent = '• Offline'; }
}

function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1600);
}
function render() {
  if (!artists.length) return;
  if (state.page === 'discover') discover();
  else if (state.page === 'profile') profile();
  else if (state.page === 'favourites') favourites();
  else if (state.page === 'explore') exploreList();
  else if (state.page === 'vibe') vibe();
  else if (state.page === 'guide') guide();
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
window.addEventListener('popstate', e => {
  if (e.state?.atm) {
    state.page = e.state.page || 'home';
    state.selected = e.state.selected || state.selected;
    if (e.state.listType) state.listType = e.state.listType;
    render();
  } else {
    state.page = 'home';
    render();
  }
});

fetch('catalog.json')
  .then(r => { if (!r.ok) throw new Error('catalog'); return r.json(); })
  .then(d => {
    artists = d.artists;
    byName = new Map(artists.map(a => [a.artist, a]));
    buildVibeData();
    state.page = 'home';
    pushRoute(true);
    render();
  })
  .catch(() => { document.getElementById('app').innerHTML = '<div class="loading"><div class="logo-a">Λ</div><p>ATM could not load its catalogue.<br>Run it from a web server rather than opening index.html directly.</p></div>'; });

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(reg => reg.update()).catch(() => {}));
}
