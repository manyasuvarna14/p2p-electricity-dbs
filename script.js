/* ═══════════════════════════════════════════════════════════════════
   script.js — VoltShare P2P Energy Trading Platform
   All data served from Railway MySQL backend via Flask API.
   No localStorage simulation — real API calls only.
═══════════════════════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────────────────────────
   SECTION 1: CONFIG
   !! Replace YOUR_RAILWAY_URL with your actual Railway backend URL !!
   Example: https://p2p-backend-production-f8ab.up.railway.app
───────────────────────────────────────────────────────────────────*/
const API_BASE = 'https://p2p-backend-production-f878.up.railway.app';;

/* Role name → role_id mapping (matches DB seed data) */
const ROLE_IDS = { prosumer: 3, buyer: 1, seller: 2 };
const PLATFORM_FEE = 0.025;

/* ─────────────────────────────────────────────────────────────────
   SECTION 2: SESSION  (sessionStorage — clears on tab close)
───────────────────────────────────────────────────────────────────*/
const session = {
  get()  { try { return JSON.parse(sessionStorage.getItem('vs_user')); } catch { return null; } },
  set(u) { sessionStorage.setItem('vs_user', JSON.stringify(u)); },
  clear(){ sessionStorage.removeItem('vs_user'); },
};

function getCurrentUser() { return session.get(); }

/* ─────────────────────────────────────────────────────────────────
   SECTION 3: API HELPER
───────────────────────────────────────────────────────────────────*/
async function api(path, opts = {}) {
  try {
    const res  = await fetch(API_BASE + path, {
      headers: { 'Content-Type': 'application/json' },
      ...opts,
    });
    const json = await res.json();
    return { ok: res.ok, data: json.data, message: json.message, status: res.status };
  } catch (e) {
    return { ok: false, message: 'Network error: ' + e.message };
  }
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 4: UTILITIES
───────────────────────────────────────────────────────────────────*/
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function fmtRupee(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  });
}

