let artists = [];
let byName = new Map();
let deferredInstall = null;
let vibeData = { genres: [], styles: [], moods: [] };

const APP_VERSION = '0.19.5';
const storeKey = 'atm-mobile-v01'; // Intentionally stable so personal data survives app updates.
const artworkCacheKey = 'atm-mobile-artwork-v2';
const ARTWORK_ENDPOINT = 'https://atm-artwork.zanderiii88.workers.dev/';
const ARTWORK_MAX_AGE = 1000 * 60 * 60 * 24 * 180;
const YOUTUBE_ARTWORK_MAX_AGE = 1000 * 60 * 60 * 24 * 29;
const ARTWORK_MISS_MAX_AGE = 1000 * 60 * 60 * 24;
const AUDIODB_SEARCH = 'https://www.theaudiodb.com/api/v1/json/123/search.php?s=';
let knownArtwork = {};

const persisted = loadState();
const state = {
  page: 'home',
  selected: null,
  mode: 'Similar',
  prefs: {},
  recent: [],
  searchRecent: [],
  vibe: { genres: [], styles: [], moods: [] },
  vibeMatch: 'all',
  vibeSort: 'az',
  vibeApplied: false,
  vibePreset: '',
  listSort: { favourite: 'az', explore: 'az' },
  musicForPreset: '',
  musicForMode: 'ranked',
  musicForShuffleSeed: 0,
  discoverOrder: 'ranked',
  discoverShuffleSeed: 0,
  vibeOrder: 'ranked',
  vibeShuffleSeed: 0,
  whatsNewDismissed: '',
  ...persisted,
};
state.vibe = { genres: [], styles: [], moods: [], ...(state.vibe || {}) };
state.listSort = { favourite: 'az', explore: 'az', ...(state.listSort || {}) };
state.searchRecent = Array.isArray(state.searchRecent) ? state.searchRecent : [];
if (!state.searchRecent.length && Array.isArray(state.recent)) state.searchRecent = state.recent.filter(x => x.action === 'discover').map(x => x.artist).slice(0, 12);
const legacyMusicForLabels = {
  'Need to Calm Down': 'Calm Down',
  'Need to Wake Up': 'Wake Up',
  'Getting Hyped': 'Get Hyped',
  'Getting Ready to Go Out': 'Going Out',
  'That First Coffee': 'First Coffee',
  'Dancing… to Funk & Disco': 'Dancing… to Funk',
};
state.musicForPreset = legacyMusicForLabels[state.musicForPreset] || state.musicForPreset || '';

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
    prefs: state.prefs || {},
    recent: state.recent || [],
    searchRecent: state.searchRecent || [],
    vibe: state.vibe || { genres: [], styles: [], moods: [] },
    vibeMatch: state.vibeMatch || 'all',
    vibeSort: state.vibeSort || 'az',
    vibeApplied: !!state.vibeApplied,
    vibePreset: state.vibePreset || '',
    listSort: state.listSort || { favourite: 'az', explore: 'az' },
    musicForPreset: state.musicForPreset || '',
    musicForMode: state.musicForMode || 'ranked',
    musicForShuffleSeed: Number(state.musicForShuffleSeed || 0),
    discoverOrder: state.discoverOrder || 'ranked',
    discoverShuffleSeed: Number(state.discoverShuffleSeed || 0),
    vibeOrder: state.vibeOrder || 'ranked',
    vibeShuffleSeed: Number(state.vibeShuffleSeed || 0),
    whatsNewDismissed: state.whatsNewDismissed || '',
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
function artworkKey(name) {
  return String(name || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim();
}
function cachedArtwork(name) {
  const entry = artworkCache[name];
  if (!entry || !entry.ts) return null;
  const isYouTube = entry.source === 'YouTube' || !!entry.channel;
  const maxAge = entry.miss ? ARTWORK_MISS_MAX_AGE : (isYouTube ? YOUTUBE_ARTWORK_MAX_AGE : ARTWORK_MAX_AGE);
  if (Date.now() - entry.ts > maxAge) {
    delete artworkCache[name];
    saveArtworkCache();
    return null;
  }
  return entry.miss ? '__MISS__' : (entry.url || null);
}
function storeArtwork(name, result) {
  if (!result?.url) return null;
  artworkCache[name] = { url: result.url, ts: Date.now(), source: result.source || '', provider_id: result.id || '' };
  saveArtworkCache();
  return result.url;
}
function markArtworkMiss(name) {
  artworkCache[name] = { miss: true, ts: Date.now() };
  saveArtworkCache();
}
function knownArtworkFor(name) {
  const item = knownArtwork?.[name];
  if (!item) return null;
  if (typeof item === 'string') return { url: item, source: 'ATM artwork map' };
  return item.url ? item : null;
}
async function fetchAudioDbArtwork(name) {
  try {
    const response = await fetch(`${AUDIODB_SEARCH}${encodeURIComponent(name)}`, { mode: 'cors', cache: 'default' });
    if (!response.ok) return null;
    const data = await response.json();
    const candidate = data?.artists?.[0];
    if (!candidate) return null;
    const wanted = artworkKey(name);
    const aliases = [candidate.strArtist, candidate.strArtistStripped, ...(String(candidate.strArtistAlternate || '').split(/[,;/]/))].filter(Boolean).map(artworkKey);
    if (!aliases.includes(wanted)) return null;
    let image = candidate.strArtistThumb || candidate.strArtistWideThumb || candidate.strArtistFanart || '';
    if (!image) return null;
    if (/theaudiodb\.com\/images\//i.test(image) && !/\/(small|medium|tiny)$/.test(image)) image += '/small';
    return { url: image, source: 'TheAudioDB', id: candidate.idArtist || '' };
  } catch { return null; }
}
async function fetchWorkerArtwork(name) {
  try {
    const url = `${ARTWORK_ENDPOINT}?artist=${encodeURIComponent(name)}`;
    const response = await fetch(url, { mode: 'cors', cache: 'default' });
    if (!response.ok) return null;
    const data = await response.json();
    if (!data?.ok || !data.image) return null;
    return { url: data.image, source: 'YouTube', id: data.channel || '' };
  } catch { return null; }
}
async function fetchArtwork(name) {
  const cached = cachedArtwork(name);
  if (cached === '__MISS__') return null;
  if (cached) return cached;
  const known = knownArtworkFor(name);
  if (known) return storeArtwork(name, known);
  if (artworkPending.has(name)) return artworkPending.get(name);
  const request = (async () => {
    try {
      const audioDb = await fetchAudioDbArtwork(name);
      if (audioDb) return storeArtwork(name, audioDb);
      const youtube = await fetchWorkerArtwork(name);
      if (youtube) return storeArtwork(name, youtube);
      markArtworkMiss(name);
      return null;
    } finally { artworkPending.delete(name); }
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
  if (cached && cached !== '__MISS__') { applyArtwork(el, cached); return; }
  if (cached === '__MISS__') return;
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
  return `<div class="hero"><div class="hero-inner"><div class="wordmark"><span>Λ</span><span>T</span><span>M</span></div><div class="redline"></div><div class="fullname">Artists That Matter</div><div class="tagline">Discover more. Go deeper.</div><div class="hero-home-copy"><b>Your music map.</b><span>Start with an artist you love, choose a mood, or let ATM surprise you.</span></div></div></div>`;
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
  document.getElementById('app').innerHTML = `<main class="shell"><div class="topbar"><div class="topbar-left">${showBack ? '<button id="backBtn" class="top-icon" aria-label="Back">←</button>' : ''}<button class="brand-button" data-nav="home"><span class="mini-mark">Λ</span><span class="mini-name">ATM / Artists That Matter</span></button></div><div class="top-actions"><button class="top-icon" data-nav="guide" aria-label="Guide">?</button><button id="installTop" class="btn icon install">Install</button></div></div>${content}</main><nav class="bottomnav six">${nav('home', 'home', 'Home', active)}${nav('discover', 'match-people', 'Match', active)}${nav('vibe', 'vibe-wave', 'Vibes', active)}${nav('musicfor', 'music-cassette', 'Mixtapes', active)}${nav('lucky', 'lucky', 'Lucky', active)}${nav('favourites', 'favourite', 'Favourites', active)}</nav>`;
  bindNav();
  const back = document.getElementById('backBtn');
  if (back) back.onclick = () => history.back();
  const ib = document.getElementById('installTop');
  if (deferredInstall && ib) { ib.style.display = 'block'; ib.onclick = installApp; }
  requestAnimationFrame(hydrateArtwork);
}
function nav(id, icon, label, active) { return `<button class="navbtn ${active === id ? 'active' : ''}" data-nav="${id}"><b>${navIcon(icon)}</b>${label}</button>`; }
function bindNav() { document.querySelectorAll('[data-nav]').forEach(b => b.onclick = () => go(b.dataset.nav)); }
function navIcon(kind) {
  if (kind === 'home') return `<svg class="nav-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11.5 12 5l8 6.5"></path><path d="M6.5 10.5V19h11v-8.5"></path></svg>`;
  if (kind === 'match-people') return `<svg class="nav-svg nav-match-svg" viewBox="0 0 30 24" aria-hidden="true"><circle cx="5" cy="6" r="3"></circle><path d="M1 17c0-4 1.5-6 4-6s4 2 4 6"></path><path d="M11 11h8m-3-3 3 3-3 3"></path><circle cx="25" cy="6" r="3"></circle><path d="M21 17c0-4 1.5-6 4-6s4 2 4 6"></path></svg>`;
  if (kind === 'vibe-wave') return `<svg class="nav-svg nav-vibe-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13.5c1.2 0 1.2-5 2.4-5s1.2 8 2.4 8 1.2-11 2.4-11 1.2 14 2.4 14 1.2-10 2.4-10 1.2 6 2.4 6"></path></svg>`;
  if (kind === 'music-cassette') return `<svg class="nav-svg nav-music-svg" viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5.5" width="17" height="13" rx="2.2"></rect><circle cx="9" cy="11.5" r="2.1"></circle><circle cx="15" cy="11.5" r="2.1"></circle><path d="M11.1 11.5h1.8"></path><path d="M7 16h10"></path><path d="M9.2 16 8.1 18.5m6.7-2.5 1.1 2.5"></path></svg>`;
  if (kind === 'lucky') return `<svg class="nav-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5 14.6 9.4 20.5 12 14.6 14.6 12 20.5 9.4 14.6 3.5 12 9.4 9.4z"></path></svg>`;
  if (kind === 'favourite') return `<svg class="nav-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.7 5.5 6 .9-4.4 4.3 1 6-5.3-2.8-5.3 2.8 1-6-4.4-4.3 6-.9z"></path></svg>`;
  return kind;
}
function homeIcon(kind) {
  if (kind === 'match') return `<svg class="home-svg match-svg" viewBox="0 0 64 32" aria-hidden="true"><circle cx="10" cy="8" r="5"></circle><path d="M2 27c0-7 3-11 8-11s8 4 8 11"></path><path d="M23 16h16m-5-5 5 5-5 5"></path><circle cx="54" cy="8" r="5"></circle><path d="M46 27c0-7 3-11 8-11s8 4 8 11"></path></svg>`;
  if (kind === 'musicfor') return `<svg class="home-svg musicfor-svg" viewBox="0 0 64 36" aria-hidden="true"><rect x="8" y="4" width="48" height="28" rx="5"></rect><rect x="15" y="9" width="34" height="13" rx="2"></rect><circle cx="24" cy="15.5" r="4.5"></circle><circle cx="40" cy="15.5" r="4.5"></circle><path d="M28.5 15.5h7"></path><path d="M18 27h28"></path><path d="m23 27-3 5m21-5 3 5"></path></svg>`;
  if (kind === 'lucky') return `<span class="home-glyph" aria-hidden="true">✦</span>`;
  if (kind === 'vibe') return `<svg class="home-svg vibe-svg" viewBox="0 0 64 32" aria-hidden="true"><path d="M2 16c2 0 2-9 4-9s2 18 4 18 2-24 4-24 2 30 4 30 2-22 4-22 2 14 4 14 2-8 4-8 2 5 4 5"></path></svg>`;
  return `<svg class="home-svg vibe-svg" viewBox="0 0 64 32" aria-hidden="true"><path d="M2 16c2 0 2-9 4-9s2 18 4 18 2-24 4-24 2 30 4 30 2-22 4-22 2 14 4 14 2-8 4-8 2 5 4 5"></path></svg>`;
}
function homeActionCard(page, title, kicker, detail, icon) {
  return `<button class="home-action-card" data-nav="${page}"><span class="home-action-icon">${homeIcon(icon)}</span><span class="home-action-copy"><b>${title}</b><small>${kicker}</small>${detail ? `<em>${detail}</em>` : ''}</span><i>→</i></button>`;
}
function listIcon(kind) {
  if (kind === 'favourite') return navIcon('favourite');
  return `<svg class="nav-svg list-search-svg" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="5.5"></circle><path d="M14.5 14.5 20 20"></path></svg>`;
}
function homeListCard(page, count, title, detail, icon) {
  return `<button class="home-list-card" data-nav="${page}"><span class="home-list-icon">${listIcon(icon)}</span><span class="home-list-copy"><b>${title}</b><small>${detail}</small><strong class="home-list-count">${esc(count)}</strong></span><i>→</i></button>`;
}
function homeCatalogueCard(count) {
  return `<button class="home-catalogue-card" data-nav="catalogue"><strong>${esc(Number(count).toLocaleString())}</strong><span>Artists in ATM</span><i>Browse A–Z →</i></button>`;
}
function whatsNewCard() {
  if (state.whatsNewDismissed === APP_VERSION) return '';
  return `<section class="section whats-new-card"><button id="dismissWhatsNew" class="whats-new-dismiss" type="button" aria-label="Dismiss What’s New">×</button><div class="whats-new-copy"><div class="whats-new-kicker"><span class="new-badge">NEW</span><span>Mixtape reference tracks</span></div><h2>Mixtape matches informed by the original tracks.</h2><p>Euroshock, Soft Focus, Disco and Funk now use the recovered original suggestions as their editorial baseline.</p></div><button id="whatsNewPlaylists" class="btn primary whats-new-action">Explore Mixtapes →</button></section>`;
}

function home() {
  const favs = Object.entries(prefs()).filter(([, p]) => p.favourite).map(([n]) => n);
  const explore = Object.entries(prefs()).filter(([, p]) => p.explore).map(([n]) => n);
  const recent = (state.recent || []).slice(0, 4);
  const discovery = `${homeActionCard('discover', 'Artist Match', 'Start with an artist you love', 'Find the nearest musical neighbours', 'match')}${homeActionCard('lucky', 'I’m Feeling Lucky', 'Surprise me', 'Pick something from the catalogue', 'lucky')}${homeActionCard('vibe', 'Vibes', 'Explore by feel', 'Quick moods or advanced filters', 'vibe')}${homeActionCard('musicfor', 'Mixtapes', 'Choose the moment', 'Playlists, moments & moods', 'musicfor')}`;
  layout(`${hero()}${whatsNewCard()}<section class="section"><div class="eyebrow home-section-label">Discover & explore</div><div class="home-discovery-grid">${discovery}</div></section><section class="section"><div class="eyebrow home-section-label">Your lists</div><div class="home-list-grid">${homeListCard('explore', explore.length, 'Want To Explore', 'Your listening queue', 'explore')}${homeListCard('favourites', favs.length, 'Favourites', 'Your starred artists', 'favourite')}</div></section><section class="section"><div class="eyebrow home-section-label">Our catalogue</div>${homeCatalogueCard(artists.length)}</section><section class="section panel pad home-recent"><div class="eyebrow">Recently viewed</div>${recent.length ? recent.map(x => rowHtml(x.artist, humanAction(x.action))).join('') : '<div class="empty">Your recent artists will appear here.</div>'}</section>`, 'home');
  document.querySelectorAll('[data-open]').forEach(b => b.onclick = () => openArtist(b.dataset.open));
  const whatsNew = document.getElementById('whatsNewPlaylists');
  if (whatsNew) whatsNew.onclick = () => { navigate('musicfor'); setTimeout(() => document.querySelector('[data-occasion-group="ATM Mixtapes"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80); };
  const dismiss = document.getElementById('dismissWhatsNew');
  if (dismiss) dismiss.onclick = () => { state.whatsNewDismissed = APP_VERSION; saveState(); render(); };
}
function humanAction(action) {
  return ({ favourite: 'Added to Favourites', explore: 'Added to Want to Explore', disliked: 'Marked Dislike', discover: 'Used in Artist Match', view: 'Viewed' })[action] || String(action || 'Viewed').replaceAll('_', ' ');
}
function rowHtml(name, detail, matched = '') {
  return `<div class="row"><div class="row-copy"><b>${esc(name)}</b><small>${esc(detail || '')}</small>${matched ? `<small class="matched">${esc(matched)}</small>` : ''}</div><button class="btn icon" data-open="${attr(name)}">Open →</button></div>`;
}

const discoverModes = {
  Similar: { label: 'Closest Match', help: 'Prioritises shared styles, scene, sonic profile and era.' },
  Adjacent: { label: 'Broaden It', help: 'Keeps a clear musical connection but deliberately rewards a little more stylistic distance.' },
  Wildcard: { label: 'Wildcard', help: 'Looks for a plausible sideways connection rather than a near-neighbour.' },
};
function discover() {
  const sel = state.selected ? byName.get(state.selected) : null;
  const disliked = new Set(Object.entries(prefs()).filter(([, p]) => p.disliked).map(([n]) => n));
  const rankedPool = sel ? ATMEngine.recommend(sel, artists, state.mode, 36, disliked) : [];
  const randomMode = state.discoverOrder === 'random';
  const recs = randomMode ? seededShuffle(rankedPool, state.discoverShuffleSeed) : rankedPool;
  const mode = discoverModes[state.mode] || discoverModes.Similar;
  const hasSearchRecent = (state.searchRecent || []).length > 0;
  const resultControls = sel ? `<div class="discovery-order-actions"><button id="discoverRanked" class="btn mode-btn ${randomMode ? '' : 'active'}">${musicModeIcon('ranked')}<span>Ranked</span></button><button id="discoverRandom" class="btn mode-btn ${randomMode ? 'active' : ''}">${musicModeIcon('random')}<span>Randomiser</span></button></div>` : '';
  layout(`<section><div class="eyebrow">Start with an artist</div><h1 class="title">Artist Match</h1><p class="subtitle">Choose an artist you know, then decide how closely ATM should follow their musical neighbourhood.</p><div class="searchbox"><input id="artistSearch" class="field" autocomplete="off" inputmode="search" placeholder="Choose or search for an artist…" value="${sel ? esc(sel.artist) : ''}" aria-label="Choose an artist"><button id="showArtistList" class="search-toggle" type="button" aria-label="Show artist list">⌄</button><div id="suggestions"></div></div>${hasSearchRecent ? '<div class="search-history-actions"><button id="clearArtistSearches" class="btn quiet">Clear recent searches</button></div>' : ''}<div class="seg discover-seg">${Object.entries(discoverModes).map(([key, info]) => `<button data-mode="${key}" class="${state.mode === key ? 'active' : ''}">${esc(info.label)}</button>`).join('')}</div><div class="mode-help"><b>${esc(mode.label)}</b><span>${esc(mode.help)}</span></div></section>${sel ? selectedHead(sel) + `<section class="section"><div class="result-head"><div><div class="eyebrow">Top recommendations</div><h2>${randomMode ? 'Mixed results' : 'Best matches'}</h2><p class="small">${randomMode ? 'Randomiser is reshuffling the wider recommendation pool for this Artist Match mode.' : 'Ranked by ATM’s match score for the selected discovery mode.'}</p></div>${resultControls}</div><div class="cards">${recs.slice(0, 8).map((r, i) => recCard(r, i + 1)).join('')}</div></section>` : '<div class="panel empty section">Choose an artist above, or tap ✦ Lucky.</div>'}`, 'discover');
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
  (state.searchRecent || []).forEach(push);
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
    state.searchRecent = [state.selected, ...(state.searchRecent || []).filter(n => n !== state.selected)].slice(0, 12);
    state.discoverOrder = 'ranked';
    state.discoverShuffleSeed = 0;
    touch(state.selected, 'discover');
    saveState();
    render();
  };
  inp.onfocus = () => showList(false);
  inp.onclick = () => showList(false);
  inp.oninput = () => { userEdited = true; showList(false); };
  toggle.onclick = e => { e.preventDefault(); e.stopPropagation(); inp.focus(); showList(true); };
  document.onclick = e => { if (!e.target.closest('.searchbox')) hideList(); };
  document.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => { state.mode = b.dataset.mode; state.discoverOrder = 'ranked'; state.discoverShuffleSeed = 0; saveState(); render(); });
  const clearSearches = document.getElementById('clearArtistSearches');
  if (clearSearches) clearSearches.onclick = () => { state.searchRecent = []; saveState(); render(); toast('Recent Artist Match searches cleared'); };
  const ranked = document.getElementById('discoverRanked');
  if (ranked) ranked.onclick = () => { state.discoverOrder = 'ranked'; saveState(); render(); setTimeout(() => document.querySelector('.result-head')?.scrollIntoView({ block: 'start' }), 20); };
  const random = document.getElementById('discoverRandom');
  if (random) random.onclick = () => { state.discoverOrder = 'random'; state.discoverShuffleSeed = Date.now(); saveState(); render(); setTimeout(() => document.querySelector('.result-head')?.scrollIntoView({ block: 'start' }), 20); };
  document.querySelectorAll('[data-open]').forEach(b => b.onclick = () => openArtist(b.dataset.open));
  document.querySelectorAll('[data-flag]').forEach(b => b.onclick = () => setFlag(state.selected, b.dataset.flag));
}

function profile() {
  const a = byName.get(state.selected) || artists[0];
  state.selected = a.artist;
  const p = pref(a.artist);
  layout(`<section><div class="eyebrow">Artist profile</div><div class="artist-head"><div>${art(a.artist)}</div><div class="panel artist-info"><div class="eyebrow">${esc(a.primary_genre || '')} · ${esc(a.era || '')}</div><h2>${esc(a.artist)}</h2>${tagsHtml(a, 5)}<div class="meta">${esc(a.mood || '')}<br>${esc(a.atmosphere || '')}</div>${links(a.artist)}</div></div><div class="state-row sticky-actions"><button class="btn ${p.favourite ? 'gold' : ''}" data-flag="favourite">${p.favourite ? '★ Favourite' : '☆ Favourite'}</button><button class="btn" data-flag="explore">${p.explore ? '✓ Want to Explore' : '+ Want to Explore'}</button><button class="btn" data-flag="disliked">${p.disliked ? '✕ Disliked' : '− Dislike'}</button></div></section><section class="section panel profile-panel"><div class="eyebrow">Sonic profile</div>${meters(a)}${a.similar_to ? `<p class="small"><b>Related:</b> ${esc(a.similar_to)}</p>` : ''}${a.notes ? `<p class="small">${esc(a.notes)}</p>` : ''}</section><section class="section panel profile-panel"><div class="eyebrow">Personal note</div><textarea id="note" class="note" placeholder="Optional note…">${esc(p.note || '')}</textarea><button id="saveNote" class="btn" style="margin-top:8px">Save note</button></section><section class="section"><button class="btn primary" id="similarFromProfile">Find matches from ${esc(a.artist)} →</button></section>`, '');
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
const vibePresets = [
  { label: 'Dreamy', blurb: 'Soft-focus, immersive and a little weightless.', target: { energy: 4, aggression: 1, darkness: 4, experimental: 6 }, words: ['dreamy', 'ethereal', 'shoegaze', 'dream pop', 'ambient'] },
  { label: 'Warm & Soulful', blurb: 'Human, rich and built around warmth or groove.', target: { energy: 5, aggression: 1, darkness: 2, rhythm: 7, accessibility: 7 }, words: ['warm', 'soulful', 'soul', 'funk', 'r&b'] },
  { label: 'Dark & Brooding', blurb: 'Shadowy, tense and deliberately moody.', target: { energy: 5, aggression: 5, darkness: 9 }, words: ['brooding', 'dark', 'gothic', 'ominous', 'industrial'] },
  { label: 'Euphoric', blurb: 'Big lift, forward motion and emotional release.', target: { energy: 8, darkness: 2, rhythm: 8, accessibility: 8 }, words: ['euphoric', 'uplifting', 'trance', 'house', 'dance'] },
  { label: 'Nocturnal', blurb: 'Late-night, hypnotic and slightly mysterious.', target: { energy: 5, darkness: 7, organic_electronic: 8 }, words: ['nocturnal', 'hypnotic', 'ambient', 'trip hop', 'downtempo'] },
  { label: 'Heavy', blurb: 'Dense, forceful and physically intense.', target: { energy: 8, aggression: 9, darkness: 8 }, words: ['metal', 'hardcore', 'sludge', 'doom', 'heavy'] },
  { label: 'Bright & Playful', blurb: 'Colourful, immediate and difficult to sulk to.', target: { energy: 7, aggression: 2, darkness: 1, accessibility: 8 }, words: ['playful', 'bright', 'indie pop', 'pop', 'funk'] },
  { label: 'Rhythmic & Groovy', blurb: 'Movement first: percussion, bass and pocket.', target: { energy: 7, rhythm: 10, accessibility: 7 }, words: ['funk', 'afrobeat', 'dance', 'house', 'disco', 'groove'] },
  { label: 'Strange & Experimental', blurb: 'For when familiar structures are not the point.', target: { experimental: 10, accessibility: 4, darkness: 5 }, words: ['experimental', 'avant-garde', 'noise', 'idm', 'free jazz'] },
  { label: 'Acoustic & Intimate', blurb: 'Close-up, organic and relatively unvarnished.', target: { energy: 3, aggression: 1, organic_electronic: 2, accessibility: 7 }, words: ['acoustic', 'intimate', 'folk', 'singer-songwriter', 'gentle'] },
];

function profilePresetScore(a, preset) {
  const haystack = `${a.primary_genre || ''} ${a.style_tags || ''} ${a.mood || ''} ${a.atmosphere || ''}`.toLowerCase();
  let score = 0, weight = 0;
  Object.entries(preset.target || {}).forEach(([key, wanted]) => {
    const actual = Number(a[key] || 0);
    score += Math.max(0, 1 - Math.abs(actual - wanted) / 9) * 2;
    weight += 2;
  });
  const wordHits = (preset.words || []).filter(word => haystack.includes(word.toLowerCase())).length;
  if (preset.words?.length) { score += Math.min(1, wordHits / 2) * 3; weight += 3; }
  if (preset.genres?.length) { score += ((preset.genres || []).includes(a.primary_genre) ? 3 : 0); weight += 3; }
  return Math.max(0, Math.min(1, score / Math.max(1, weight)));
}
function presetReason(a, preset) {
  const haystack = `${a.primary_genre || ''} ${a.style_tags || ''} ${a.mood || ''} ${a.atmosphere || ''}`.toLowerCase();
  const parts = [];
  (preset.words || []).filter(word => haystack.includes(word.toLowerCase())).slice(0, 2).forEach(word => parts.push(word.replace(/\b\w/g, c => c.toUpperCase())));
  const actual = key => Number(a[key] || 0);
  if ((preset.target?.rhythm || 0) >= 8 && actual('rhythm') >= 7) parts.push('Strong rhythm');
  else if ((preset.target?.energy || 0) >= 8 && actual('energy') >= 7) parts.push('High energy');
  else if ((preset.target?.darkness || 0) >= 7 && actual('darkness') >= 7) parts.push('Darker tone');
  else if ((preset.target?.experimental || 0) >= 7 && actual('experimental') >= 7) parts.push('Adventurous');
  else if ((preset.target?.organic_electronic || 0) >= 7 && actual('organic_electronic') >= 7) parts.push('Electronic lean');
  else if ((preset.target?.organic_electronic ?? 10) <= 3 && actual('organic_electronic') <= 3) parts.push('Organic feel');
  return parts.length ? parts.slice(0, 3).join(' · ') : `Close to the ${preset.label.toLowerCase()} sonic profile`;
}
function quickVibeResults(preset) {
  const disliked = new Set(Object.entries(prefs()).filter(([, p]) => p.disliked).map(([name]) => name));
  return artists.filter(a => !disliked.has(a.artist)).map(a => ({ a, score: profilePresetScore(a, preset) }))
    .filter(row => row.score >= .54).sort((x, y) => y.score - x.score || x.a.artist.localeCompare(y.a.artist)).slice(0, 36);
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
  const rows = artists.filter(a => !disliked.has(a.artist)).map(vibeArtistMatch).filter(Boolean);
  rows.sort((x, y) => y.score - x.score || x.a.artist.localeCompare(y.a.artist));
  return rows;
}
function vibe() {
  const baseResults = state.vibeApplied ? currentVibeResults() : [];
  const selectedPreset = vibePresets.find(p => p.label === state.vibePreset);
  const quickBase = selectedPreset ? quickVibeResults(selectedPreset) : [];
  const randomMode = state.vibeOrder === 'random';
  const quickRows = randomMode ? seededShuffle(quickBase, state.vibeShuffleSeed) : quickBase;
  const results = randomMode ? seededShuffle(baseResults, state.vibeShuffleSeed) : baseResults;
  const vibeControls = rows => `<div class="vibe-result-actions"><button data-vibe-order="ranked" class="btn mode-btn ${randomMode ? '' : 'active'}">${musicModeIcon('ranked')}<span>Ranked</span></button><button data-vibe-order="random" class="btn mode-btn ${randomMode ? 'active' : ''}">${musicModeIcon('random')}<span>Randomiser</span></button><button class="btn vibe-pick-one" ${rows.length ? '' : 'disabled'}>✦ Pick one</button></div>`;
  const quickChoices = `<section class="section"><div class="eyebrow">Quick vibes</div><h2>Pick a character</h2><p class="small">The quickest route when you know the feel you want but not the artist.</p><div class="occasion-grid quick-vibes">${vibePresets.map(p => `<button class="occasion-card ${state.vibePreset === p.label ? 'active' : ''}" data-quick-vibe="${attr(p.label)}"><b>${esc(p.label)}</b><span>${esc(p.blurb)}</span></button>`).join('')}</div></section>`;
  const quickResults = selectedPreset ? `<section class="section quick-vibe-results"><div class="result-head"><div><div class="eyebrow">Quick vibe</div><h2>${esc(selectedPreset.label)}</h2><p class="small">${esc(selectedPreset.blurb)} ${randomMode ? 'Randomiser is mixing the qualifying artists.' : 'Ranked by how closely each artist fits this vibe.'}</p></div>${vibeControls(quickRows)}</div><div class="cards">${quickRows.slice(0, 18).map((row, i) => recCard({ artist: row.a, score: row.score, why: presetReason(row.a, selectedPreset) }, i + 1)).join('')}</div></section>` : '';
  const advancedOpen = state.vibeApplied || vibeSelectedCount() > 0;
  const resultHtml = state.vibeApplied ? `<section class="section vibe-filter-results"><div class="result-head"><div><div class="eyebrow">Advanced filter results</div><h2>${results.length} artist${results.length === 1 ? '' : 's'}</h2><p class="small">${randomMode ? 'Randomiser is mixing the matching artists.' : 'Ranked by the strength of the selected genre, style and mood matches.'}</p></div>${vibeControls(results)}</div><div class="panel pad vibe-results">${results.length ? results.map(r => rowHtml(r.a.artist, r.a.primary_genre, `Matched: ${r.matched.join(' · ')}`)).join('') : '<div class="empty">No artists match that combination. Try Match any, or remove one filter.</div>'}</div></section>` : '';
  const advanced = `<details class="section advanced-vibe panel" ${advancedOpen ? 'open' : ''}><summary><span><b>Advanced: Build your own vibe</b><small>Combine genres, styles and moods for tighter control.</small></span><i>⌄</i></summary><div class="advanced-vibe-body"><div id="vibeChips" class="filter-chips">${vibeChips()}</div><div class="match-toggle"><span>Matching</span><button data-vibe-match="all" class="${state.vibeMatch === 'all' ? 'active' : ''}">Match all</button><button data-vibe-match="any" class="${state.vibeMatch === 'any' ? 'active' : ''}">Match any</button></div><p class="small">With Match all, multiple primary genres are alternatives; all selected styles and moods must match.</p><div class="filter-stack"><details open class="filter-panel"><summary>Genres <span>${state.vibe.genres.length || ''}</span></summary><div id="genreOptions" class="check-list genres">${filterList('genres').html}</div></details><details class="filter-panel"><summary>Sub-genres & styles <span>${state.vibe.styles.length || ''}</span></summary><div class="filter-search"><input id="styleFilterSearch" class="field" placeholder="Find a sub-genre or style…"></div><div id="styleOptions" class="check-list">${filterList('styles').html}</div><div id="styleCount" class="filter-count">Showing the most common styles. Search to reach the full list.</div></details><details class="filter-panel"><summary>Moods <span>${state.vibe.moods.length || ''}</span></summary><div class="filter-search"><input id="moodFilterSearch" class="field" placeholder="Find a mood…"></div><div id="moodOptions" class="check-list">${filterList('moods').html}</div><div id="moodCount" class="filter-count">Showing the most common moods. Search to reach the full list.</div></details></div><div class="vibe-actions"><button id="clearVibe" class="btn">Clear filters</button><button id="showVibeResults" class="btn primary">Show artists${vibeSelectedCount() ? ` (${vibeSelectedCount()} filters)` : ''}</button></div></div></details>`;
  layout(`<section><div class="eyebrow">Feel first, genre second</div><h1 class="title">Vibes</h1><p class="subtitle">Start with a ready-made vibe. Open the advanced builder only when you want precise control.</p></section>${quickChoices}${quickResults}${advanced}${resultHtml}`, 'vibe');
  bindVibe();
  document.querySelectorAll('[data-quick-vibe]').forEach(button => button.onclick = () => { state.vibePreset = button.dataset.quickVibe; state.vibeOrder = 'ranked'; state.vibeShuffleSeed = 0; saveState(); render(); setTimeout(() => document.querySelector('.quick-vibe-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50); });
  document.querySelectorAll('[data-vibe-order]').forEach(button => button.onclick = () => { state.vibeOrder = button.dataset.vibeOrder; if (state.vibeOrder === 'random') state.vibeShuffleSeed = Date.now(); saveState(); render(); });
  document.querySelectorAll('.vibe-pick-one').forEach(button => button.onclick = () => { const rows = selectedPreset && button.closest('.quick-vibe-results') ? quickRows : results; if (rows.length) openArtist(rows[Math.floor(Math.random() * Math.min(18, rows.length))].a.artist); });
  document.querySelectorAll('[data-open]').forEach(button => button.onclick = () => openArtist(button.dataset.open));
}
function bindVibe() {
  function bindChecks(container) {
    container.querySelectorAll('input[data-vibe-type]').forEach(box => box.onchange = () => setVibeValue(box.dataset.vibeType, box.value, box.checked));
  }
  document.querySelectorAll('.check-list').forEach(bindChecks);
  document.querySelectorAll('[data-vibe-match]').forEach(b => b.onclick = () => { state.vibeMatch = b.dataset.vibeMatch; state.vibeApplied = false; state.vibeOrder = 'ranked'; state.vibeShuffleSeed = 0; saveState(); render(); });
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
  document.getElementById('clearVibe').onclick = () => { state.vibe = { genres: [], styles: [], moods: [] }; state.vibeApplied = false; state.vibeOrder = 'ranked'; state.vibeShuffleSeed = 0; saveState(); render(); };
  document.getElementById('showVibeResults').onclick = () => { if (!vibeSelectedCount()) return toast('Choose at least one filter'); state.vibeApplied = true; state.vibeOrder = 'ranked'; state.vibeShuffleSeed = 0; saveState(); render(); setTimeout(() => document.querySelector('.result-head')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50); };
  const sort = document.getElementById('vibeSort');
  if (sort) sort.onchange = () => { state.vibeSort = sort.value; saveState(); render(); };
  const surprise = document.getElementById('vibeSurprise');
  if (surprise) surprise.onclick = () => { const rows = currentVibeResults(); if (rows.length) openArtist(rows[Math.floor(Math.random() * rows.length)].a.artist); };
  document.querySelectorAll('[data-open]').forEach(b => b.onclick = () => openArtist(b.dataset.open));
}

const musicForPresets = [
  { group: 'Road Trips', label: 'Road Trip - Pedal 2 Metal', blurb: 'Riffs, momentum and heavy music built for putting your foot down.', target: { energy: 9, aggression: 8, rhythm: 8, accessibility: 6, organic_electronic: 2 }, genres: ['Metal', 'Punk / Hardcore', 'Rock'], words: ['metal', 'hard rock', 'stoner', 'sludge', 'thrash', 'metalcore', 'hardcore', 'heavy'], youtubePlaylist: 'https://music.youtube.com/playlist?list=PLLkAt2DI2kVw', spotifyPlaylist: 'https://open.spotify.com/playlist/56TA7U2nWrRgYMCGlAQwRo', strictGenre: true },
  { group: 'Road Trips', label: 'Road Trip - Rockit', blurb: 'Big guitars, bigger choruses and windows-down alternative rock.', target: { energy: 8, aggression: 5, rhythm: 7, accessibility: 8, organic_electronic: 2 }, genres: ['Rock', 'Punk / Hardcore'], words: ['alternative rock', 'indie rock', 'pop punk', 'garage rock', 'punk rock', 'anthemic', 'power pop'], youtubePlaylist: 'https://music.youtube.com/playlist?list=PLSYdNaeoRqdc', spotifyPlaylist: 'https://open.spotify.com/playlist/7AWp2AQB3AM9QxPU87jEpj', strictGenre: true },
  { group: 'Road Trips', label: 'Road Trip - Rap It Up', blurb: 'Hip-hop with bounce, hooks and enough momentum for the motorway.', target: { energy: 8, aggression: 6, rhythm: 10, accessibility: 8, organic_electronic: 8 }, genres: ['Hip-Hop'], words: ['hip-hop', 'rap', 'trap', 'grime', 'boom bap', 'swagger', 'confident'], youtubePlaylist: 'https://music.youtube.com/playlist?list=PLQkmz0A_D3vs', spotifyPlaylist: 'https://open.spotify.com/playlist/2I2WflpFiNKb1GnJFcxj2q', strictGenre: true },
  { group: 'Road Trips', label: 'Road Trip - Pop The Hood', blurb: 'Shamelessly good car-pop: hooks, synths and huge singalong choruses.', target: { energy: 8, aggression: 2, rhythm: 9, accessibility: 10, organic_electronic: 8 }, genres: ['Pop'], words: ['dance-pop', 'synth-pop', 'electropop', 'disco', 'euphoric', 'glossy', 'bright'], youtubePlaylist: 'https://music.youtube.com/playlist?list=PLd2wUgoxqepw', spotifyPlaylist: 'https://open.spotify.com/playlist/2imvJqTfKqFEIkgvFdvNdV', strictGenre: true },
  { group: 'Road Trips', label: 'Road Trip - Cruise Control', blurb: 'Chilled electronic, indie, soul and psych for when nobody is in a hurry.', target: { energy: 4, aggression: 1, darkness: 3, rhythm: 6, accessibility: 8 }, genres: ['Electronic', 'Rock', 'Soul / R&B / Funk', 'Jazz'], words: ['downtempo', 'chill', 'mellow', 'laid-back', 'warm', 'smooth', 'dream', 'neo-soul'], youtubePlaylist: 'https://music.youtube.com/playlist?list=PLDpbud8fw_8w', spotifyPlaylist: 'https://open.spotify.com/playlist/3gx3YBqaDu5gCR136YAKCb', strictGenre: true },
  { group: 'Road Trips', label: 'Road Trip - Sunset Strip', blurb: 'Yacht rock, funk, soul, disco and city pop for driving into golden hour.', target: { energy: 6, aggression: 1, darkness: 2, rhythm: 8, accessibility: 9 }, genres: ['Rock', 'Pop', 'Soul / R&B / Funk', 'Jazz', 'Electronic'], words: ['yacht rock', 'soft rock', 'funk', 'soul', 'disco', 'boogie', 'city pop', 'sunny', 'warm'], youtubePlaylist: 'https://music.youtube.com/playlist?list=PLffEB_IYbSYs', spotifyPlaylist: 'https://open.spotify.com/playlist/1gHdFW5cDdxQ2JhezJOszm', strictGenre: true },
  { group: 'Road Trips', label: 'Road Trip - Country Miles', blurb: 'Country, Americana and heartland music for long roads and big skies.', target: { energy: 6, aggression: 2, darkness: 3, rhythm: 6, accessibility: 8, organic_electronic: 1 }, genres: ['Folk / Singer-Songwriter / Country'], words: ['country', 'americana', 'alt-country', 'heartland', 'rootsy', 'narrative'], youtubePlaylist: 'https://music.youtube.com/playlist?list=PLDtOKzgd2xk0', spotifyPlaylist: 'https://open.spotify.com/playlist/4R2xeKEnKWeCd2gNce8Vup', strictGenre: true },
  { group: 'Road Trips', label: 'Road Trip - Autobahn', blurb: 'Motorik, electro, house, techno and synthwave with relentless forward motion.', target: { energy: 8, aggression: 3, darkness: 5, experimental: 6, rhythm: 10, organic_electronic: 10 }, genres: ['Electronic'], words: ['techno', 'house', 'synthwave', 'electro', 'motorik', 'club', 'synth', 'driving'], youtubePlaylist: 'https://music.youtube.com/playlist?list=PLdS146orVil0', spotifyPlaylist: 'https://open.spotify.com/playlist/0lMfGFrOi5g6qLo5kz1338', strictGenre: true },
  { group: 'Road Trips', label: 'Road Trip - Scenic Route', blurb: 'Post-rock, ambient, dream-pop and spacious music for when the view matters.', target: { energy: 3, aggression: 1, darkness: 5, experimental: 7, accessibility: 5, organic_electronic: 6 }, genres: ['Rock', 'Electronic', 'Experimental / Avant-Garde', 'Pop', 'Folk / Singer-Songwriter / Country'], words: ['post-rock', 'ambient', 'dream pop', 'instrumental', 'spacious', 'cinematic', 'atmospheric', 'serene'], youtubePlaylist: 'https://music.youtube.com/playlist?list=PLRs0ZaL3902w', spotifyPlaylist: 'https://open.spotify.com/playlist/2J0mRVPdZynsnwFUPmp9vd', strictGenre: true },
  { group: 'Road Trips', label: 'Road Trip - Backseat Karaoke', blurb: 'Maximum chorus, minimum dignity: huge songs for everyone in the car.', target: { energy: 8, aggression: 3, darkness: 2, rhythm: 8, accessibility: 10 }, genres: ['Pop', 'Rock'], words: ['anthemic', 'pop rock', 'power pop', 'dance-pop', 'arena rock', 'euphoric', 'bright'], youtubePlaylist: 'https://music.youtube.com/playlist?list=PLagjKdkQgc2o', spotifyPlaylist: 'https://open.spotify.com/playlist/2J8Ze7Cu7lsF0w74J70q0d', strictGenre: true },
  { group: 'Road Trips', label: 'Road Trip - Nu Car', blurb: 'Nu-metal, rap-metal and Y2K heaviness. Baggy jeans optional.', target: { energy: 9, aggression: 8, darkness: 7, rhythm: 8, accessibility: 7, organic_electronic: 4 }, genres: ['Metal', 'Rock', 'Punk / Hardcore'], words: ['nu metal', 'rap rock', 'rap metal', 'alternative metal', 'industrial metal', 'post-grunge'], youtubePlaylist: 'https://music.youtube.com/playlist?list=PLIgiHYGP_yGY', spotifyPlaylist: 'https://open.spotify.com/playlist/5XRJIpl2BBbQHwibT26T6R', strictGenre: true },
  { group: 'ATM Playlists', label: 'Head Nodding', blurb: 'Alternative rap, classic hip-hop and left-field beats for settling into the pocket.', target: { energy: 7, aggression: 5, darkness: 5, experimental: 6, rhythm: 9, accessibility: 7, organic_electronic: 7 }, genres: ['Hip-Hop'], words: ['alternative hip-hop', 'boom bap', 'hip-hop', 'rap', 'experimental hip-hop', 'conscious', 'east coast'], youtubePlaylist: 'https://music.youtube.com/playlist?list=PLFeNQCJ3V_14', spotifyPlaylist: 'https://open.spotify.com/playlist/1tNisakRNR3qLxJ5MpojNF', strictGenre: true },
  { group: 'ATM Playlists', label: 'Pop Rocks', blurb: 'Pop-rock throwbacks with big hooks, bright guitars and an 80s-to-early-2000s streak.', target: { energy: 7, aggression: 4, darkness: 3, rhythm: 7, accessibility: 9, organic_electronic: 3 }, genres: ['Rock', 'Pop'], words: ['pop rock', 'power pop', 'alternative rock', 'new wave', 'britpop', 'pop punk', 'arena rock'], youtubePlaylist: 'https://music.youtube.com/playlist?list=PLb968UxgeDzU', spotifyPlaylist: 'https://open.spotify.com/playlist/4GVd8XkKRF6kVAnMvZodvJ', strictGenre: true },
  { group: 'ATM Playlists', label: 'Air Guitar', blurb: 'Riffs, solos and guitar-heavy rock built for playing along without an instrument.', target: { energy: 8, aggression: 6, darkness: 4, rhythm: 7, accessibility: 7, organic_electronic: 2 }, genres: ['Rock', 'Metal', 'Punk / Hardcore'], words: ['hard rock', 'classic rock', 'alternative rock', 'heavy metal', 'guitar', 'riff', 'arena rock', 'grunge'], youtubePlaylist: 'https://music.youtube.com/playlist?list=PLPDABf3UHXhA', spotifyPlaylist: 'https://open.spotify.com/playlist/2HV2nOpWIISYgNTsRWsurE', strictGenre: true },
  { group: 'ATM Playlists', label: 'Euroshock', blurb: 'European electro with French-touch swagger, distorted synths and a darker club pulse.', target: { energy: 8, aggression: 4, darkness: 5, experimental: 6, rhythm: 9, organic_electronic: 10, accessibility: 7 }, genres: ['Electronic'], words: ['french house', 'electro', 'electro house', 'electroclash', 'techno', 'synthwave', 'dance-rock'], youtubePlaylist: 'https://music.youtube.com/playlist?list=PLWMTSBOaoqq8', spotifyPlaylist: 'https://open.spotify.com/playlist/1aNGGUmsVqA9852SCmxFsN', strictGenre: true, fingerprint: { target: { energy: 8, aggression: 4, darkness: 5, experimental: 6, rhythm: 9, organic_electronic: 10 }, genres: ['Electronic'], families: ['french_house', 'electro_house', 'electro', 'techno_house', 'synthwave', 'industrial', 'disco_house'], words: ['french house', 'french electro', 'electro house', 'electroclash', 'electro-techno', 'dance-rock', 'synthwave', 'industrial dance'], avoidWords: ['dubstep', 'brostep', 'trap', 'future bass', 'big room'], avoidFamilies: ['dubstep', 'trap', 'dnb_jungle'], anchors: ['Cassius', 'Étienne de Crécy', 'Daft Punk', 'Mr. Oizo', 'Justice', 'SebastiAn', 'Kavinsky', 'Vitalic', 'Boys Noize', 'Digitalism', 'Soulwax', 'Simian Mobile Disco', 'The Bloody Beetroots', 'Para One', 'Surkin', 'Danger', 'Zombie Nation', 'Alter Ego', 'Rex the Dog', 'Miss Kittin & The Hacker', 'Gesaffelstein', 'The Hacker', 'DJ Hell', 'Ellen Allien', 'Modeselektor', 'Anthony Rother', 'I-F', 'Legowelt', 'LFO', 'Laurent Garnier', 'Underworld', 'Orbital', 'Trentemøller', 'Röyksopp', 'The Knife', 'Breakbot'] } },
  { group: 'ATM Playlists', label: 'Soft Focus', blurb: 'Hazy dream pop, bedroom pop and softly psychedelic indie centred on the feel of Her’s.', target: { energy: 4, aggression: 1, darkness: 4, experimental: 6, rhythm: 5, organic_electronic: 5, accessibility: 7 }, genres: ['Pop', 'Rock', 'Electronic'], words: ['dream pop', 'bedroom pop', 'shoegaze', 'indie pop', 'jangle pop', 'slowcore', 'hazy', 'dreamy'], youtubePlaylist: 'https://music.youtube.com/playlist?list=PLZ6-6i8ZNK8Y', spotifyPlaylist: 'https://open.spotify.com/playlist/0qLpLSFSvs42lxz5dqNOxp', fingerprint: { target: { energy: 4, aggression: 1, darkness: 4, experimental: 6, rhythm: 5, accessibility: 7 }, genres: ['Pop', 'Rock', 'Electronic'], families: ['dream_shoegaze', 'bedroom_pop', 'indiepop', 'psychedelic', 'slowcore', 'jangle_pop'], words: ['dream pop', 'bedroom pop', 'shoegaze', 'indie pop', 'jangle pop', 'slowcore', 'neo-psychedelia', 'hazy', 'ethereal', 'soft-focus'], anchors: ['Her’s', "Her's", 'Men I Trust', 'No Vacation', 'Crumb', 'Mild High Club', 'Mac DeMarco', 'TOPS', 'The Marías', 'Strawberry Guy', 'Molly Burch', 'Alvvays', 'Fazerdaze', 'Wild Nothing', 'Craft Spells', 'Real Estate', 'Beach Fossils', 'Widowspeak', 'Still Corners', 'Beach House', 'Cigarettes After Sex', 'Mazzy Star', 'Slowdive', 'DIIV', 'Lush', 'Cocteau Twins', 'The Sundays', 'The Radio Dept.', 'Melody’s Echo Chamber', "Melody's Echo Chamber", 'Broadcast', 'Sweet Trip', 'Drug Store Romeos', 'Japanese Breakfast', 'Yumi Zouma', 'Kero Kero Bonito', 'Air', 'Julee Cruise'] } },
  { group: 'ATM Playlists', label: 'Aotearoa Calling', blurb: 'An ATM-curated trip through music from Aotearoa New Zealand, across eras and styles.', youtubePlaylist: 'https://music.youtube.com/playlist?list=PLFTCcEuVOWik', spotifyPlaylist: 'https://open.spotify.com/playlist/7BXylCipqY8eoimCvPAJbD', playlistOnly: true },
  { group: 'Time & place', label: 'Rainy Days', blurb: 'Reflective, textured and a little grey around the edges.', target: { energy: 4, darkness: 6, accessibility: 6 }, words: ['reflective', 'melancholic', 'atmospheric', 'dream', 'intimate'], youtubePlaylist: 'https://music.youtube.com/playlist?list=PLXIBtIFPFEkw', spotifyPlaylist: 'https://open.spotify.com/playlist/0jlP53sNEcvLtI2ISicFFG' },
  { group: 'Time & place', label: 'Sunday Morning', blurb: 'Warm, unhurried listening for a slower start.', target: { energy: 3, aggression: 1, darkness: 3, accessibility: 7 }, words: ['warm', 'gentle', 'serene', 'laid-back', 'soul', 'folk'], youtubePlaylist: 'https://music.youtube.com/playlist?list=PLH1M4H7OxG-U', spotifyPlaylist: 'https://open.spotify.com/playlist/0PIPElihWPa8jQgHNjny7m' },
  { group: 'Time & place', label: '3AM', blurb: 'Nocturnal, inward-looking and slightly strange.', target: { energy: 4, darkness: 8, experimental: 7 }, words: ['nocturnal', 'hypnotic', 'ambient', 'dream', 'introspective'], youtubePlaylist: 'https://music.youtube.com/playlist?list=PLfBhUHe4j7uM', spotifyPlaylist: 'https://open.spotify.com/playlist/2x0TavgHYPezi8ct1ckqJG' },
  { group: 'Time & place', label: 'Drifting Off', blurb: 'Very quiet, soft-edged ambient music for letting the day disappear.', target: { energy: 1, aggression: 1, darkness: 3, experimental: 6, rhythm: 2, organic_electronic: 9 }, genres: ['Electronic'], words: ['ambient', 'drone', 'minimal', 'serene', 'meditative', 'gentle', 'quiet'], youtubePlaylist: 'https://music.youtube.com/playlist?list=PLU1EIlMLfFoU', spotifyPlaylist: 'https://open.spotify.com/playlist/5jIWeJI5Ip5vWFqP8vkxvd' },
  { group: 'Time & place', label: 'Sunset', blurb: 'Glowing, spacious music for the end of the day.', target: { energy: 5, darkness: 3, accessibility: 7 }, words: ['warm', 'dreamy', 'serene', 'lush', 'psychedelic'], youtubePlaylist: 'https://music.youtube.com/playlist?list=PLNRDgrhWkjWM', spotifyPlaylist: 'https://open.spotify.com/playlist/4Vxa1uppKCtBUeuaOXR2x5' },
  { group: 'Time & place', label: 'Night Driving', blurb: 'Propulsive, cinematic and built for lights passing by.', target: { energy: 7, darkness: 6, rhythm: 8, organic_electronic: 8 }, words: ['nocturnal', 'driving', 'synth', 'electronic', 'cinematic'], youtubePlaylist: 'https://music.youtube.com/playlist?list=PLMUTDGCHNHc0', spotifyPlaylist: 'https://open.spotify.com/playlist/5b433sEfE631EDBaUcmX75' },
  { group: 'Going out', label: 'Going Out', blurb: 'Confident, bright and steadily raising the temperature.', target: { energy: 8, rhythm: 8, accessibility: 8 }, words: ['confident', 'euphoric', 'dance', 'pop', 'funk'], youtubePlaylist: 'https://music.youtube.com/playlist?list=PLGY6Thj4wXms', spotifyPlaylist: 'https://open.spotify.com/playlist/1VBk3tROqwzFbuGd1yycOr' },
  { group: 'Going out', label: 'After the Party', blurb: 'The comedown: hazy, tender and quietly nocturnal.', target: { energy: 3, darkness: 6, accessibility: 6 }, words: ['hazy', 'intimate', 'melancholic', 'nocturnal', 'ambient'], youtubePlaylist: 'https://music.youtube.com/playlist?list=PLamfhN9vN29Q', spotifyPlaylist: 'https://open.spotify.com/playlist/3ZB7JWgZ06Z7AoFhtktVJc' },
  { group: 'Time & place', label: 'First Coffee', blurb: 'A gentle lift before the day properly begins.', target: { energy: 5, aggression: 1, darkness: 2, accessibility: 8 }, words: ['warm', 'playful', 'soulful', 'bright', 'acoustic'], youtubePlaylist: 'https://music.youtube.com/playlist?list=PLJ81m9FfymXI', spotifyPlaylist: 'https://open.spotify.com/playlist/43GUo3NuEkjz0wEGMlDAI5' },
  { group: 'Heart stuff', label: 'Heartbreak', blurb: 'Songs for the raw bit, the reflective bit and everything after.', target: { energy: 4, darkness: 7, accessibility: 8 }, words: ['heartbreak', 'melancholic', 'romantic', 'vulnerable', 'sad'], youtubePlaylist: 'https://music.youtube.com/playlist?list=PLXTamMNqlNmg', spotifyPlaylist: 'https://open.spotify.com/playlist/3dP40tDl9y2qMTttceygLE' },
  { group: 'Heart stuff', label: 'Falling in Love', blurb: 'Warm, open-hearted and a little bit giddy.', target: { energy: 6, darkness: 2, accessibility: 8 }, words: ['romantic', 'joyful', 'warm', 'dreamy', 'euphoric'], youtubePlaylist: 'https://music.youtube.com/playlist?list=PLVmAQ-_0-4ss', spotifyPlaylist: 'https://open.spotify.com/playlist/3g0S4GpE0RgZpkcSXUVvNI' },
  { group: 'Heart stuff', label: '"Bedtime" 😉', blurb: 'Low-lit, intimate and decidedly not about going straight to sleep.', target: { energy: 4, aggression: 1, darkness: 5, rhythm: 6, accessibility: 8 }, words: ['sensual', 'sultry', 'intimate', 'romantic', 'r&b', 'neo-soul', 'trip hop', 'downtempo'], youtubePlaylist: 'https://music.youtube.com/playlist?list=PLdK4ir7TI1-E', spotifyPlaylist: 'https://open.spotify.com/playlist/2BTHOrlVO5IBTLSabjfBrO' },
  { group: 'Heart stuff', label: 'Moping', blurb: 'Low-energy company for leaning into it.', target: { energy: 2, darkness: 7, accessibility: 7 }, words: ['melancholic', 'sad', 'intimate', 'reflective', 'slow'], youtubePlaylist: 'https://music.youtube.com/playlist?list=PLdAlAvVNzOPs', spotifyPlaylist: 'https://open.spotify.com/playlist/51Ru63cQEuN6uErS2iKHWD' },
  { group: 'Heart stuff', label: 'Brooding', blurb: 'Dark, tense and deliberate rather than defeated.', target: { energy: 5, aggression: 5, darkness: 9 }, words: ['brooding', 'dark', 'ominous', 'tense', 'gothic'], youtubePlaylist: 'https://music.youtube.com/playlist?list=PLcHkTY80cb6Y', spotifyPlaylist: 'https://open.spotify.com/playlist/2GeU36D63Nc5Lv7Gtkey9h' },
  { group: 'Change the energy', label: 'Wake Up', blurb: 'Immediate, bright and hard to sleep through.', target: { energy: 9, rhythm: 8, accessibility: 8 }, words: ['energetic', 'urgent', 'bright', 'punk', 'dance'], youtubePlaylist: 'https://music.youtube.com/playlist?list=PLLYqMET6grw0', spotifyPlaylist: 'https://open.spotify.com/playlist/2R4BfI4Cm1jCTiLjQf3MTQ' },
  { group: 'Change the energy', label: 'Calm Down', blurb: 'Soft edges, low intensity and room to breathe.', target: { energy: 2, aggression: 1, darkness: 3 }, words: ['calm', 'serene', 'ambient', 'gentle', 'minimal'], youtubePlaylist: 'https://music.youtube.com/playlist?list=PLb_wPPgL3O6M', spotifyPlaylist: 'https://open.spotify.com/playlist/24PlChrzkAXye37T6pp1bT' },
  { group: 'Change the energy', label: 'Get Hyped', blurb: 'Big energy, momentum and zero interest in subtlety.', target: { energy: 10, aggression: 8, rhythm: 9 }, words: ['hype', 'intense', 'triumphant', 'rap', 'metal'], youtubePlaylist: 'https://music.youtube.com/playlist?list=PLftVXCtkJKmw', spotifyPlaylist: 'https://open.spotify.com/playlist/6GlldHLXteTEiBKx3pTO5k' },
  { group: 'Dancing', label: 'Dancing… In The Pit', blurb: 'Heavy, physical and built for the part where standing still is no longer an option.', target: { energy: 10, aggression: 10, darkness: 7, rhythm: 9, accessibility: 6, organic_electronic: 2 }, genres: ['Punk / Hardcore', 'Metal', 'Rock'], words: ['hardcore', 'metalcore', 'post-hardcore', 'crossover thrash', 'nu metal', 'mosh', 'breakdown', 'heavy', 'aggressive'], youtubePlaylist: 'https://music.youtube.com/playlist?list=PLectVW8n-XR0', spotifyPlaylist: 'https://open.spotify.com/playlist/132GxRl7lrvqgGnFeubZed', strictGenre: true },
  { group: 'Dancing', label: 'Dancing… to Pop', blurb: 'Hooks first: glossy, immediate and properly danceable.', target: { energy: 8, rhythm: 9, accessibility: 9 }, genres: ['Pop'], words: ['dance-pop', 'electropop', 'synthpop', 'disco'], youtubePlaylist: 'https://music.youtube.com/playlist?list=PLFYfnyjPL6ZI', spotifyPlaylist: 'https://open.spotify.com/playlist/1iB2W0wICxf9IP9Zu9WEIG' },
  { group: 'Dancing', label: 'Dancing… to Disco', blurb: 'Four-on-the-floor sparkle, sweeping strings, boogie and Hi-NRG release.', target: { energy: 8, aggression: 1, darkness: 2, rhythm: 10, organic_electronic: 7, accessibility: 9 }, genres: ['Soul / R&B / Funk', 'Electronic', 'Pop'], words: ['disco', 'hi-nrg', 'boogie', 'post-disco', 'nu-disco', 'italo disco'], youtubePlaylist: 'https://music.youtube.com/playlist?list=PLMTFvv41QcvM', spotifyPlaylist: 'https://open.spotify.com/playlist/5gWLXTCm2tjlHRWThcqOIv', fingerprint: { target: { energy: 8, aggression: 1, darkness: 2, rhythm: 10, organic_electronic: 7, accessibility: 9 }, genres: ['Soul / R&B / Funk', 'Electronic', 'Pop'], families: ['funk_disco', 'boogie', 'disco_house', 'dance_pop'], words: ['disco', 'hi-nrg', 'boogie', 'post-disco', 'nu-disco', 'italo disco', 'four-on-the-floor'], avoidWords: ['future bass', 'big room', 'drum & bass', 'dubstep'], avoidFamilies: ['dnb_jungle', 'future_bass', 'dubstep'], anchors: ['The O’Jays', "The O'Jays", 'KC and the Sunshine Band', 'Heatwave', 'Rose Royce', 'Cheryl Lynn', 'Evelyn “Champagne” King', 'Evelyn King', 'Diana Ross', 'Sister Sledge', 'Chic', 'Bee Gees', 'The Trammps', 'Gloria Gaynor', 'Thelma Houston', 'Donna Summer', 'Cerrone', 'Giorgio Moroder', 'ABBA', 'Boney M.', 'Boney M', 'Sylvester', 'Patrick Cowley', 'Gino Soccio', 'Dan Hartman', 'Change', 'D-Train', 'Shalamar', 'Indeep', 'Grace Jones', 'L’Impératrice', "L'Impératrice", 'Jessie Ware', 'Purple Disco Machine'] } },
  { group: 'Dancing', label: 'Dancing… to Funk', blurb: 'Syncopated basslines, live-pocket grooves, P-Funk and electro-funk.', target: { energy: 8, aggression: 2, darkness: 2, rhythm: 10, organic_electronic: 4, accessibility: 8 }, genres: ['Soul / R&B / Funk', 'Jazz', 'Rock'], words: ['funk', 'p-funk', 'electro-funk', 'jazz-funk', 'funk rock', 'groove', 'talkbox'], youtubePlaylist: 'https://music.youtube.com/playlist?list=PLNj0l9rfqiT0', spotifyPlaylist: 'https://open.spotify.com/playlist/6085mpg4MoWvWdMi7w1qJC', fingerprint: { target: { energy: 8, aggression: 2, darkness: 2, rhythm: 10, organic_electronic: 4, accessibility: 8 }, genres: ['Soul / R&B / Funk', 'Jazz', 'Rock'], families: ['funk_disco', 'funk', 'electrofunk', 'pfunk', 'soul', 'jazz_funk'], words: ['funk', 'p-funk', 'electro-funk', 'jazz-funk', 'funk rock', 'psychedelic funk', 'space funk', 'talkbox', 'syncopated'], avoidWords: ['drum & bass', 'jungle', 'city pop', 'smooth jazz'], avoidFamilies: ['dnb_jungle', 'citypop'], anchors: ['James Brown', 'Sly & The Family Stone', 'The Meters', 'Stevie Wonder', 'Curtis Mayfield', 'The Isley Brothers', 'Parliament', 'Funkadelic', 'Ohio Players', 'Kool & The Gang', 'Tower of Power', 'Average White Band', 'Betty Davis', 'Bootsy Collins', 'Herbie Hancock', 'Earth, Wind & Fire', 'Prince', 'Rick James', 'The Gap Band', 'Zapp', 'Cameo', 'Lakeside', 'Chaka Khan', 'Dâm-Funk', 'Vulfpeck', 'Lettuce', 'Khruangbin', 'Jungle', 'Anderson .Paak', 'Childish Gambino'] } },
  { group: 'Dancing', label: 'Dancing… to House', blurb: 'Four-on-the-floor movement from warm to euphoric.', target: { energy: 8, rhythm: 10, organic_electronic: 9 }, words: ['house', 'garage', 'club', 'dance'], youtubePlaylist: 'https://music.youtube.com/playlist?list=PLDABf280JPpA', spotifyPlaylist: 'https://open.spotify.com/playlist/6zOBDliO0Y3vnt27aGkIYJ' },
];


// Original suggested tracklists, accepted by user as the working baseline.
const mixtapeBaselineArtists = {"Euroshock": ["Cassius", "Étienne de Crécy", "Daft Punk", "Mr. Oizo", "Justice", "SebastiAn", "Kavinsky", "Vitalic", "Boys Noize", "Digitalism", "Soulwax", "Simian Mobile Disco", "The Bloody Beetroots", "Para One", "Surkin", "Danger", "Zombie Nation", "Alter Ego", "Rex the Dog", "Miss Kittin & The Hacker", "Gesaffelstein", "The Hacker", "DJ Hell", "Ellen Allien", "Modeselektor", "Anthony Rother", "I-F", "Legowelt", "LFO", "Laurent Garnier", "Underworld", "Orbital", "Trentemøller", "Röyksopp", "The Knife", "Breakbot"], "Soft Focus": ["Her’s", "Men I Trust", "No Vacation", "Crumb", "Mild High Club", "Mac DeMarco", "TOPS", "The Marías", "Strawberry Guy", "Molly Burch", "Alvvays", "Fazerdaze", "Wild Nothing", "Craft Spells", "Real Estate", "Beach Fossils", "Widowspeak", "Still Corners", "Beach House", "Cigarettes After Sex", "Mazzy Star", "Slowdive", "DIIV", "Lush", "Cocteau Twins", "The Sundays", "The Radio Dept.", "Melody’s Echo Chamber", "Broadcast", "Sweet Trip", "Drug Store Romeos", "Japanese Breakfast", "Yumi Zouma", "Kero Kero Bonito", "Air", "Julee Cruise"], "Dancing… to Disco": ["The O’Jays", "KC and the Sunshine Band", "Heatwave", "Rose Royce", "Cheryl Lynn", "Evelyn “Champagne” King", "Diana Ross", "Sister Sledge", "Chic", "Bee Gees", "The Trammps", "Gloria Gaynor", "Thelma Houston", "Donna Summer", "Cerrone", "Giorgio Moroder", "ABBA", "Boney M.", "Sylvester", "Patrick Cowley", "Gino Soccio", "Dan Hartman", "Change", "D-Train", "Shalamar", "Indeep", "Grace Jones", "L’Impératrice", "Jessie Ware", "Purple Disco Machine"], "Dancing… to Funk": ["James Brown", "Sly & The Family Stone", "The Meters", "Stevie Wonder", "Curtis Mayfield", "The Isley Brothers", "Parliament", "Funkadelic", "Ohio Players", "Kool & The Gang", "Tower of Power", "Average White Band", "Betty Davis", "Bootsy Collins", "Herbie Hancock", "Earth, Wind & Fire", "Prince", "Rick James", "The Gap Band", "Zapp", "Cameo", "Lakeside", "Chaka Khan", "Dâm-Funk", "Vulfpeck", "Lettuce", "Khruangbin", "Jungle", "Anderson .Paak", "Childish Gambino"]};
for (const preset of musicForPresets) {
  if (preset.fingerprint && mixtapeBaselineArtists[preset.label]) preset.fingerprint.anchors = mixtapeBaselineArtists[preset.label];
}
// Editorial interpretation of song choices, not extracted audio features.
const mixtapeBaselineRules = {
  'Dancing… to Disco': { coreWords: ['disco', 'hi-nrg', 'boogie'], maxTraits: {} },
  'Dancing… to Funk': { coreWords: ['funk', 'p-funk', 'jazz-funk', 'electro-funk'], maxTraits: {} },
  'Soft Focus': { coreWords: [], maxTraits: { aggression: 4, energy: 7 } },
  'Euroshock': { coreWords: ['electro', 'house', 'techno', 'synthwave', 'synth-pop', 'electropop'], maxTraits: {} }
};
for (const preset of musicForPresets) {
  if (preset.fingerprint && mixtapeBaselineRules[preset.label]) Object.assign(preset.fingerprint, mixtapeBaselineRules[preset.label]);
}
// Editorial references are not a verified live playlist manifest.
const mixtapeProfileCache = new WeakMap();
const mixtapeScoreCache = new WeakMap();
const mixtapeText = value => String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
function mixtapeWordHit(text, word) { return (` ${mixtapeText(text)} `).includes(` ${mixtapeText(word)} `); }
function mixtapeReferences(fingerprint) {
  const cached = mixtapeProfileCache.get(fingerprint);
  if (cached && cached.catalog === artists) return cached.rows;
  const names = new Set((fingerprint.anchors || []).map(mixtapeText));
  const rows = artists.filter(a => names.has(mixtapeText(a.artist)));
  mixtapeProfileCache.set(fingerprint, { catalog: artists, rows });
  return rows;
}
function fingerprintScore(a, fingerprint) {
  if (!fingerprint) return null;
  let cached = mixtapeScoreCache.get(fingerprint);
  if (!cached || cached.catalog !== artists) { cached = { catalog: artists, scores: new WeakMap() }; mixtapeScoreCache.set(fingerprint, cached); }
  if (cached.scores.has(a)) return cached.scores.get(a);
  // Broad genre headings must not count as evidence for a specific style.
  const haystack = `${a.style_tags || ''} ${a.mood || ''} ${a.atmosphere || ''}`;
  const families = [a.family1, a.family2, a.family3].filter(Boolean).map(mixtapeText);
  let score = 0, weight = 0;
  Object.entries(fingerprint.target || {}).forEach(([key, wanted]) => {
    if (a[key] === null || a[key] === undefined || !Number.isFinite(Number(a[key]))) return;
    score += Math.max(0, 1 - Math.abs(Number(a[key]) - wanted) / 9) * 2;
    weight += 2;
  });
  const wordHits = (fingerprint.words || []).filter(word => mixtapeWordHit(haystack, word)).length;
  const familyHit = (fingerprint.families || []).some(family => families.includes(mixtapeText(family)));
  const genreHit = (fingerprint.genres || []).includes(a.primary_genre);
  if (fingerprint.words?.length) { score += Math.min(1, wordHits / 2) * 4; weight += 4; }
  if (fingerprint.families?.length) { score += familyHit ? 3 : 0; weight += 3; }
  if (fingerprint.genres?.length) { score += genreHit ? 2 : 0; weight += 2; }
  let result = score / Math.max(1, weight);
  // Nearest three references preserve multiple strands; exclude self and give
  // no direct membership bonus. Reference artists remain subject to exclusions.
  const referenceScores = mixtapeReferences(fingerprint).filter(r => r.artist !== a.artist).map(r => {
    const fp = ATMEngine.fingerprint(a, r);
    return .45 * fp.tag + .30 * fp.family + .25 * fp.sonic;
  }).sort((a,b) => b-a).slice(0,3);
  if (referenceScores.length >= 3) result = .60 * result + .40 * referenceScores.reduce((a,b) => a+b,0) / 3;
  if (!familyHit && wordHits === 0) result *= .55;
  const avoidWordHits = (fingerprint.avoidWords || []).filter(word => mixtapeWordHit(haystack, word)).length;
  const avoidFamilyHit = (fingerprint.avoidFamilies || []).some(family => families.includes(mixtapeText(family)));
  result -= Math.min(.35, avoidWordHits * .18 + (avoidFamilyHit ? .25 : 0));
  // Whole-artist profiles can drift away from the selected songs. Keep a soft
  // style check; reference membership does not waive it.
  if (fingerprint.coreWords?.length && !fingerprint.coreWords.some(w => mixtapeWordHit(a.style_tags, w))) result *= .70;
  for (const [key, ceiling] of Object.entries(fingerprint.maxTraits || {})) {
    if (a[key] !== null && a[key] !== undefined && Number.isFinite(Number(a[key]))) result -= Math.min(.25, Math.max(0, Number(a[key]) - ceiling) * .07);
  }
  result = Math.max(0, Math.min(1, result));
  cached.scores.set(a, result);
  return result;
}
function musicForScore(a, preset) {
  const scenario = profilePresetScore(a, preset);
  const editorial = fingerprintScore(a, preset.fingerprint);
  return editorial === null ? scenario : Math.max(0, Math.min(1, scenario * .72 + editorial * .28));
}
function seededShuffle(rows, seed) {
  const out = [...rows];
  let x = (Number(seed) || Date.now()) >>> 0;
  const rand = () => { x += 0x6D2B79F5; let t = x; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}
function musicModeIcon(kind) {
  if (kind === 'random') return `<svg class="mode-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="3"></rect><circle cx="8" cy="8" r="1"></circle><circle cx="16" cy="8" r="1"></circle><circle cx="12" cy="12" r="1"></circle><circle cx="8" cy="16" r="1"></circle><circle cx="16" cy="16" r="1"></circle></svg>`;
  return `<svg class="mode-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19h16"></path><path d="M6 19v-5h4v5"></path><path d="M10 19V8h4v11"></path><path d="M14 19v-8h4v8"></path><path d="M11 5h2"></path></svg>`;
}
function musicForResults(preset) {
  if (preset.playlistOnly) return [];
  const disliked = new Set(Object.entries(prefs()).filter(([, p]) => p.disliked).map(([name]) => name));
  let pool = artists.filter(a => !disliked.has(a.artist));
  if (preset.strictGenre && preset.genres?.length) pool = pool.filter(a => preset.genres.includes(a.primary_genre));
  return pool.map(a => ({ a, score: musicForScore(a, preset) }))
    .filter(row => row.score >= .54).sort((x, y) => y.score - x.score || x.a.artist.localeCompare(y.a.artist)).slice(0, 36);
}
function hasPlaylist(preset) { return !!(preset?.youtubePlaylist || preset?.spotifyPlaylist); }
function playlistButtons(preset) {
  const buttons = [];
  if (preset?.youtubePlaylist) buttons.push(`<a class="btn primary playlist-open youtube-open" href="${attr(preset.youtubePlaylist)}" target="_blank" rel="noopener">▶ YouTube Music</a>`);
  if (preset?.spotifyPlaylist) buttons.push(`<a class="btn playlist-open spotify-open" href="${attr(preset.spotifyPlaylist)}" target="_blank" rel="noopener">Spotify ↗</a>`);
  return `<div class="playlist-actions">${buttons.join('')}</div>`;
}
function playlistStrip(preset) {
  if (!hasPlaylist(preset)) return '';
  const roadTrip = preset.group === 'Road Trips';
  return `<div class="playlist-strip"><div><div class="eyebrow">ATM ${roadTrip ? 'Road Trip ' : ''}mixtape</div><b>${roadTrip ? 'Take this one with you.' : 'Play the ATM-curated mixtape.'}</b><span>Available on ${preset.youtubePlaylist ? 'YouTube Music' : ''}${preset.youtubePlaylist && preset.spotifyPlaylist ? ' and ' : ''}${preset.spotifyPlaylist ? 'Spotify' : ''}. The tracklist may keep evolving.</span></div>${playlistButtons(preset)}</div>`;
}
function musicForAlphaKey(label) {
  return String(label || '').replace(/^[^A-Za-z0-9]+/, '').toLocaleLowerCase();
}
function musicForDisplayGroup(preset) {
  if (['"Bedtime" 😉', 'Drifting Off', 'Get Hyped', 'Calm Down', 'Wake Up'].includes(preset.label)) return 'Energy';
  const map = {
    'ATM Playlists': 'ATM Mixtapes',
    'Road Trips': 'Road Trip',
    'Dancing': 'Dancing',
    'Going out': 'Moods & Moments',
    'Heart stuff': 'Moods & Moments',
    'Time & place': 'Moods & Moments',
    'Change the energy': 'Energy',
  };
  return map[preset.group] || preset.group;
}
function musicFor() {
  const selectedLabel = state.musicForPreset || '';
  const selected = musicForPresets.find(p => p.label === selectedLabel);
  const groups = [...new Set(musicForPresets.map(musicForDisplayGroup))].sort((a, b) => {
    const aPresets = musicForPresets.filter(p => musicForDisplayGroup(p) === a);
    const bPresets = musicForPresets.filter(p => musicForDisplayGroup(p) === b);
    const aPlaylist = aPresets.some(hasPlaylist);
    const bPlaylist = bPresets.some(hasPlaylist);
    if (aPlaylist !== bPlaylist) return aPlaylist ? -1 : 1;
    return musicForAlphaKey(a).localeCompare(musicForAlphaKey(b), undefined, { numeric: true });
  });
  const choices = groups.map(group => {
    const groupPresets = musicForPresets.filter(p => musicForDisplayGroup(p) === group).sort((a, b) => musicForAlphaKey(a.label).localeCompare(musicForAlphaKey(b.label), undefined, { numeric: true }));
    const playlistGroup = groupPresets.some(hasPlaylist);
    const selectedInGroup = groupPresets.some(p => p.label === selectedLabel);
    return `<details class="occasion-group ${playlistGroup ? 'roadtrip-group' : ''}" data-occasion-group="${attr(group)}" ${selectedInGroup ? 'open' : ''}><summary class="occasion-group-head"><div><div class="eyebrow">${esc(group)}</div><small>${groupPresets.length} option${groupPresets.length === 1 ? '' : 's'}</small></div><div class="occasion-summary-meta">${playlistGroup ? '<span class="roadtrip-service">YouTube Music + Spotify</span>' : '<span class="recommendation-service">ATM recommendations</span>'}<i>⌄</i></div></summary><div class="occasion-grid occasion-group-grid">${groupPresets.map(p => `<button class="occasion-card ${selectedLabel === p.label ? 'active' : ''}" data-occasion="${attr(p.label)}"><b>${esc(p.label)}</b><span>${esc(p.blurb)}</span>${hasPlaylist(p) ? '<small class="occasion-playlist-note">▶ ATM mixtape · YouTube + Spotify</small>' : ''}</button>`).join('')}</div></details>`;
  }).join('');
  let results = '';
  if (selected) {
    const strip = playlistStrip(selected);
    if (selected.playlistOnly) {
      results = `<section class="section music-results"><div class="result-head"><div><div class="eyebrow">ATM Mixtape</div><h2>${esc(selected.label)}</h2><p class="small">${esc(selected.blurb)}</p></div></div>${strip}<div class="panel pad playlist-only-note"><b>Curated rather than ranked.</b><p class="small">This selection crosses too many styles for a single sonic profile, so ATM keeps it as a hand-curated playlist rather than pretending there is one meaningful ranked match list.</p></div></section>`;
    } else {
      const rankedRows = musicForResults(selected);
      const randomMode = state.musicForMode === 'random';
      const rows = randomMode ? seededShuffle(rankedRows, state.musicForShuffleSeed) : rankedRows;
      results = `<section class="section music-results"><div class="result-head"><div><div class="eyebrow">Mixtape</div><h2>${esc(selected.label)}</h2><p class="small">${esc(selected.blurb)} ${randomMode ? 'Randomiser is mixing the qualifying artists.' : 'Ranked by how closely each artist fits the ATM profile.'} Disliked artists are excluded.</p></div><div class="music-result-actions"><button id="musicRanked" class="btn mode-btn ${randomMode ? '' : 'active'}">${musicModeIcon('ranked')}<span>Ranked</span></button><button id="musicRandom" class="btn mode-btn ${randomMode ? 'active' : ''}">${musicModeIcon('random')}<span>Randomiser</span></button><button id="occasionSurprise" class="btn" ${rows.length ? '' : 'disabled'}>✦ Pick one</button></div></div>${strip}<div class="cards">${rows.slice(0, 18).map((row, i) => recCard({ artist: row.a, score: row.score, why: presetReason(row.a, selected) }, i + 1)).join('')}</div></section>`;
    }
  }
  layout(`<section><div class="eyebrow">Choose the moment</div><h1 class="title">Mixtapes</h1><p class="subtitle">Pick a moment, mood or curated ATM playlist. Playlist-enabled sections open on <b>YouTube Music</b> or <b>Spotify</b>.</p></section><section class="section occasion-stack">${choices}</section>${results || '<div class="panel empty section">Choose a moment or playlist above.</div>'}`, 'musicfor');
  document.querySelectorAll('[data-occasion]').forEach(button => button.onclick = () => { state.musicForPreset = button.dataset.occasion; state.musicForMode = 'ranked'; state.musicForShuffleSeed = 0; saveState(); render(); setTimeout(() => document.querySelector('.music-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50); });
  document.querySelectorAll('[data-open]').forEach(button => button.onclick = () => openArtist(button.dataset.open));
  const surprise = document.getElementById('occasionSurprise');
  if (surprise && selected && !selected.playlistOnly) surprise.onclick = () => { const base = musicForResults(selected); const rows = state.musicForMode === 'random' ? seededShuffle(base, state.musicForShuffleSeed) : base; if (rows.length) openArtist(rows[Math.floor(Math.random() * Math.min(18, rows.length))].a.artist); };
  const ranked = document.getElementById('musicRanked');
  if (ranked) ranked.onclick = () => { state.musicForMode = 'ranked'; saveState(); render(); setTimeout(() => document.querySelector('.music-results')?.scrollIntoView({ block: 'start' }), 20); };
  const random = document.getElementById('musicRandom');
  if (random) random.onclick = () => { state.musicForMode = 'random'; state.musicForShuffleSeed = Date.now(); saveState(); render(); setTimeout(() => document.querySelector('.music-results')?.scrollIntoView({ block: 'start' }), 20); };
}

function catalogueLetter(name) {
  const first = String(name || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').charAt(0).toUpperCase();
  return /[A-Z]/.test(first) ? first : '#';
}
function catalogueSortKey(name) {
  return String(name || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}
function catalogue() {
  const groups = new Map();
  artists.forEach(a => { const letter = catalogueLetter(a.artist); if (!groups.has(letter)) groups.set(letter, []); groups.get(letter).push(a); });
  groups.forEach(rows => rows.sort((a, b) => catalogueSortKey(a.artist).localeCompare(catalogueSortKey(b.artist)) || a.artist.localeCompare(b.artist)));
  const letters = ['#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].filter(letter => groups.has(letter));
  const sections = letters.map(letter => `<details class="catalogue-letter" data-letter="${letter}"><summary><span>${letter}</span><small>${groups.get(letter).length} artist${groups.get(letter).length === 1 ? '' : 's'}</small></summary><div class="catalogue-letter-list">${groups.get(letter).map(a => `<button class="catalogue-artist" data-open="${attr(a.artist)}"><span>${esc(a.artist)}</span><small>${esc(a.primary_genre || '')}</small><i>→</i></button>`).join('')}</div></details>`).join('');
  layout(`<section><div class="eyebrow">Browse the catalogue</div><h1 class="title">Artists in ATM</h1><p class="subtitle">All ${artists.length.toLocaleString()} artists, alphabetically. Search directly or open a letter to browse.</p><div class="catalogue-search"><input id="catalogueSearch" class="field" inputmode="search" placeholder="Search all artists…"></div></section><section id="catalogueSearchResults" class="section" hidden></section><section id="catalogueLetters" class="section catalogue-letters">${sections}</section>`, '');
  const input = document.getElementById('catalogueSearch');
  const resultBox = document.getElementById('catalogueSearchResults');
  const letterBox = document.getElementById('catalogueLetters');
  const bindOpen = root => root.querySelectorAll('[data-open]').forEach(b => b.onclick = () => openArtist(b.dataset.open));
  bindOpen(letterBox);
  input.oninput = () => {
    const q = input.value.trim().toLocaleLowerCase();
    if (!q) { resultBox.hidden = true; resultBox.innerHTML = ''; letterBox.hidden = false; return; }
    const matches = artists.filter(a => a.artist.toLocaleLowerCase().includes(q));
    letterBox.hidden = true; resultBox.hidden = false;
    resultBox.innerHTML = `<div class="panel pad"><div class="catalogue-result-head"><b>${matches.length} result${matches.length === 1 ? '' : 's'}</b><small>Search matches across the full catalogue</small></div>${matches.length ? matches.map(a => `<button class="catalogue-artist" data-open="${attr(a.artist)}"><span>${esc(a.artist)}</span><small>${esc(a.primary_genre || '')}</small><i>→</i></button>`).join('') : '<div class="empty">No matching artists.</div>'}</div>`;
    bindOpen(resultBox);
  };
}

function guideHeading(iconHtml, text) { return `<h2 class="guide-title"><span class="guide-icon">${iconHtml}</span><span>${text}</span></h2>`; }
function guideTopic(title, body, open = false) {
  return `<details class="panel guide-card guide-topic" ${open ? 'open' : ''}><summary><b>${title}</b><i>⌄</i></summary><div class="guide-topic-body">${body}</div></details>`;
}
function guide() {
  const topics = [
    guideTopic('Where should I start?', `<p>For most people, start with <b>Artist Match</b>: choose an artist you love and ATM will map nearby artists. <b>Lucky</b> is the quickest route when you simply want a surprise.</p>`, true),
    guideTopic('Artist Match', `<p><b>Closest Match</b>, <b>Broaden It</b> and <b>Wildcard</b> change how far ATM travels from your reference artist. <b>Ranked</b> keeps the strongest matches first; <b>Randomiser</b> reshuffles the wider pool.</p>`),
    guideTopic('Vibes', `<p><b>Quick Vibes</b> are the simple route. Open <b>Advanced: Build your own vibe</b> when you want to combine exact genres, styles and moods.</p>`),
    guideTopic('Mixtapes', `<p>Choose a situation or mood, or open a curated <b>ATM Mixtape</b>. Playlist-enabled sections link to both <b>YouTube Music</b> and <b>Spotify</b>; recommendation-only sections use the ATM catalogue to find artists that fit.</p>`),
    guideTopic('Your lists & dislikes', `<p><b>Favourite</b> is for artists you already value. <b>Want to Explore</b> is your listening queue. <b>Dislike</b> removes an artist from Lucky, Vibes and Mixtape recommendations.</p>`),
    guideTopic('Catalogue & navigation', `<p>The catalogue total on Home opens the complete A–Z artist browser. The six-button bottom bar keeps <b>Home</b>, <b>Match</b>, <b>Vibes</b>, <b>Mixtapes</b>, <b>Lucky</b> and <b>Favourites</b> one tap away.</p>`),
  ].join('');
  const appInfo = `<details class="panel guide-card guide-topic guide-technical"><summary><b>Data, backup & app information</b><i>⌄</i></summary><div class="guide-topic-body"><p>Your favourites, Want to Explore list, dislikes, notes and history are stored locally on this device. Export a backup if you want to protect or move them.</p><div class="mini-actions"><button id="exportGuide" class="btn primary">Export my ATM data</button><button id="importGuide" class="btn">Restore backup</button><button id="installGuide" class="btn" style="display:none">Install ATM</button><input id="importFile" type="file" accept="application/json,.json" hidden></div><hr class="guide-rule"><p class="small">Artwork first checks ATM’s known artwork map, then TheAudioDB, then the existing secure YouTube artwork service. Successful resolutions are cached locally.</p><div class="version-line"><b>ATM Mobile v${APP_VERSION} · ${artists.length.toLocaleString()} artists</b><span id="versionStatus">Checking for updates…</span></div></div></details>`;
  layout(`<section><div class="eyebrow">Help & how it works</div><h1 class="title">Guide</h1><p class="subtitle">The essentials first. Open a topic only when you need more detail.</p></section><section class="guide-stack">${topics}${appInfo}</section>`, '');
  document.getElementById('exportGuide').onclick = exportPersonalData;
  const importBtn = document.getElementById('importGuide');
  const importFile = document.getElementById('importFile');
  importBtn.onclick = () => importFile.click();
  importFile.onchange = () => { if (importFile.files?.[0]) restorePersonalData(importFile.files[0]); };
  const installGuide = document.getElementById('installGuide');
  if (deferredInstall && installGuide) { installGuide.style.display = 'inline-flex'; installGuide.onclick = installApp; }
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
    searchRecent: state.searchRecent || [],
    discovery: { selected: state.selected, mode: state.mode },
    vibe: { filters: state.vibe, match: state.vibeMatch, sort: state.vibeSort, preset: state.vibePreset || '' },
    musicFor: { preset: state.musicForPreset || '', mode: state.musicForMode || 'ranked' },
    resultOrdering: { discover: state.discoverOrder || 'ranked', vibe: state.vibeOrder || 'ranked' },
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
    state.searchRecent = Array.isArray(data.searchRecent) ? data.searchRecent : [];
    if (data.discovery) {
      state.selected = data.discovery.selected || state.selected;
      state.mode = data.discovery.mode || state.mode;
    }
    if (data.vibe) {
      state.vibe = { genres: [], styles: [], moods: [], ...(data.vibe.filters || {}) };
      state.vibeMatch = data.vibe.match || 'all';
      state.vibeSort = data.vibe.sort || 'az';
      state.vibePreset = data.vibe.preset || '';
    }
    if (data.musicFor) {
      state.musicForPreset = legacyMusicForLabels[data.musicFor.preset] || data.musicFor.preset || '';
      state.musicForMode = data.musicFor.mode || 'ranked';
      state.musicForShuffleSeed = 0;
    }
    if (data.resultOrdering) {
      state.discoverOrder = data.resultOrdering.discover || 'ranked';
      state.vibeOrder = data.resultOrdering.vibe || 'ranked';
      state.discoverShuffleSeed = 0;
      state.vibeShuffleSeed = 0;
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
    if (d.version === APP_VERSION) {
      el.textContent = '• Up to date';
      el.className = 'version-ok';
      el.onclick = null;
    } else {
      el.textContent = `• v${d.version} available — tap to update`;
      el.className = 'version-update';
      el.setAttribute('role', 'button');
      el.tabIndex = 0;
      el.onclick = activateAppUpdate;
      el.onkeydown = event => { if (event.key === 'Enter' || event.key === ' ') activateAppUpdate(); };
    }
  } catch { el.textContent = '• Offline'; }
}

async function activateAppUpdate() {
  const el = document.getElementById('versionStatus');
  if (el) el.textContent = '• Updating…';
  try {
    const registration = await navigator.serviceWorker?.getRegistration();
    if (registration) {
      await registration.update();
      if (registration.waiting) registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      else setTimeout(() => location.reload(), 500);
    } else {
      location.reload();
    }
  } catch {
    location.reload();
  }
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
  else if (state.page === 'musicfor') musicFor();
  else if (state.page === 'guide') guide();
  else if (state.page === 'catalogue') catalogue();
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

Promise.all([
  fetch('catalog.json').then(r => { if (!r.ok) throw new Error('catalog'); return r.json(); }),
  fetch('artwork.json').then(r => r.ok ? r.json() : { artists: {} }).catch(() => ({ artists: {} })),
]).then(([d, artwork]) => {
    artists = d.artists;
    byName = new Map(artists.map(a => [a.artist, a]));
    knownArtwork = artwork?.artists || {};
    buildVibeData();
    state.page = 'home';
    pushRoute(true);
    render();
  })
  .catch(() => { document.getElementById('app').innerHTML = '<div class="loading"><div class="logo-a">Λ</div><p>ATM could not load its catalogue.<br>Run it from a web server rather than opening index.html directly.</p></div>'; });

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      location.reload();
    });

    try {
      const registration = await navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' });
      if (registration.waiting) registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        if (!worker) return;
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            worker.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      });
      await registration.update();
    } catch { /* The online app remains usable if service-worker registration fails. */ }
  });
}
