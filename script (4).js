/* ═══════════════════════════════════════════════════════════════════
   script.js — VoltShare P2P Energy Trading Platform
   Simulated backend using localStorage
   Pure vanilla JavaScript — beginner-friendly with full comments
═══════════════════════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────────────────────────
   SECTION 1: CONSTANTS & KEYS
   All localStorage keys defined in one place so they're easy to find
───────────────────────────────────────────────────────────────────*/
const KEYS = {
  USERS        : 'vs_users',          // Array of registered users
  SESSION      : 'vs_session',        // Currently logged-in user id
  LISTINGS     : 'vs_listings',       // Array of energy listings
  TRANSACTIONS : 'vs_transactions',   // Array of completed trades
  RECHARGES    : 'vs_recharges',      // Wallet recharge history
  NOTIFS       : 'vs_notifs',         // Notification count
};

const PLATFORM_FEE = 0.025;           // 2.5% fee on each sale
const STARTING_BALANCE = 5000;        // Every new user gets ₹5,000

/* ─────────────────────────────────────────────────────────────────
   SECTION 2: localStorage HELPERS
   Thin wrappers so we never repeat JSON.parse / JSON.stringify
───────────────────────────────────────────────────────────────────*/
const store = {
  get(key, fallback = null) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  remove(key) {
    localStorage.removeItem(key);
  }
};

/* ─────────────────────────────────────────────────────────────────
   SECTION 3: USER DATABASE HELPERS
───────────────────────────────────────────────────────────────────*/

/** Returns the array of all registered users */
function getUsers() { return store.get(KEYS.USERS, []); }

/** Saves updated users array back to localStorage */
function saveUsers(arr) { store.set(KEYS.USERS, arr); }

/** Find a user by their email address */
function findUserByEmail(email) {
  return getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
}

/** Find a user by their unique id */
function findUserById(id) {
  return getUsers().find(u => u.id === id);
}

/** Get the currently logged-in user object (or null) */
function getCurrentUser() {
  const id = store.get(KEYS.SESSION);
  return id ? findUserById(id) : null;
}