function initials(name) {
  return (name || '??').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 5: LANDING ANIMATION
───────────────────────────────────────────────────────────────────*/
function initLanding() {
  runEnergyCanvas();
  const fill  = document.getElementById('lpFill');
  const hint  = document.querySelector('.landing-hint');
  let progress = 0;
  const steps = [
    { pct: 30,  msg: 'Loading market data…' },
    { pct: 60,  msg: 'Syncing smart meters…' },
    { pct: 85,  msg: 'Connecting to grid…' },
    { pct: 100, msg: 'Ready.' },
  ];
  let stepIdx = 0;
  const interval = setInterval(() => {
    progress = Math.min(progress + 1.4, 100);
    fill.style.width = progress + '%';
    if (stepIdx < steps.length && progress >= steps[stepIdx].pct) {
      hint.textContent = steps[stepIdx].msg;
      stepIdx++;
    }
    if (progress >= 100) {
      clearInterval(interval);
      setTimeout(() => showLayer('auth'), 480);
    }
  }, 28);
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 6: CANVAS ENERGY ANIMATION
───────────────────────────────────────────────────────────────────*/
function runEnergyCanvas() {
  const canvas = document.getElementById('grid-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);

  const particles = Array.from({ length: 55 }, () => ({
    x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight,
    r: Math.random() * 1.4 + 0.4, vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
    alpha: Math.random() * 0.5 + 0.2, col: Math.random() > 0.5 ? '#00d68f' : '#00b4ff',
  }));

  function mkStreak() {
    const fromLeft = Math.random() > 0.5;
    return { x: fromLeft ? 0 : canvas.width, y: Math.random() * canvas.height,
      len: Math.random() * 160 + 70, speed: (Math.random() * 1.4 + 0.5) * (fromLeft ? 1 : -1),
      w: Math.random() * 1.4 + 0.4, alpha: 0, life: Math.floor(Math.random() * 100),
      maxLife: Math.floor(Math.random() * 100 + 80), col: Math.random() > 0.5 ? '#00d68f' : '#00b4ff' };
  }
  const streaks = Array.from({ length: 7 }, mkStreak);
  const pulses  = [];
  let pulseTimer = 0;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
      particles.forEach(q => {
        const d = Math.hypot(p.x - q.x, p.y - q.y);
        if (d < 110) { ctx.globalAlpha = (1 - d / 110) * 0.1; ctx.strokeStyle = p.col;
          ctx.lineWidth = 0.4; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); }
      });
      ctx.globalAlpha = p.alpha; ctx.fillStyle = p.col;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    });
    streaks.forEach(s => {
      s.x += s.speed; s.life++;
      const half = s.maxLife / 2;
      s.alpha = s.life < half ? (s.life / half) * 0.6 : ((s.maxLife - s.life) / half) * 0.6;
      if (s.life >= s.maxLife) Object.assign(s, mkStreak(), { life: 0 });
      const dir = Math.sign(s.speed);
      const grad = ctx.createLinearGradient(s.x - s.len * dir, s.y, s.x, s.y);
      grad.addColorStop(0, 'transparent'); grad.addColorStop(1, s.col);
      ctx.globalAlpha = s.alpha; ctx.strokeStyle = grad; ctx.lineWidth = s.w;
      ctx.shadowBlur = 7; ctx.shadowColor = s.col;
      ctx.beginPath(); ctx.moveTo(s.x - s.len * dir, s.y); ctx.lineTo(s.x, s.y); ctx.stroke();
      ctx.shadowBlur = 0;
    });
    pulseTimer++;
    if (pulseTimer % 90 === 0)
      pulses.push({ x: canvas.width/2, y: canvas.height/2, r: 0, alpha: 0.35,
        col: Math.random() > 0.5 ? '#00d68f' : '#00b4ff' });
    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i]; p.r += 2.5; p.alpha -= 0.005;
      if (p.alpha <= 0) { pulses.splice(i, 1); continue; }
      ctx.globalAlpha = p.alpha; ctx.strokeStyle = p.col; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }
  draw();
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 7: LAYER / SCREEN NAVIGATION
───────────────────────────────────────────────────────────────────*/
function showLayer(id) {
  document.querySelectorAll('.layer').forEach(el => el.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) target.classList.add('active');
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 8: AUTH — TAB SWITCHING
───────────────────────────────────────────────────────────────────*/
function switchTab(tab) {
  const isLogin = tab === 'login';
  document.getElementById('formLogin').classList.toggle('active', isLogin);
  document.getElementById('formRegister').classList.toggle('active', !isLogin);
  document.getElementById('tabLogin').classList.toggle('active', isLogin);
  document.getElementById('tabRegister').classList.toggle('active', !isLogin);
  document.getElementById('tabInk').classList.toggle('right', !isLogin);
  clearAllErrors();
}

function toggleEye(inputId, btn) {
  const input = document.getElementById(inputId);
  const isText = input.type === 'text';
  input.type = isText ? 'password' : 'text';
  btn.style.color = isText ? '' : 'var(--green)';
}

function updateStrength(val) {
  const fill  = document.getElementById('strengthFill');
  const label = document.getElementById('strengthLabel');
  let score = 0;
  if (val.length >= 8)           score++;
  if (/[A-Z]/.test(val))        score++;
  if (/[0-9]/.test(val))        score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;
  const pct    = ['0%','25%','50%','75%','100%'];
  const colors = ['','#f0506e','#f5a623','#00b4ff','#00d68f'];
  const labels = ['—','Weak','Fair','Good','Strong'];
  fill.style.width = pct[score]; fill.style.background = colors[score];
  label.textContent = labels[score]; label.style.color = colors[score] || 'var(--text3)';
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 9: VALIDATION HELPERS
───────────────────────────────────────────────────────────────────*/
function showErr(id, msg) { const el = document.getElementById(id); if (el) el.textContent = msg; }
function clearErr(id)     { const el = document.getElementById(id); if (el) el.textContent = ''; }
function clearAllErrors() {
  ['loginEmailErr','loginPassErr','regNameErr','regEmailErr','regPassErr',
   'buyUnitsErr','buyMaxPriceErr','sellUnitsErr','sellPriceErr'].forEach(clearErr);
}
function isValidEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim()); }