/** Update fields on the current user and persist */
function updateCurrentUser(updates) {
  const users = getUsers();
  const idx   = users.findIndex(u => u.id === store.get(KEYS.SESSION));
  if (idx === -1) return;
  users[idx] = { ...users[idx], ...updates };
  saveUsers(users);
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 4: LISTINGS DATABASE HELPERS
───────────────────────────────────────────────────────────────────*/

/** Returns all energy listings */
function getListings() { return store.get(KEYS.LISTINGS, []); }

/** Saves updated listings array */
function saveListings(arr) { store.set(KEYS.LISTINGS, arr); }

/** Add a new listing to the array */
function addListing(listing) {
  const listings = getListings();
  listings.unshift(listing);   // newest first
  saveListings(listings);
}

/** Mark a listing as sold */
function markListingSold(listingId) {
  const listings = getListings();
  const idx = listings.findIndex(l => l.id === listingId);
  if (idx !== -1) {
    listings[idx].status = 'sold';
    saveListings(listings);
  }
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 5: TRANSACTIONS DATABASE HELPERS
───────────────────────────────────────────────────────────────────*/

/** Returns all transactions */
function getTransactions() { return store.get(KEYS.TRANSACTIONS, []); }

/** Add a new transaction record */
function addTransaction(tx) {
  const txs = getTransactions();
  txs.unshift(tx);
  store.set(KEYS.TRANSACTIONS, txs);
}

/** Returns transactions relevant to the current user */
function getUserTransactions() {
  const user = getCurrentUser();
  if (!user) return [];
  return getTransactions().filter(
    t => t.buyerId === user.id || t.sellerId === user.id
  );
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 6: ID & DATE UTILITIES
───────────────────────────────────────────────────────────────────*/

/** Generate a short unique ID like "vs_a3f7" */
function genId(prefix = 'vs') {
  return prefix + '_' + Math.random().toString(36).slice(2, 8);
}

/** Return a nicely formatted date string */
function fmtDate(iso = new Date().toISOString()) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

/** Format a rupee amount */
function fmtRupee(n) {
  return '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 7: SEED DATA
   Pre-populate some listings so the marketplace isn't empty
───────────────────────────────────────────────────────────────────*/
function seedInitialData() {
  // Only seed if no listings exist yet
  if (getListings().length > 0) return;

  const sellers = [
    { name: 'Jordan Mercer',  initials: 'JM' },
    { name: 'Taylor Quinn',   initials: 'TQ' },
    { name: 'Casey Ashford',  initials: 'CA' },
    { name: 'Riley Stone',    initials: 'RS' },
    { name: 'Morgan Vance',   initials: 'MV' },
  ];

  const seeds = [
    { units: 10.5, price: 5.50, source: 'Solar',  zone: 'UDC-01' },
    { units: 25.0, price: 4.80, source: 'Wind',   zone: 'MNG-E1' },
    { units: 8.75, price: 5.00, source: 'Biogas', zone: 'UDC-01' },
    { units: 15.0, price: 6.20, source: 'Solar',  zone: 'CHN-02' },
    { units: 30.0, price: 3.90, source: 'Wind',   zone: 'MNG-E1' },
  ];

  const listings = seeds.map((s, i) => ({
    id:          genId('lst'),
    sellerId:    'seed_' + i,
    sellerName:  sellers[i].name,
    sellerInitials: sellers[i].initials,
    units:       s.units,
    price:       s.price,
    source:      s.source,
    zone:        s.zone,
    status:      'active',
    createdAt:   new Date(Date.now() - (seeds.length - i) * 3600000).toISOString(),
  }));

  saveListings(listings);
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 8: LANDING ANIMATION
───────────────────────────────────────────────────────────────────*/

function initLanding() {
  // Start the canvas energy animation
  runEnergyCanvas();

  // Animate the progress bar and auto-advance after ~2.8 seconds
  const fill    = document.getElementById('lpFill');
  const hint    = document.querySelector('.landing-hint');
  let progress  = 0;
  const steps   = [
    { pct: 30,  msg: 'Loading market data…' },
    { pct: 60,  msg: 'Syncing smart meters…' },
    { pct: 85,  msg: 'Connecting to grid…' },
    { pct: 100, msg: 'Ready.' },
  ];
  let stepIdx = 0;

  const interval = setInterval(() => {
    progress = Math.min(progress + 1.4, 100);
    fill.style.width = progress + '%';

    // Update hint text at each step
    if (stepIdx < steps.length && progress >= steps[stepIdx].pct) {
      hint.textContent = steps[stepIdx].msg;
      stepIdx++;
    }

    if (progress >= 100) {
      clearInterval(interval);
      // After a short pause, go to auth
      setTimeout(() => showLayer('auth'), 480);
    }
  }, 28);  // ~2.8 seconds total
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 9: CANVAS ENERGY ANIMATION
───────────────────────────────────────────────────────────────────*/
function runEnergyCanvas() {
  const canvas = document.getElementById('grid-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Resize canvas to fill screen
  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // ── Floating particles ──
  const PARTICLE_COUNT = 55;
  const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
    x:     Math.random() * window.innerWidth,
    y:     Math.random() * window.innerHeight,
    r:     Math.random() * 1.4 + 0.4,
    vx:    (Math.random() - 0.5) * 0.35,
    vy:    (Math.random() - 0.5) * 0.35,
    alpha: Math.random() * 0.5 + 0.2,
    col:   Math.random() > 0.5 ? '#00d68f' : '#00b4ff',
  }));

  // ── Streaking energy lines ──
  const STREAK_COUNT = 7;
  function mkStreak() {
    const fromLeft = Math.random() > 0.5;
    return {
      x:       fromLeft ? 0 : canvas.width,
      y:       Math.random() * canvas.height,
      len:     Math.random() * 160 + 70,
      speed:   (Math.random() * 1.4 + 0.5) * (fromLeft ? 1 : -1),
      w:       Math.random() * 1.4 + 0.4,
      alpha:   0,
      life:    Math.floor(Math.random() * 100),
      maxLife: Math.floor(Math.random() * 100 + 80),
      col:     Math.random() > 0.5 ? '#00d68f' : '#00b4ff',
    };
  }
  const streaks = Array.from({ length: STREAK_COUNT }, mkStreak);

  // ── Expanding pulse rings from center ──
  const pulses = [];
  let pulseTimer = 0;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw particles + connection lines
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;

      // Connection lines between nearby particles
      particles.forEach(q => {
        const d = Math.hypot(p.x - q.x, p.y - q.y);
        if (d < 110) {
          ctx.globalAlpha = (1 - d / 110) * 0.1;
          ctx.strokeStyle = p.col;
          ctx.lineWidth   = 0.4;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.stroke();
        }
      });

      // Particle dot
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle   = p.col;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw streaks
    streaks.forEach(s => {
      s.x    += s.speed;
      s.life++;
      const half = s.maxLife / 2;
      s.alpha = s.life < half
        ? (s.life / half) * 0.6
        : ((s.maxLife - s.life) / half) * 0.6;

      if (s.life >= s.maxLife) Object.assign(s, mkStreak(), { life: 0 });

      const dir  = Math.sign(s.speed);
      const grad = ctx.createLinearGradient(s.x - s.len * dir, s.y, s.x, s.y);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(1, s.col);

      ctx.globalAlpha  = s.alpha;
      ctx.strokeStyle  = grad;
      ctx.lineWidth    = s.w;
      ctx.shadowBlur   = 7;
      ctx.shadowColor  = s.col;
      ctx.beginPath();
      ctx.moveTo(s.x - s.len * dir, s.y);
      ctx.lineTo(s.x, s.y);
      ctx.stroke();
      ctx.shadowBlur = 0;
    });

    // Spawn a pulse every 90 frames
    pulseTimer++;
    if (pulseTimer % 90 === 0) {
      pulses.push({
        x:     canvas.width / 2,
        y:     canvas.height / 2,
        r:     0,
        alpha: 0.35,
        col:   Math.random() > 0.5 ? '#00d68f' : '#00b4ff',
      });
    }

    // Draw pulses
    for (let i = pulses.length - 1; i >= 0; i--) {
      const pulse = pulses[i];
      pulse.r    += 2.5;
      pulse.alpha -= 0.005;
      if (pulse.alpha <= 0) { pulses.splice(i, 1); continue; }
      ctx.globalAlpha = pulse.alpha;
      ctx.strokeStyle = pulse.col;
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.arc(pulse.x, pulse.y, pulse.r, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }

  draw();
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 10: LAYER / SCREEN NAVIGATION
───────────────────────────────────────────────────────────────────*/

/** Switch which major screen ("landing", "auth", "app") is visible */
function showLayer(id) {
  document.querySelectorAll('.layer').forEach(el => {
    el.classList.remove('active');
  });
  const target = document.getElementById(id);
  if (target) target.classList.add('active');
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 11: AUTH — TAB SWITCHING
───────────────────────────────────────────────────────────────────*/

function switchTab(tab) {
  const isLogin = tab === 'login';

  document.getElementById('formLogin').classList.toggle('active', isLogin);
  document.getElementById('formRegister').classList.toggle('active', !isLogin);

  document.getElementById('tabLogin').classList.toggle('active', isLogin);
  document.getElementById('tabRegister').classList.toggle('active', !isLogin);

  // Move the sliding ink indicator
  document.getElementById('tabInk').classList.toggle('right', !isLogin);

  // Clear all previous error messages
  clearAllErrors();
}

/** Show eye / hide eye toggle for password inputs */
function toggleEye(inputId, btn) {
  const input = document.getElementById(inputId);
  const isText = input.type === 'text';
  input.type = isText ? 'password' : 'text';
  btn.style.color = isText ? '' : 'var(--green)';
}

/** Live password strength meter */
function updateStrength(val) {
  const fill  = document.getElementById('strengthFill');
  const label = document.getElementById('strengthLabel');

  // Score 0–4 based on criteria
  let score = 0;
  if (val.length >= 8)             score++;
  if (/[A-Z]/.test(val))          score++;
  if (/[0-9]/.test(val))          score++;
  if (/[^A-Za-z0-9]/.test(val))  score++;

  const pct    = ['0%',   '25%',    '50%',   '75%',    '100%'];
  const colors = ['',     '#f0506e','#f5a623','#00b4ff', '#00d68f'];
  const labels = ['—',    'Weak',   'Fair',  'Good',    'Strong'];

  fill.style.width      = pct[score];
  fill.style.background = colors[score];
  label.textContent     = labels[score];
  label.style.color     = colors[score] || 'var(--text3)';
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 12: VALIDATION HELPERS
───────────────────────────────────────────────────────────────────*/

function showErr(id, msg) { document.getElementById(id).textContent = msg; }
function clearErr(id)     { document.getElementById(id).textContent = ''; }

function clearAllErrors() {
  ['loginEmailErr','loginPassErr','regNameErr','regEmailErr','regPassErr',
   'buyUnitsErr','buyMaxPriceErr','sellUnitsErr','sellPriceErr']
    .forEach(clearErr);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 13: LOGIN HANDLER
───────────────────────────────────────────────────────────────────*/

function handleLogin(e) {
  e.preventDefault();
  clearAllErrors();

  const email = document.getElementById('loginEmail').value.trim();
  const pass  = document.getElementById('loginPass').value;
  let   ok    = true;

  if (!isValidEmail(email))  { showErr('loginEmailErr', 'Please enter a valid email.'); ok = false; }
  if (pass.length < 6)       { showErr('loginPassErr',  'Password must be at least 6 characters.'); ok = false; }
  if (!ok) return;

  const user = findUserByEmail(email);
  if (!user)          { showErr('loginEmailErr', 'No account found with this email.'); return; }
  if (user.password !== pass) { showErr('loginPassErr',  'Incorrect password.'); return; }

  // Store session id and enter app
  store.set(KEYS.SESSION, user.id);
  enterApp();
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 14: REGISTER HANDLER
───────────────────────────────────────────────────────────────────*/

function handleRegister(e) {
  e.preventDefault();
  clearAllErrors();

  const name  = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const role  = document.getElementById('regRole').value;
  const pass  = document.getElementById('regPass').value;
  let   ok    = true;

  if (name.length < 2)       { showErr('regNameErr',  'Name must be at least 2 characters.'); ok = false; }
  if (!isValidEmail(email))  { showErr('regEmailErr', 'Please enter a valid email.'); ok = false; }
  if (pass.length < 8)       { showErr('regPassErr',  'Password must be at least 8 characters.'); ok = false; }
  if (!ok) return;

  if (findUserByEmail(email)) { showErr('regEmailErr', 'An account with this email already exists.'); return; }

  // Build user object — password stored in plain text (fine for a demo project)
  const user = {
    id:        genId('usr'),
    name,
    email,
    role,
    password,          // NOTE: In a real app, you'd hash this
    password:  pass,   // overwrite (fix hoisting collision)
    balance:   STARTING_BALANCE,
    createdAt: new Date().toISOString(),
  };

  const users = getUsers();
  users.push(user);
  saveUsers(users);

  store.set(KEYS.SESSION, user.id);
  showToast(`Welcome to VoltShare, ${name.split(' ')[0]}!`, 'success');
  enterApp();
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 15: ENTER APP & LOGOUT
───────────────────────────────────────────────────────────────────*/

function enterApp() {
  const user = getCurrentUser();
  if (!user) { showLayer('auth'); return; }

  // Populate sidebar user info
  const firstName = user.name.split(' ')[0];
  const initials  = user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  document.getElementById('suAvatar').textContent   = initials;
  document.getElementById('suName').textContent     = user.name;
  document.getElementById('suRole').textContent     = capitalize(user.role);
  document.getElementById('topbarName').textContent = firstName;
  document.getElementById('wcId').textContent       = user.id.slice(-4).toUpperCase();

  // Seed marketplace data then render everything
  seedInitialData();
  showLayer('app');
  navigateTo('dashboard');

  showToast(`Signed in as ${user.name}`, 'success');
}

function logout() {
  store.remove(KEYS.SESSION);
  showLayer('auth');
  switchTab('login');
  showToast('Signed out successfully', 'info');
}

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 16: IN-APP NAVIGATION
───────────────────────────────────────────────────────────────────*/

const pageTitles = {
  dashboard:    { title: 'Dashboard',       sub: 'Your energy overview' },
  market:       { title: 'Marketplace',     sub: 'Browse all available listings' },
  transactions: { title: 'Transactions',    sub: 'Your complete trade history' },
  wallet:       { title: 'Wallet',          sub: 'Balance, payments & history' },
};

function navigateTo(pageId) {
  // Update active nav link
  document.querySelectorAll('.nav-link').forEach(el => {
    el.classList.toggle('active', el.dataset.page === pageId);
  });

  // Show correct page, hide others
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + pageId).classList.add('active');

  // Update topbar
  const info = pageTitles[pageId];
  if (info) {
    document.getElementById('topbarTitle').textContent = info.title;
    document.getElementById('topbarSub').textContent   = info.sub;
  }

  // Render the page content
  if (pageId === 'dashboard')    renderDashboard();
  if (pageId === 'market')       renderMarket();
  if (pageId === 'transactions') renderTransactions();
  if (pageId === 'wallet')       renderWallet();
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 17: DASHBOARD RENDER
───────────────────────────────────────────────────────────────────*/

function renderDashboard() {
  updateKPIs();
  renderListingsGrid('listingsGrid');
  updateSellPreview();
}

/** Update the 4 KPI cards at the top */
function updateKPIs() {
  const user = getCurrentUser();
  if (!user) return;

  const txs = getUserTransactions();

  // Energy bought: sum of kWh where this user was the buyer
  const bought = txs
    .filter(t => t.buyerId === user.id && t.status === 'completed')
    .reduce((s, t) => s + t.units, 0);

  // Energy sold: sum of kWh where this user was the seller
  const sold = txs
    .filter(t => t.sellerId === user.id && t.status === 'completed')
    .reduce((s, t) => s + t.units, 0);

  // Active listings by this user
  const activeListings = getListings().filter(
    l => l.sellerId === user.id && l.status === 'active'
  ).length;

  document.getElementById('kpiBought').textContent  = bought.toFixed(2) + ' kWh';
  document.getElementById('kpiSold').textContent    = sold.toFixed(2) + ' kWh';
  document.getElementById('kpiWallet').textContent  = fmtRupee(user.balance);
  document.getElementById('kpiListings').textContent = activeListings;
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 18: LISTINGS RENDER
───────────────────────────────────────────────────────────────────*/

let activeSourceFilter = 'All';   // Which source filter is active

/** Render energy listing cards into a target grid element */
function renderListingsGrid(gridId) {
  const grid    = document.getElementById(gridId);
  const user    = getCurrentUser();
  const all     = getListings();

  // Filter by active source
  const filtered = all.filter(l => {
    const srcMatch = activeSourceFilter === 'All' || l.source === activeSourceFilter;
    return srcMatch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = '<div class="empty-grid">No listings available right now.</div>';
    return;
  }

  grid.innerHTML = filtered.map((l, i) => buildListingCard(l, i, user)).join('');
}

/** Build the HTML for one listing card */
function buildListingCard(l, index, currentUser) {
  const isSold   = l.status === 'sold' || l.units <= 0;
  const isOwn    = currentUser && l.sellerId === currentUser.id;
  const total    = (l.units * l.price).toFixed(2);

  return `
    <div class="listing-card" style="animation-delay:${index * 0.055}s">
      <div class="lc-top">
        <span class="lc-src src-${l.source}">${l.source}</span>
        <span class="lc-zone">${l.zone}</span>
      </div>
      <div class="lc-seller">
        <div class="lc-av">${l.sellerInitials || l.sellerName.slice(0,2).toUpperCase()}</div>
        <div>
          <div class="lc-name">${l.sellerName}</div>
          <div class="lc-id">ID: ${l.sellerId.slice(-6)}</div>
        </div>
      </div>
      <div class="lc-data">
        <div class="lc-datum">
          <div class="lc-datum-l">Units Available</div>
          <div class="lc-datum-v">${Number(l.units).toFixed(2)} kWh</div>
        </div>
        <div class="lc-datum">
          <div class="lc-datum-l">Price / kWh</div>
          <div class="lc-datum-v price">₹${Number(l.price).toFixed(2)}</div>
        </div>
      </div>
      <div class="lc-foot">
        <span class="lc-total">Total: ₹${total}</span>
        <button class="lc-buy"
          onclick="openBuyModal('${l.id}')"
          ${isSold || isOwn ? 'disabled' : ''}>
          ${isOwn ? 'Your Listing' : isSold ? 'Sold Out' : 'Buy'}
        </button>
      </div>
      ${isSold ? '<div class="sold-badge">SOLD OUT</div>' : ''}
    </div>
  `;
}

/** Filter chips */
function filterListings(src, btn) {
  activeSourceFilter = src;
  document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  renderListingsGrid('listingsGrid');
}

/** Marketplace page — renders all listings */
function renderMarket() {
  renderListingsGrid('marketGrid');
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 19: BUY MODE — FORM & MODAL
───────────────────────────────────────────────────────────────────*/

/** Toggle between Buy and Sell forms */
function setTradeMode(mode) {
  const buyForm  = document.getElementById('buyForm');
  const sellForm = document.getElementById('sellForm');
  const btnBuy   = document.getElementById('btnBuy');
  const btnSell  = document.getElementById('btnSell');
  const slider   = document.getElementById('bsSlider');

  if (mode === 'buy') {
    buyForm.classList.add('active');
    sellForm.classList.remove('active');
    btnBuy.classList.add('active');
    btnSell.classList.remove('active');
    slider.classList.remove('right');
  } else {
    sellForm.classList.add('active');
    buyForm.classList.remove('active');
    btnSell.classList.add('active');
    btnBuy.classList.remove('active');
    slider.classList.add('right');
  }
}

/** Open the "Buy" confirmation modal for a given listing id */
function openBuyModal(listingId) {
  const listing = getListings().find(l => l.id === listingId);
  const user    = getCurrentUser();
  if (!listing || !user) return;

  const gross     = listing.units * listing.price;
  const fee       = gross * PLATFORM_FEE;
  const total     = gross + fee;
  const canAfford = user.balance >= total;

  document.getElementById('modalBuyBody').innerHTML = `
    <div class="modal-row">
      <span class="modal-row-l">Seller</span>
      <span class="modal-row-v">${listing.sellerName}</span>
    </div>
    <div class="modal-row">
      <span class="modal-row-l">Source</span>
      <span class="modal-row-v">${listing.source}</span>
    </div>
    <div class="modal-row">
      <span class="modal-row-l">Units</span>
      <span class="modal-row-v">${Number(listing.units).toFixed(2)} kWh</span>
    </div>
    <div class="modal-row">
      <span class="modal-row-l">Rate</span>
      <span class="modal-row-v hi">₹${Number(listing.price).toFixed(2)} / kWh</span>
    </div>
    <hr class="modal-divider"/>
    <div class="modal-row">
      <span class="modal-row-l">Gross Amount</span>
      <span class="modal-row-v">${fmtRupee(gross)}</span>
    </div>
    <div class="modal-row">
      <span class="modal-row-l">Platform Fee (2.5%)</span>
      <span class="modal-row-v">${fmtRupee(fee)}</span>
    </div>
    <div class="modal-row" style="background:${canAfford ? 'rgba(0,214,143,.05)' : 'rgba(240,80,110,.05)'}">
      <span class="modal-row-l">Total Payable</span>
      <span class="modal-row-v g">${fmtRupee(total)}</span>
    </div>
    <div class="modal-row" style="background:${canAfford ? '' : 'rgba(240,80,110,.05)'}">
      <span class="modal-row-l">Your Balance</span>
      <span class="modal-row-v" style="color:${canAfford ? 'var(--green)' : 'var(--red)'}">
        ${fmtRupee(user.balance)} ${canAfford ? '' : '— Insufficient'}
      </span>
    </div>
  `;

  const btn = document.getElementById('modalBuyConfirm');
  btn.disabled = !canAfford;
  btn.onclick  = canAfford ? () => executePurchase(listingId, total, fee, listing) : null;

  openModal('modalBuy');
}

/** Actually perform the purchase — deduct balance, record transaction */
function executePurchase(listingId, total, fee, listing) {
  const user = getCurrentUser();
  if (!user) return;

  // 1. Deduct buyer's balance
  updateCurrentUser({ balance: user.balance - total });

  // 2. Mark listing as sold
  markListingSold(listingId);

  // 3. Record transaction
  addTransaction({
    id:          genId('tx'),
    buyerId:     user.id,
    buyerName:   user.name,
    sellerId:    listing.sellerId,
    sellerName:  listing.sellerName,
    units:       listing.units,
    pricePerUnit:listing.price,
    gross:       listing.units * listing.price,
    fee:         fee,
    total:       total,
    source:      listing.source,
    status:      'completed',
    createdAt:   new Date().toISOString(),
    type:        'purchase',
  });

  // 4. Increment notification badge
  incrementNotif();

  closeModal('modalBuy');
  showToast(`Purchased ${Number(listing.units).toFixed(2)} kWh for ${fmtRupee(total)}`, 'success');
  renderDashboard();
  renderTransactions();
  renderWallet();
}

/** Submit a "Buy Request" (recorded as pending transaction) */
function submitBuyRequest() {
  clearErr('buyUnitsErr');
  clearErr('buyMaxPriceErr');

  const units    = parseFloat(document.getElementById('buyUnits').value);
  const maxPrice = parseFloat(document.getElementById('buyMaxPrice').value);
  let   ok       = true;

  if (!units || units <= 0)        { showErr('buyUnitsErr',    'Enter a valid unit amount.'); ok = false; }
  if (!maxPrice || maxPrice <= 0)  { showErr('buyMaxPriceErr', 'Enter a valid max price.'); ok = false; }
  if (!ok) return;

  const user = getCurrentUser();
  addTransaction({
    id:           genId('tx'),
    buyerId:      user.id,
    buyerName:    user.name,
    sellerId:     '—',
    sellerName:   'Open Market',
    units:        units,
    pricePerUnit: maxPrice,
    gross:        units * maxPrice,
    fee:          0,
    total:        units * maxPrice,
    source:       'Open',
    status:       'pending',
    createdAt:    new Date().toISOString(),
    type:         'buy-request',
  });

  document.getElementById('buyUnits').value    = '';
  document.getElementById('buyMaxPrice').value = '';

  showToast(`Buy request for ${units} kWh at max ₹${maxPrice}/kWh submitted!`, 'success');
  incrementNotif();
  renderTransactions();
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 20: SELL MODE — FORM
───────────────────────────────────────────────────────────────────*/

/** Live revenue preview for the sell form */
function updateSellPreview() {
  const units  = parseFloat(document.getElementById('sellUnits')?.value) || 0;
  const price  = parseFloat(document.getElementById('sellPrice')?.value) || 0;

  const gross  = units * price;
  const fee    = gross * PLATFORM_FEE;
  const net    = gross - fee;

  document.getElementById('spGross').textContent = gross > 0 ? fmtRupee(gross) : '—';
  document.getElementById('spFee').textContent   = fee   > 0 ? fmtRupee(fee)   : '—';
  document.getElementById('spNet').textContent   = net   > 0 ? fmtRupee(net)   : '—';
}

// Attach live update to sell inputs
document.addEventListener('DOMContentLoaded', () => {
  ['sellUnits', 'sellPrice'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updateSellPreview);
  });
});

/** Submit a new energy listing */
function submitSellListing() {
  clearErr('sellUnitsErr');
  clearErr('sellPriceErr');

  const units  = parseFloat(document.getElementById('sellUnits').value);
  const price  = parseFloat(document.getElementById('sellPrice').value);
  const source = document.getElementById('sellSource').value;
  let   ok     = true;

  if (!units || units <= 0)   { showErr('sellUnitsErr', 'Enter a valid unit amount.'); ok = false; }
  if (!price || price <= 0)   { showErr('sellPriceErr', 'Enter a valid price.'); ok = false; }
  if (!ok) return;

  const user = getCurrentUser();

  const listing = {
    id:             genId('lst'),
    sellerId:       user.id,
    sellerName:     user.name,
    sellerInitials: user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
    units,
    price,
    source,
    zone:           'UDC-01',   // Default zone for the demo
    status:         'active',
    createdAt:      new Date().toISOString(),
  };

  addListing(listing);

  // Clear form
  document.getElementById('sellUnits').value  = '';
  document.getElementById('sellPrice').value  = '';
  document.getElementById('spGross').textContent = '—';
  document.getElementById('spFee').textContent   = '—';
  document.getElementById('spNet').textContent   = '—';

  showToast(`Listing published: ${units} kWh at ₹${price}/kWh`, 'success');
  renderDashboard();
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 21: TRANSACTIONS PAGE
───────────────────────────────────────────────────────────────────*/

function renderTransactions() {
  const tbody = document.getElementById('txBody');
  if (!tbody) return;

  const user = getCurrentUser();
  const txs  = getUserTransactions();

  if (txs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text3)">No transactions yet.</td></tr>';
    return;
  }

  tbody.innerHTML = txs.map(tx => {
    const isBuyer = tx.buyerId === user.id;
    const type    = isBuyer ? 'Purchase' : 'Sale';
    const counter = isBuyer ? tx.sellerName : tx.buyerName;
    const sClass  = { completed: 's-completed', pending: 's-pending', failed: 's-failed' }[tx.status] || 's-pending';

    return `
      <tr>
        <td>#${tx.id.slice(-6).toUpperCase()}</td>
        <td class="td-name">${type}</td>
        <td class="td-name">${counter}</td>
        <td>${Number(tx.units).toFixed(2)}</td>
        <td style="color:var(--text);font-weight:600">${fmtRupee(tx.total)}</td>
        <td>${tx.source}</td>
        <td><span class="status-badge ${sClass}">${tx.status}</span></td>
        <td>${fmtDate(tx.createdAt)}</td>
      </tr>
    `;
  }).join('');
}

/** Export transactions to CSV file */
function exportCSV() {
  const txs = getUserTransactions();
  if (txs.length === 0) { showToast('No transactions to export', 'warning'); return; }

  const header = ['Ref', 'Type', 'Counterparty', 'Units (kWh)', 'Amount (₹)', 'Source', 'Status', 'Date'];
  const user   = getCurrentUser();

  const rows = txs.map(tx => {
    const isBuyer = tx.buyerId === user.id;
    return [
      tx.id.slice(-6).toUpperCase(),
      isBuyer ? 'Purchase' : 'Sale',
      isBuyer ? tx.sellerName : tx.buyerName,
      Number(tx.units).toFixed(2),
      Number(tx.total).toFixed(2),
      tx.source,
      tx.status,
      fmtDate(tx.createdAt)
    ].join(',');
  });

  const csv  = [header.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = 'voltshare_transactions.csv';
  a.click();

  showToast('Transactions exported as CSV', 'info');
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 22: WALLET PAGE
───────────────────────────────────────────────────────────────────*/

function renderWallet() {
  const user = getCurrentUser();
  if (!user) return;

  // Update balance display
  document.getElementById('wcAmount').textContent = fmtRupee(user.balance);
  document.getElementById('kpiWallet').textContent = fmtRupee(user.balance);

  // Calculate spent / earned from transactions
  const txs    = getUserTransactions();
  const spent  = txs
    .filter(t => t.buyerId  === user.id && t.status === 'completed')
    .reduce((s, t) => s + t.total, 0);
  const earned = txs
    .filter(t => t.sellerId === user.id && t.status === 'completed')
    .reduce((s, t) => s + (t.gross - t.fee), 0);

  document.getElementById('wstatSpent').textContent  = fmtRupee(spent);
  document.getElementById('wstatEarned').textContent = fmtRupee(earned);
  document.getElementById('wstatCount').textContent  = txs.length;

  // Render recharge history
  renderRechargeHistory();
}

function renderRechargeHistory() {
  const list      = document.getElementById('rechargeList');
  const recharges = store.get(KEYS.RECHARGES, []);
  const userId    = store.get(KEYS.SESSION);

  const myRecharges = recharges.filter(r => r.userId === userId).slice(0, 20);

  if (myRecharges.length === 0) {
    list.innerHTML = '<div class="ri-empty">No recharge history yet.</div>';
    return;
  }

  const icons = { UPI: '📲', Card: '💳', 'Net Banking': '🏦' };

  list.innerHTML = myRecharges.map(r => `
    <div class="recharge-item">
      <div class="ri-icon ${r.status === 'success' ? 's' : 'f'}">${icons[r.method] || '💰'}</div>
      <div class="ri-body">
        <div class="ri-method">${r.method}</div>
        <div class="ri-date">${fmtDate(r.createdAt)} · Ref: ${r.ref}</div>
      </div>
      <div class="ri-right">
        <div class="ri-amount ${r.status === 'success' ? 'pos' : 'neg'}">
          ${r.status === 'success' ? '+' : '×'} ${fmtRupee(r.amount)}
        </div>
        <span class="status-badge ${r.status === 'success' ? 's-completed' : 's-failed'}">${r.status}</span>
      </div>
    </div>
  `).join('');
}

/** Open the Add Money modal */
function openAddMoney() {
  document.getElementById('addMoneyAmount').value = '';
  openModal('modalAddMoney');
}

function setAddMoney(amount) {
  document.getElementById('addMoneyAmount').value = amount;
}

/** Process a wallet top-up */
function processAddMoney() {
  const amount = parseFloat(document.getElementById('addMoneyAmount').value);
  if (!amount || amount < 50)    { showToast('Minimum recharge is ₹50', 'error'); return; }
  if (amount > 50000)            { showToast('Maximum recharge is ₹50,000', 'error'); return; }

  const method  = document.querySelector('input[name="method"]:checked')?.value || 'UPI';
  const user    = getCurrentUser();

  // 1. Add to user balance
  updateCurrentUser({ balance: user.balance + amount });

  // 2. Record recharge log
  const recharges = store.get(KEYS.RECHARGES, []);
  recharges.unshift({
    id:        genId('rch'),
    userId:    user.id,
    amount,
    method,
    ref:       genId('REF').toUpperCase(),
    status:    'success',
    createdAt: new Date().toISOString(),
  });
  store.set(KEYS.RECHARGES, recharges);

  closeModal('modalAddMoney');
  showToast(`${fmtRupee(amount)} added via ${method}`, 'success');
  renderWallet();
  updateKPIs();
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 23: MODAL & TOAST HELPERS
───────────────────────────────────────────────────────────────────*/

function openModal(id) {
  document.getElementById(id).classList.add('open');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

// Close modals by clicking outside the modal box
document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
  backdrop.addEventListener('click', function (e) {
    if (e.target === this) this.classList.remove('open');
  });
});

let toastTimeout = null;
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className   = `toast ${type} show`;
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => t.classList.remove('show'), 3600);
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 24: NOTIFICATION BADGE
───────────────────────────────────────────────────────────────────*/

function incrementNotif() {
  const count = (store.get(KEYS.NOTIFS, 0) || 0) + 1;
  store.set(KEYS.NOTIFS, count);
  const badge = document.getElementById('notifBadge');
  badge.textContent = count;
  badge.removeAttribute('data-zero');
}

document.getElementById('notifBtn').addEventListener('click', () => {
  store.set(KEYS.NOTIFS, 0);
  document.getElementById('notifBadge').setAttribute('data-zero', 'true');
  showToast('All notifications cleared', 'info');
});

/* ─────────────────────────────────────────────────────────────────
   SECTION 25: BOOT — Check session and decide which screen to show
───────────────────────────────────────────────────────────────────*/
window.addEventListener('DOMContentLoaded', () => {
  const existingUser = getCurrentUser();

  if (existingUser) {
    // Already logged in — skip landing and auth
    seedInitialData();
    enterApp();
  } else {
    // Show landing animation, then auto-advance to auth
    initLanding();
  }

  // Restore notification badge if any pending
  const notifCount = store.get(KEYS.NOTIFS, 0);
  if (notifCount > 0) {
    const badge = document.getElementById('notifBadge');
    badge.textContent = notifCount;
  }
});