/* ─────────────────────────────────────────────────────────────────
   SECTION 10: LOGIN  → POST /api/users/login
───────────────────────────────────────────────────────────────────*/
async function handleLogin(e) {
  e.preventDefault();
  clearAllErrors();
  const email = document.getElementById('loginEmail').value.trim();
  const pass  = document.getElementById('loginPass').value;
  if (!isValidEmail(email)) { showErr('loginEmailErr', 'Please enter a valid email.'); return; }
  if (pass.length < 6)      { showErr('loginPassErr', 'Password must be at least 6 characters.'); return; }

  const btn = e.target.querySelector('button[type=submit]');
  btn.textContent = 'Signing in…'; btn.disabled = true;

  const res = await api('/api/users/login', {
    method: 'POST', body: JSON.stringify({ email, password: pass }),
  });
  btn.textContent = 'Sign In'; btn.disabled = false;

  if (!res.ok) {
    if (res.status === 401) showErr('loginPassErr', 'Invalid email or password.');
    else showErr('loginEmailErr', res.message || 'Login failed.');
    return;
  }
  session.set(res.data);
  enterApp();
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 11: REGISTER  → POST /api/users/register
───────────────────────────────────────────────────────────────────*/
async function handleRegister(e) {
  e.preventDefault();
  clearAllErrors();
  const name  = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const role  = document.getElementById('regRole').value;
  const pass  = document.getElementById('regPass').value;
  let ok = true;
  if (name.length < 2)      { showErr('regNameErr',  'Name must be at least 2 characters.'); ok = false; }
  if (!isValidEmail(email)) { showErr('regEmailErr', 'Please enter a valid email.'); ok = false; }
  if (pass.length < 8)      { showErr('regPassErr',  'Password must be at least 8 characters.'); ok = false; }
  if (!ok) return;

  const btn = e.target.querySelector('button[type=submit]');
  btn.textContent = 'Creating account…'; btn.disabled = true;

  const res = await api('/api/users/register', {
    method: 'POST',
    body: JSON.stringify({ full_name: name, email, password: pass, role_id: ROLE_IDS[role] || 3 }),
  });
  btn.textContent = 'Create Account'; btn.disabled = false;

  if (!res.ok) {
    if (res.status === 409) showErr('regEmailErr', 'An account with this email already exists.');
    else showErr('regEmailErr', res.message || 'Registration failed.');
    return;
  }

  // Auto-login after register
  const loginRes = await api('/api/users/login', {
    method: 'POST', body: JSON.stringify({ email, password: pass }),
  });
  if (!loginRes.ok) { showToast('Account created! Please sign in.', 'success'); switchTab('login'); return; }
  session.set(loginRes.data);
  showToast(`Welcome to VoltShare, ${name.split(' ')[0]}!`, 'success');
  enterApp();
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 12: ENTER APP & LOGOUT
───────────────────────────────────────────────────────────────────*/
function enterApp() {
  const user = getCurrentUser();
  if (!user) { showLayer('auth'); return; }
  const firstName = (user.full_name || '').split(' ')[0];
  document.getElementById('suAvatar').textContent   = initials(user.full_name);
  document.getElementById('suName').textContent     = user.full_name;
  document.getElementById('suRole').textContent     = capitalize(user.role_name);
  document.getElementById('topbarName').textContent = firstName;
  document.getElementById('wcId').textContent       = String(user.user_id).padStart(4, '0');
  showLayer('app');
  navigateTo('dashboard');
  showToast(`Signed in as ${user.full_name}`, 'success');
}

function logout() {
  session.clear();
  showLayer('auth');
  switchTab('login');
  showToast('Signed out successfully', 'info');
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 13: IN-APP NAVIGATION
───────────────────────────────────────────────────────────────────*/
const pageTitles = {
  dashboard:    { title: 'Dashboard' },
  market:       { title: 'Marketplace',  sub: 'Browse all available listings' },
  transactions: { title: 'Transactions', sub: 'Your complete trade history' },
  wallet:       { title: 'Wallet',       sub: 'Balance, payments & history' },
};

function navigateTo(pageId) {
  document.querySelectorAll('.nav-link').forEach(el =>
    el.classList.toggle('active', el.dataset.page === pageId));
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + pageId).classList.add('active');
  const info = pageTitles[pageId];
  if (info) {
    document.getElementById('topbarTitle').textContent = info.title;
    if (info.sub) document.getElementById('topbarSub').textContent = info.sub;
  }
  if (pageId === 'dashboard')    renderDashboard();
  if (pageId === 'market')       renderMarket();
  if (pageId === 'transactions') renderTransactions();
  if (pageId === 'wallet')       renderWallet();
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 14: DASHBOARD  → GET /api/stats/user/<id>
───────────────────────────────────────────────────────────────────*/
async function renderDashboard() {
  const user = getCurrentUser();
  if (!user) return;
  const stats = await api(`/api/stats/user/${user.user_id}`);
  if (stats.ok && stats.data) {
    const d = stats.data;
    document.getElementById('kpiBought').textContent   = Number(d.units_bought_kwh || 0).toFixed(2) + ' kWh';
    document.getElementById('kpiSold').textContent     = Number(d.units_sold_kwh   || 0).toFixed(2) + ' kWh';
    document.getElementById('kpiWallet').textContent   = fmtRupee(d.wallet_balance);
    document.getElementById('kpiListings').textContent = d.active_listings || 0;
  }
  updateSellPreview();
  await renderListingsGrid('listingsGrid');
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 15: LISTINGS  → GET /api/listings?status=active
───────────────────────────────────────────────────────────────────*/
let activeSourceFilter = 'All';

async function renderListingsGrid(gridId) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  grid.innerHTML = '<div class="empty-grid">Loading listings…</div>';
  const user = getCurrentUser();
  let url = '/api/listings?status=active';
  if (activeSourceFilter !== 'All') url += `&source=${activeSourceFilter}`;
  const res = await api(url);
  if (!res.ok || !res.data || res.data.length === 0) {
    grid.innerHTML = '<div class="empty-grid">No listings available right now.</div>';
    return;
  }
  grid.innerHTML = res.data.map((l, i) => buildListingCard(l, i, user)).join('');
}

function buildListingCard(l, index, currentUser) {
  const isSold = l.status === 'sold' || Number(l.units_available_kwh) <= 0;
  const isOwn  = currentUser && l.seller_id === currentUser.user_id;
  const units  = Number(l.units_available_kwh || 0);
  const price  = Number(l.price_per_kwh || 0);
  const total  = (units * price).toFixed(2);
  const src    = l.source_type || 'Solar';
  return `
    <div class="listing-card" style="animation-delay:${index * 0.055}s">
      <div class="lc-top">
        <span class="lc-src src-${src}">${src}</span>
        <span class="lc-zone">${l.zone_code || '—'}</span>
      </div>
      <div class="lc-seller">
        <div class="lc-av">${initials(l.seller_name)}</div>
        <div>
          <div class="lc-name">${l.seller_name || 'Unknown'}</div>
          <div class="lc-id">ID: ${String(l.seller_id).slice(-6)}</div>
        </div>
      </div>
      <div class="lc-data">
        <div class="lc-datum"><div class="lc-datum-l">Units Available</div><div class="lc-datum-v">${units.toFixed(2)} kWh</div></div>
        <div class="lc-datum"><div class="lc-datum-l">Price / kWh</div><div class="lc-datum-v price">₹${price.toFixed(2)}</div></div>
      </div>
      <div class="lc-foot">
        <span class="lc-total">Total: ₹${total}</span>
        <button class="lc-buy" onclick="openBuyModal(${l.listing_id})" ${isSold || isOwn ? 'disabled' : ''}>
          ${isOwn ? 'Your Listing' : isSold ? 'Sold Out' : 'Buy'}
        </button>
      </div>
      ${isSold ? '<div class="sold-badge">SOLD OUT</div>' : ''}
    </div>`;
}

function filterListings(src, btn) {
  activeSourceFilter = src;
  document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  renderListingsGrid('listingsGrid');
}

async function renderMarket() { await renderListingsGrid('marketGrid'); }

/* ─────────────────────────────────────────────────────────────────
   SECTION 16: BUY MODAL  → GET /api/listings/<id>  then POST /api/orders
───────────────────────────────────────────────────────────────────*/
let _cachedListing = null;

async function openBuyModal(listingId) {
  const user = getCurrentUser();
  if (!user) return;
  const res = await api(`/api/listings/${listingId}`);
  if (!res.ok || !res.data) { showToast('Could not load listing details.', 'error'); return; }
  const l = res.data;
  _cachedListing = l;

  const units  = Number(l.units_available_kwh);
  const price  = Number(l.price_per_kwh);
  const gross  = units * price;
  const fee    = gross * PLATFORM_FEE;
  const total  = gross + fee;

  const walletRes = await api(`/api/wallet/${user.user_id}`);
  const balance   = walletRes.ok ? Number(walletRes.data.balance) : Number(user.wallet_balance || 0);
  const canAfford = balance >= total;

  document.getElementById('modalBuyBody').innerHTML = `
    <div class="modal-row"><span class="modal-row-l">Seller</span><span class="modal-row-v">${l.seller_name}</span></div>
    <div class="modal-row"><span class="modal-row-l">Source</span><span class="modal-row-v">${l.source_type || '—'}</span></div>
    <div class="modal-row"><span class="modal-row-l">Units</span><span class="modal-row-v">${units.toFixed(2)} kWh</span></div>
    <div class="modal-row"><span class="modal-row-l">Rate</span><span class="modal-row-v hi">₹${price.toFixed(2)} / kWh</span></div>
    <hr class="modal-divider"/>
    <div class="modal-row"><span class="modal-row-l">Gross Amount</span><span class="modal-row-v">${fmtRupee(gross)}</span></div>
    <div class="modal-row"><span class="modal-row-l">Platform Fee (2.5%)</span><span class="modal-row-v">${fmtRupee(fee)}</span></div>
    <div class="modal-row" style="background:${canAfford ? 'rgba(0,214,143,.05)' : 'rgba(240,80,110,.05)'}">
      <span class="modal-row-l">Total Payable</span><span class="modal-row-v g">${fmtRupee(total)}</span>
    </div>
    <div class="modal-row">
      <span class="modal-row-l">Your Balance</span>
      <span class="modal-row-v" style="color:${canAfford ? 'var(--green)' : 'var(--red)'}">
        ${fmtRupee(balance)} ${canAfford ? '' : '— Insufficient'}
      </span>
    </div>`;

  const btn = document.getElementById('modalBuyConfirm');
  btn.disabled = !canAfford;
  btn.onclick  = canAfford ? () => executePurchase(listingId) : null;
  openModal('modalBuy');
}

async function executePurchase(listingId) {
  const user = getCurrentUser();
  if (!user) return;
  const btn = document.getElementById('modalBuyConfirm');
  btn.textContent = 'Processing…'; btn.disabled = true;

  const res = await api('/api/orders', {
    method: 'POST',
    body: JSON.stringify({
      buyer_id: user.user_id,
      listing_id: listingId,
      units_requested_kwh: _cachedListing ? Number(_cachedListing.units_available_kwh) : 0,
    }),
  });
  btn.textContent = 'Confirm Buy'; btn.disabled = false;

  if (!res.ok) { showToast(res.message || 'Purchase failed.', 'error'); closeModal('modalBuy'); return; }
  closeModal('modalBuy');
  showToast(`Purchase successful! ${fmtRupee(res.data.amount_charged)} charged.`, 'success');
  incrementNotif();
  renderDashboard();
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 17: TRADE MODE TOGGLE
───────────────────────────────────────────────────────────────────*/
function setTradeMode(mode) {
  const isBuy = mode === 'buy';
  document.getElementById('buyForm').classList.toggle('active', isBuy);
  document.getElementById('sellForm').classList.toggle('active', !isBuy);
  document.getElementById('btnBuy').classList.toggle('active', isBuy);
  document.getElementById('btnSell').classList.toggle('active', !isBuy);
  document.getElementById('bsSlider').classList.toggle('right', !isBuy);
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 18: BUY REQUEST (open market match)
───────────────────────────────────────────────────────────────────*/
async function submitBuyRequest() {
  clearErr('buyUnitsErr'); clearErr('buyMaxPriceErr');
  const units    = parseFloat(document.getElementById('buyUnits').value);
  const maxPrice = parseFloat(document.getElementById('buyMaxPrice').value);
  let ok = true;
  if (!units || units <= 0)       { showErr('buyUnitsErr',    'Enter a valid unit amount.'); ok = false; }
  if (!maxPrice || maxPrice <= 0) { showErr('buyMaxPriceErr', 'Enter a valid max price.');   ok = false; }
  if (!ok) return;

  const user = getCurrentUser();
  const res  = await api('/api/listings?status=active');
  if (!res.ok || !res.data) { showToast('Could not fetch listings.', 'error'); return; }

  const match = res.data.find(l =>
    Number(l.price_per_kwh) <= maxPrice && Number(l.units_available_kwh) >= units
  );
  if (!match) {
    showToast(`No listing found at ≤ ₹${maxPrice}/kWh for ${units} kWh`, 'info'); return;
  }

  const orderRes = await api('/api/orders', {
    method: 'POST',
    body: JSON.stringify({ buyer_id: user.user_id, listing_id: match.listing_id, units_requested_kwh: units }),
  });
  if (!orderRes.ok) { showToast(orderRes.message || 'Order failed.', 'error'); return; }

  document.getElementById('buyUnits').value    = '';
  document.getElementById('buyMaxPrice').value = '';
  showToast(`Matched! Bought ${units} kWh for ${fmtRupee(orderRes.data.amount_charged)}`, 'success');
  incrementNotif();
  renderDashboard();
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 19: SELL LISTING  → POST /api/listings
───────────────────────────────────────────────────────────────────*/
function updateSellPreview() {
  const units = parseFloat(document.getElementById('sellUnits')?.value) || 0;
  const price = parseFloat(document.getElementById('sellPrice')?.value) || 0;
  const gross = units * price;
  const fee   = gross * PLATFORM_FEE;
  const net   = gross - fee;
  document.getElementById('spGross').textContent = gross > 0 ? fmtRupee(gross) : '—';
  document.getElementById('spFee').textContent   = fee   > 0 ? fmtRupee(fee)   : '—';
  document.getElementById('spNet').textContent   = net   > 0 ? fmtRupee(net)   : '—';
}

async function submitSellListing() {
  clearErr('sellUnitsErr'); clearErr('sellPriceErr');
  const units  = parseFloat(document.getElementById('sellUnits').value);
  const price  = parseFloat(document.getElementById('sellPrice').value);
  let ok = true;
  if (!units || units <= 0) { showErr('sellUnitsErr', 'Enter a valid unit amount.'); ok = false; }
  if (!price || price <= 0) { showErr('sellPriceErr', 'Enter a valid price.');       ok = false; }
  if (!ok) return;

  const user = getCurrentUser();

  // Fetch default zone & slot from DB
  const [zonesRes, slotsRes] = await Promise.all([api('/api/zones'), api('/api/zones/slots')]);
  const zoneId = zonesRes.ok && zonesRes.data?.length ? zonesRes.data[0].zone_id : 1;
  const slotId = slotsRes.ok && slotsRes.data?.length ? (slotsRes.data[1]?.slot_id || 2) : 2;

  const today   = new Date().toISOString().split('T')[0];
  const expires = new Date(Date.now() + 86400000).toISOString().slice(0, 19).replace('T', ' ');

  const res = await api('/api/listings', {
    method: 'POST',
    body: JSON.stringify({
      seller_id: user.user_id, zone_id: zoneId, slot_id: slotId,
      units_available_kwh: units, price_per_kwh: price,
      listing_date: today, expires_at: expires,
    }),
  });
  if (!res.ok) { showToast(res.message || 'Failed to publish listing.', 'error'); return; }

  document.getElementById('sellUnits').value = '';
  document.getElementById('sellPrice').value = '';
  document.getElementById('spGross').textContent = '—';
  document.getElementById('spFee').textContent   = '—';
  document.getElementById('spNet').textContent   = '—';

  showToast(`Listing published: ${units} kWh at ₹${price}/kWh`, 'success');
  renderDashboard();
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 20: TRANSACTIONS  → GET /api/transactions?user_id=
───────────────────────────────────────────────────────────────────*/
async function renderTransactions() {
  const tbody = document.getElementById('txBody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text3)">Loading…</td></tr>';
  const user = getCurrentUser();
  const res  = await api(`/api/transactions?user_id=${user.user_id}`);

  if (!res.ok || !res.data || res.data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text3)">No transactions yet.</td></tr>';
    return;
  }
  tbody.innerHTML = res.data.map(tx => {
    const isBuyer = tx.buyer_id === user.user_id;
    const type    = isBuyer ? 'Purchase' : 'Sale';
    const counter = isBuyer ? tx.seller_name : tx.buyer_name;
    const sClass  = { completed: 's-completed', pending: 's-pending', failed: 's-failed' }[tx.status] || 's-pending';
    const amount  = isBuyer
      ? Number(tx.amount || 0) + Number(tx.platform_fee || 0)
      : Number(tx.net_seller_amount || tx.amount || 0);
    return `
      <tr>
        <td>#${String(tx.transaction_id).padStart(6,'0')}</td>
        <td class="td-name">${type}</td>
        <td class="td-name">${counter}</td>
        <td>${Number(tx.units_kwh || 0).toFixed(2)}</td>
        <td style="color:var(--text);font-weight:600">${fmtRupee(amount)}</td>
        <td>—</td>
        <td><span class="status-badge ${sClass}">${tx.status}</span></td>
        <td>${fmtDate(tx.created_at)}</td>
      </tr>`;
  }).join('');
}

function exportCSV() {
  const rows = document.querySelectorAll('#txBody tr');
  if (!rows.length || rows[0].cells.length < 2) { showToast('No transactions to export', 'warning'); return; }
  const header = ['Ref','Type','Counterparty','Units (kWh)','Amount (₹)','Source','Status','Date'];
  const lines  = [header.join(',')];
  rows.forEach(r => lines.push(Array.from(r.cells).map(c => `"${c.textContent.trim()}"`).join(',')));
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = 'voltshare_transactions.csv';
  a.click();
  showToast('Transactions exported as CSV', 'info');
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 21: WALLET  → GET /api/wallet/<id> & /api/stats/user/<id>
───────────────────────────────────────────────────────────────────*/
async function renderWallet() {
  const user = getCurrentUser();
  if (!user) return;
  const [walletRes, statsRes, rechargeRes, txRes] = await Promise.all([
    api(`/api/wallet/${user.user_id}`),
    api(`/api/stats/user/${user.user_id}`),
    api(`/api/wallet/${user.user_id}/recharge-history`),
    api(`/api/transactions?user_id=${user.user_id}`),
  ]);
  if (walletRes.ok && walletRes.data) {
    const bal = walletRes.data.balance;
    document.getElementById('wcAmount').textContent  = fmtRupee(bal);
    document.getElementById('kpiWallet').textContent = fmtRupee(bal);
  }
  if (statsRes.ok && statsRes.data) {
    document.getElementById('wstatSpent').textContent  = fmtRupee(statsRes.data.total_spent);
    document.getElementById('wstatEarned').textContent = fmtRupee(statsRes.data.total_earnings);
  }
  document.getElementById('wstatCount').textContent = txRes.ok && txRes.data ? txRes.data.length : 0;
  renderRechargeHistory(rechargeRes.ok ? rechargeRes.data : []);
}

function renderRechargeHistory(recharges) {
  const list = document.getElementById('rechargeList');
  if (!recharges || recharges.length === 0) {
    list.innerHTML = '<div class="ri-empty">No recharge history yet.</div>'; return;
  }
  const icons = { upi: '📲', card: '💳', netbanking: '🏦' };
  list.innerHTML = recharges.map(r => `
    <div class="recharge-item">
      <div class="ri-icon ${r.status === 'success' ? 's' : 'f'}">${icons[r.payment_method] || '💰'}</div>
      <div class="ri-body">
        <div class="ri-method">${(r.payment_method || '').toUpperCase()}</div>
        <div class="ri-date">${fmtDate(r.initiated_at)} · Ref: ${r.gateway_reference || '—'}</div>
      </div>
      <div class="ri-right">
        <div class="ri-amount ${r.status === 'success' ? 'pos' : 'neg'}">
          ${r.status === 'success' ? '+' : '×'} ${fmtRupee(r.amount)}
        </div>
        <span class="status-badge ${r.status === 'success' ? 's-completed' : 's-failed'}">${r.status}</span>
      </div>
    </div>`).join('');
}

function openAddMoney() { document.getElementById('addMoneyAmount').value = ''; openModal('modalAddMoney'); }
function setAddMoney(amount) { document.getElementById('addMoneyAmount').value = amount; }

async function processAddMoney() {
  const amount = parseFloat(document.getElementById('addMoneyAmount').value);
  if (!amount || amount < 50)  { showToast('Minimum recharge is ₹50', 'error');     return; }
  if (amount > 50000)          { showToast('Maximum recharge is ₹50,000', 'error'); return; }
  const method = document.querySelector('input[name="method"]:checked')?.value || 'UPI';
  const user   = getCurrentUser();
  const btn    = document.querySelector('#modalAddMoney .btn-primary');
  if (btn) { btn.textContent = 'Processing…'; btn.disabled = true; }

  const res = await api(`/api/wallet/${user.user_id}/recharge`, {
    method: 'POST',
    body: JSON.stringify({ amount, payment_method: method.toLowerCase().replace(/\s/g, '') }),
  });
  if (btn) { btn.textContent = 'Add Money'; btn.disabled = false; }
  if (!res.ok) { showToast(res.message || 'Recharge failed.', 'error'); return; }
  closeModal('modalAddMoney');
  showToast(`${fmtRupee(amount)} added via ${method}`, 'success');
  renderWallet();
  renderDashboard();
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 22: MODAL & TOAST HELPERS
───────────────────────────────────────────────────────────────────*/
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
  backdrop.addEventListener('click', function(e) { if (e.target === this) this.classList.remove('open'); });
});

let toastTimeout = null;
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = `toast ${type} show`;
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => t.classList.remove('show'), 3600);
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 23: NOTIFICATION BADGE
───────────────────────────────────────────────────────────────────*/
function incrementNotif() {
  const badge = document.getElementById('notifBadge');
  badge.textContent = (parseInt(badge.textContent) || 0) + 1;
  badge.removeAttribute('data-zero');
}

document.getElementById('notifBtn').addEventListener('click', () => {
  document.getElementById('notifBadge').textContent = '0';
  document.getElementById('notifBadge').setAttribute('data-zero', 'true');
  showToast('All notifications cleared', 'info');
});

/* ─────────────────────────────────────────────────────────────────
   SECTION 24: SELL PREVIEW LIVE LISTENERS
───────────────────────────────────────────────────────────────────*/
document.addEventListener('DOMContentLoaded', () => {
  ['sellUnits', 'sellPrice'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updateSellPreview);
  });
});

/* ─────────────────────────────────────────────────────────────────
   SECTION 25: BOOT
───────────────────────────────────────────────────────────────────*/
window.addEventListener('DOMContentLoaded', () => {
  const existingUser = getCurrentUser();
  if (existingUser) { enterApp(); } else { initLanding(); }
});
