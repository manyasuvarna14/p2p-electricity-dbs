/* ═══════════════════════════════════════════════════════════
   script.js — VoltShare P2P Energy Trading Platform
   Pure vanilla JavaScript — no frameworks
   Well-commented for student readability
═══════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════════════════
   1. LANDING PAGE — Energy Canvas Animation
════════════════════════════════════════════════════ */
function initEnergyCanvas() {
  const canvas = document.getElementById('energyCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Resize canvas to fill screen
  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // -- Particles (small glowing dots) --
  const particles = [];
  const PARTICLE_COUNT = 60;

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push({
      x:    Math.random() * window.innerWidth,
      y:    Math.random() * window.innerHeight,
      r:    Math.random() * 1.5 + 0.5,
      vx:   (Math.random() - 0.5) * 0.4,
      vy:   (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.6 + 0.2,
      color: Math.random() > 0.5 ? '#10d9a0' : '#0ea5e9',
    });
  }

  // -- Energy Lines (flowing arcs across the screen) --
  const lines = [];
  const LINE_COUNT = 8;

  function makeEnergyLine() {
    const startX = Math.random() < 0.5 ? 0 : window.innerWidth;
    return {
      x:      startX,
      y:      Math.random() * window.innerHeight,
      len:    Math.random() * 180 + 80,
      speed:  (Math.random() * 1.5 + 0.5) * (startX === 0 ? 1 : -1),
      width:  Math.random() * 1.5 + 0.5,
      alpha:  0,
      life:   0,
      maxLife:Math.random() * 120 + 80,
      color:  Math.random() > 0.5 ? '#10d9a0' : '#0ea5e9',
    };
  }

  for (let i = 0; i < LINE_COUNT; i++) {
    const l = makeEnergyLine();
    l.life = Math.random() * l.maxLife; // stagger start
    lines.push(l);
  }

  // -- Pulses (expanding rings from center) --
  const pulses = [];

  function spawnPulse() {
    pulses.push({
      x:     window.innerWidth / 2,
      y:     window.innerHeight / 2,
      r:     0,
      alpha: 0.4,
      color: Math.random() > 0.5 ? '#10d9a0' : '#0ea5e9',
    });
  }

  // Spawn a pulse every 2.5 seconds
  setInterval(spawnPulse, 2500);
  spawnPulse(); // immediate first pulse

  // -- Main draw loop --
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw particles
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;

      // Wrap around edges
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;

      // Draw connecting lines between nearby particles
      particles.forEach(p2 => {
        const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
        if (dist < 120) {
          ctx.beginPath();
          ctx.strokeStyle = p.color;
          ctx.globalAlpha = (1 - dist / 120) * 0.12;
          ctx.lineWidth = 0.5;
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      });

      // Draw dot
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw energy lines
    lines.forEach(l => {
      l.life++;
      l.x += l.speed;

      // Fade in / out
      const halfLife = l.maxLife / 2;
      if (l.life < halfLife) {
        l.alpha = l.life / halfLife * 0.7;
      } else {
        l.alpha = (1 - (l.life - halfLife) / halfLife) * 0.7;
      }

      if (l.life >= l.maxLife) {
        // Reset line
        Object.assign(l, makeEnergyLine());
        l.life = 0;
      }

      // Draw glowing line
      const grad = ctx.createLinearGradient(l.x - l.len * Math.sign(l.speed), l.y, l.x, l.y);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(1, l.color);

      ctx.globalAlpha = l.alpha;
      ctx.strokeStyle = grad;
      ctx.lineWidth = l.width;
      ctx.shadowBlur = 8;
      ctx.shadowColor = l.color;
      ctx.beginPath();
      ctx.moveTo(l.x - l.len * Math.sign(l.speed), l.y);
      ctx.lineTo(l.x, l.y);
      ctx.stroke();
      ctx.shadowBlur = 0;
    });

    // Draw expanding pulses
    pulses.forEach((p, i) => {
      p.r    += 2;
      p.alpha -= 0.004;

      if (p.alpha <= 0) {
        pulses.splice(i, 1);
        return;
      }

      ctx.globalAlpha = p.alpha;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.stroke();
    });

    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }

  draw();
}

// Start canvas when page loads
document.addEventListener('DOMContentLoaded', initEnergyCanvas);

/* ════════════════════════════════════════════════════
   2. SCREEN NAVIGATION (Landing → Auth → App)
════════════════════════════════════════════════════ */

// Switch to a named screen with a smooth fade
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
    // After transition, move off-screen so it doesn't block
    s.style.position = 'fixed';
    s.style.pointerEvents = 'none';
  });
  const target = document.getElementById(id);
  target.style.position = 'relative';
  target.style.pointerEvents = 'all';
  target.classList.add('active');
}

// CTA button on landing page
document.getElementById('enterBtn').addEventListener('click', () => {
  showScreen('auth-screen');
});

/* ════════════════════════════════════════════════════
   3. AUTH — Login / Signup Tab Toggle
════════════════════════════════════════════════════ */

// Toggle between Login and Signup forms
function showAuthTab(tab) {
  const loginForm   = document.getElementById('loginForm');
  const signupForm  = document.getElementById('signupForm');
  const loginTabBtn = document.getElementById('loginTabBtn');
  const signupTabBtn= document.getElementById('signupTabBtn');
  const slider      = document.getElementById('atSlider');

  if (tab === 'login') {
    loginForm.classList.add('active');
    signupForm.classList.remove('active');
    loginTabBtn.classList.add('active');
    signupTabBtn.classList.remove('active');
    slider.classList.remove('right');
  } else {
    signupForm.classList.add('active');
    loginForm.classList.remove('active');
    signupTabBtn.classList.add('active');
    loginTabBtn.classList.remove('active');
    slider.classList.add('right');
  }
}

// Show/hide password toggle
function togglePass(inputId, btn) {
  const input = document.getElementById(inputId);
  input.type = input.type === 'password' ? 'text' : 'password';
  btn.style.color = input.type === 'text' ? 'var(--green)' : '';
}

/* ── Password Strength Meter ── */
document.getElementById('signupPassword').addEventListener('input', function () {
  const val = this.value;
  const fill  = document.getElementById('psFill');
  const label = document.getElementById('psLabel');

  let score = 0;
  if (val.length >= 8)            score++;
  if (/[A-Z]/.test(val))         score++;
  if (/[0-9]/.test(val))         score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;

  const widths = ['0%', '25%', '50%', '75%', '100%'];
  const colors = ['', '#f43f5e', '#f59e0b', '#0ea5e9', '#10d9a0'];
  const labels = ['Enter password', 'Weak', 'Fair', 'Good', 'Strong'];

  fill.style.width      = widths[score];
  fill.style.background = colors[score];
  label.textContent     = labels[score];
  label.style.color     = colors[score] || 'var(--text3)';
});

/* ── Frontend Validation Helpers ── */
function showErr(id, msg) {
  document.getElementById(id).textContent = msg;
}
function clearErr(id) {
  document.getElementById(id).textContent = '';
}

// Validate email format
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ── Handle Login Submit ── */
function handleLogin(e) {
  e.preventDefault();
  let valid = true;

  const email = document.getElementById('loginEmail').value.trim();
  const pass  = document.getElementById('loginPassword').value;

  clearErr('loginEmailErr');
  clearErr('loginPassErr');

  if (!isValidEmail(email)) {
    showErr('loginEmailErr', 'Please enter a valid email address.');
    valid = false;
  }
  if (pass.length < 6) {
    showErr('loginPassErr', 'Password must be at least 6 characters.');
    valid = false;
  }

  if (!valid) return;

  // Simulate login — extract first name from email
  const firstName = email.split('@')[0].replace(/[^a-zA-Z]/g, '');
  const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1) || 'User';

  enterApp(displayName, 'Prosumer');
}

/* ── Handle Signup Submit ── */
function handleSignup(e) {
  e.preventDefault();
  let valid = true;

  const name  = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const pass  = document.getElementById('signupPassword').value;
  const role  = document.getElementById('signupRole').value;

  clearErr('signupNameErr');
  clearErr('signupEmailErr');
  clearErr('signupPassErr');

  if (name.length < 2) {
    showErr('signupNameErr', 'Name must be at least 2 characters.');
    valid = false;
  }
  if (!isValidEmail(email)) {
    showErr('signupEmailErr', 'Please enter a valid email address.');
    valid = false;
  }
  if (pass.length < 8) {
    showErr('signupPassErr', 'Password must be at least 8 characters.');
    valid = false;
  }

  if (!valid) return;

  const roleLabel = { buyer: 'Buyer', seller: 'Seller', prosumer: 'Prosumer' }[role];
  enterApp(name, roleLabel);
}

// Enter the main app, setting user info in the sidebar
function enterApp(name, role) {
  currentUser.name = name;
  currentUser.role = role;

  // Set initials in avatar
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  document.getElementById('sidebarAv').textContent   = initials;
  document.getElementById('sidebarName').textContent = name;
  document.getElementById('sidebarRole').textContent = role;
  document.getElementById('topbarName').textContent  = name.split(' ')[0];

  showScreen('app-screen');
  renderListings();
  renderTransactions();
  renderRechargeHistory();
}

/* ════════════════════════════════════════════════════
   4. DATA — Schema-matching dummy data
════════════════════════════════════════════════════ */

// Current logged-in user (set on login)
const currentUser = { name: 'Alex Johnson', role: 'Prosumer' };

// energy_listings table (updated to use global-neutral names)
const energyListings = [
  { listing_id:1, seller_id:3,  seller_name:'Alex Carter',   zone_id:1, zone_code:'UDC-01', slot_id:2, slot_name:'Day Standard',    energy_source_id:1, source_type:'solar',  units_available_kwh:10.50, price_per_kwh:5.50, status:'active',  listing_date:'2025-04-06' },
  { listing_id:2, seller_id:5,  seller_name:'Jordan Lee',    zone_id:1, zone_code:'UDC-01', slot_id:1, slot_name:'Morning Peak',     energy_source_id:2, source_type:'wind',   units_available_kwh:25.00, price_per_kwh:4.80, status:'active',  listing_date:'2025-04-06' },
  { listing_id:3, seller_id:7,  seller_name:'Taylor Morgan', zone_id:2, zone_code:'MNG-E1', slot_id:2, slot_name:'Day Standard',    energy_source_id:3, source_type:'biogas', units_available_kwh:8.75,  price_per_kwh:5.00, status:'active',  listing_date:'2025-04-06' },
  { listing_id:4, seller_id:9,  seller_name:'Sam Rivera',    zone_id:1, zone_code:'UDC-01', slot_id:3, slot_name:'Evening Peak',     energy_source_id:1, source_type:'solar',  units_available_kwh:15.00, price_per_kwh:6.20, status:'active',  listing_date:'2025-04-06' },
  { listing_id:5, seller_id:11, seller_name:'Casey Patel',   zone_id:2, zone_code:'MNG-E1', slot_id:4, slot_name:'Night Off-Peak',   energy_source_id:2, source_type:'wind',   units_available_kwh:30.00, price_per_kwh:3.90, status:'active',  listing_date:'2025-04-06' },
  { listing_id:6, seller_id:13, seller_name:'Morgan Ellis',  zone_id:1, zone_code:'UDC-01', slot_id:1, slot_name:'Morning Peak',     energy_source_id:3, source_type:'biogas', units_available_kwh:0,     price_per_kwh:5.25, status:'sold',    listing_date:'2025-04-05' },
];

// transactions table
const transactions = [
  { transaction_id:101, match_id:201, buyer_id:1, buyer_name:'Alex Johnson',  seller_id:3,  seller_name:'Alex Carter',   amount:57.75,  units_kwh:10.50, platform_fee:1.44, status:'completed', created_at:'2025-04-05 09:15' },
  { transaction_id:102, match_id:202, buyer_id:1, buyer_name:'Alex Johnson',  seller_id:5,  seller_name:'Jordan Lee',    amount:120.00, units_kwh:25.00, platform_fee:3.00, status:'completed', created_at:'2025-04-04 14:30' },
  { transaction_id:103, match_id:203, buyer_id:2, buyer_name:'Riley Brooks',  seller_id:7,  seller_name:'Taylor Morgan', amount:43.75,  units_kwh:8.75,  platform_fee:1.09, status:'completed', created_at:'2025-04-03 11:00' },
  { transaction_id:104, match_id:204, buyer_id:4, buyer_name:'Drew Kim',      seller_id:9,  seller_name:'Sam Rivera',    amount:93.00,  units_kwh:15.00, platform_fee:2.33, status:'pending',   created_at:'2025-04-06 08:45' },
  { transaction_id:105, match_id:205, buyer_id:6, buyer_name:'Quinn Walsh',   seller_id:11, seller_name:'Casey Patel',   amount:117.00, units_kwh:30.00, platform_fee:2.93, status:'failed',    created_at:'2025-04-02 22:30' },
  { transaction_id:106, match_id:206, buyer_id:1, buyer_name:'Alex Johnson',  seller_id:13, seller_name:'Morgan Ellis',  amount:65.63,  units_kwh:12.50, platform_fee:1.64, status:'completed', created_at:'2025-04-01 18:00' },
];

// wallet_recharge_logs table
const rechargeLogs = [
  { recharge_id:1, wallet_id:1001, amount:1000, payment_method:'UPI',         gateway_reference:'UPI2025040501',  status:'success', initiated_at:'2025-04-05 09:00' },
  { recharge_id:2, wallet_id:1001, amount:2000, payment_method:'Card',        gateway_reference:'CARD20250403X',  status:'success', initiated_at:'2025-04-03 17:30' },
  { recharge_id:3, wallet_id:1001, amount:500,  payment_method:'Net Banking', gateway_reference:'NB20250401Q',    status:'success', initiated_at:'2025-04-01 10:15' },
  { recharge_id:4, wallet_id:1001, amount:300,  payment_method:'UPI',         gateway_reference:'UPI20250330Z',   status:'failed',  initiated_at:'2025-03-30 20:45' },
];

// wallet state
let walletBalance = 4200.00;

// My own sell listings (dynamically added)
let myListings = [];

/* ════════════════════════════════════════════════════
   5. SIDEBAR NAVIGATION
════════════════════════════════════════════════════ */
const pageInfo = {
  dashboard:    { title: 'Dashboard',      sub: 'Overview of your energy activity' },
  transactions: { title: 'Transactions',   sub: 'Your complete trade history' },
  wallet:       { title: 'Wallet',         sub: 'Balance, payments & recharge history' },
};

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', function (e) {
    e.preventDefault();
    const page = this.dataset.page;

    // Update active nav
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    this.classList.add('active');

    // Switch page panel
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${page}`).classList.add('active');

    // Update topbar
    document.getElementById('pageTitle').textContent = pageInfo[page].title;
    document.getElementById('pageSub').textContent   = pageInfo[page].sub;
  });
});

/* ════════════════════════════════════════════════════
   6. BUY / SELL MODE TOGGLE
════════════════════════════════════════════════════ */
function setMode(mode) {
  const buyMode    = document.getElementById('buyMode');
  const sellMode   = document.getElementById('sellMode');
  const filterArea = document.getElementById('filterArea');
  const buyBtn     = document.getElementById('buyModeBtn');
  const sellBtn    = document.getElementById('sellModeBtn');

  if (mode === 'buy') {
    buyMode.style.display    = 'block';
    sellMode.style.display   = 'none';
    filterArea.style.display = 'flex';
    buyBtn.classList.add('active');
    sellBtn.classList.remove('active');
  } else {
    buyMode.style.display    = 'none';
    sellMode.style.display   = 'block';
    filterArea.style.display = 'none';
    sellBtn.classList.add('active');
    buyBtn.classList.remove('active');
    renderMyListings();
  }
}

/* ════════════════════════════════════════════════════
   7. LISTINGS — Render Cards
════════════════════════════════════════════════════ */
let activeFilter = 'all';
let activeSlot   = 'all';

// Source icon mapping (using simple Unicode — no emojis)
const srcIcons = { solar: '◐', wind: '~', biogas: '*' };

function renderListings() {
  const grid = document.getElementById('listingsGrid');
  grid.innerHTML = '';

  // Apply filters
  const filtered = energyListings.filter(l => {
    const matchSrc  = activeFilter === 'all' || l.source_type === activeFilter;
    const matchSlot = activeSlot   === 'all' || l.slot_name   === activeSlot;
    return matchSrc && matchSlot;
  });

  if (filtered.length === 0) {
    grid.innerHTML = '<div class="empty-state">No listings match the selected filters.</div>';
    return;
  }

  filtered.forEach((listing, i) => {
    const card = buildCard(listing, i);
    grid.appendChild(card);
  });

  // Update stats
  const active = filtered.filter(l => l.status === 'active');
  const totalUnits = active.reduce((sum, l) => sum + l.units_available_kwh, 0);
  document.getElementById('statListings').textContent = active.length;
}

function buildCard(listing, index) {
  const isSold    = listing.status === 'sold' || listing.units_available_kwh <= 0;
  const initials  = listing.seller_name.split(' ').map(w => w[0]).join('').slice(0, 2);
  const total     = (listing.units_available_kwh * listing.price_per_kwh).toFixed(2);

  const card = document.createElement('div');
  card.className = 'listing-card';
  card.style.animationDelay = `${index * 0.06}s`;

  card.innerHTML = `
    <div class="card-top">
      <div class="source-tag ${listing.source_type}">${listing.source_type.toUpperCase()}</div>
      <div class="slot-tag">${listing.slot_name}</div>
    </div>
    <div class="card-seller-row">
      <div class="seller-av">${initials}</div>
      <div>
        <div class="seller-nm">${listing.seller_name}</div>
        <div class="seller-id">seller_id: ${listing.seller_id} · listing_id: ${listing.listing_id}</div>
      </div>
    </div>
    <div class="card-data">
      <div class="cd">
        <div class="cd-label">Units Available</div>
        <div class="cd-val">${listing.units_available_kwh.toFixed(2)} kWh</div>
      </div>
      <div class="cd">
        <div class="cd-label">Price / kWh</div>
        <div class="cd-val price">₹${listing.price_per_kwh.toFixed(2)}</div>
      </div>
    </div>
    <div class="card-footer">
      <div class="card-zone">Zone: ${listing.zone_code}</div>
      <button class="buy-btn"
        onclick="openBuyModal(${listing.listing_id})"
        ${isSold ? 'disabled' : ''}>
        ${isSold ? 'Sold Out' : 'Buy Energy'}
      </button>
    </div>
    ${isSold ? '<div class="sold-overlay">SOLD OUT</div>' : ''}
  `;

  return card;
}

// Filter chip click handlers
document.querySelectorAll('.filter-chip').forEach(chip => {
  chip.addEventListener('click', function () {
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    this.classList.add('active');
    activeFilter = this.dataset.filter;
    renderListings();
  });
});

document.getElementById('slotFilter').addEventListener('change', function () {
  activeSlot = this.value;
  renderListings();
});

/* ════════════════════════════════════════════════════
   8. BUY MODAL
════════════════════════════════════════════════════ */
let selectedListing = null;

function openBuyModal(listingId) {
  selectedListing = energyListings.find(l => l.listing_id === listingId);
  if (!selectedListing) return;

  const fee   = +(selectedListing.price_per_kwh * selectedListing.units_available_kwh * 0.025).toFixed(2);
  const total = +(selectedListing.price_per_kwh * selectedListing.units_available_kwh + fee).toFixed(2);
  const canAfford = walletBalance >= total;

  document.getElementById('buyModalBody').innerHTML = `
    <div class="modal-row"><span class="mr-label">Seller</span><span class="mr-val">${selectedListing.seller_name}</span></div>
    <div class="modal-row"><span class="mr-label">Source</span><span class="mr-val">${selectedListing.source_type.toUpperCase()}</span></div>
    <div class="modal-row"><span class="mr-label">Units</span><span class="mr-val">${selectedListing.units_available_kwh.toFixed(2)} kWh</span></div>
    <div class="modal-row"><span class="mr-label">Rate</span><span class="mr-val hi">₹${selectedListing.price_per_kwh.toFixed(2)} / kWh</span></div>
    <div class="modal-row"><span class="mr-label">Slot</span><span class="mr-val">${selectedListing.slot_name}</span></div>
    <hr class="modal-div"/>
    <div class="modal-row"><span class="mr-label">Platform Fee (2.5%)</span><span class="mr-val">₹${fee.toFixed(2)}</span></div>
    <div class="modal-row"><span class="mr-label">Total Payable</span><span class="mr-val g">₹${total.toFixed(2)}</span></div>
    <div class="modal-row" style="background:${canAfford ? 'rgba(16,217,160,0.05)' : 'rgba(244,63,94,0.05)'}">
      <span class="mr-label">Wallet Balance</span>
      <span class="mr-val" style="color:${canAfford ? 'var(--green)' : 'var(--red)'}">₹${walletBalance.toFixed(2)}</span>
    </div>
    ${!canAfford ? '<div style="font-size:0.75rem;color:var(--red);text-align:center;padding:4px 0">Insufficient balance — please recharge your wallet</div>' : ''}
  `;

  const btn = document.getElementById('confirmBuyBtn');
  btn.disabled = !canAfford;
  btn.onclick  = canAfford ? () => confirmPurchase(total, fee) : null;

  openModal('buyModal');
}

function confirmPurchase(total, fee) {
  if (!selectedListing) return;

  // Deduct wallet (simulates UPDATE wallets SET balance = balance - amount)
  walletBalance -= total;

  // Mark listing sold (simulates UPDATE energy_listings SET status = 'sold')
  selectedListing.units_available_kwh = 0;
  selectedListing.status = 'sold';

  // Add transaction record (simulates INSERT INTO transactions)
  transactions.unshift({
    transaction_id: 200 + Math.floor(Math.random() * 900),
    match_id:       300 + Math.floor(Math.random() * 100),
    buyer_id:       1,
    buyer_name:     currentUser.name,
    seller_id:      selectedListing.seller_id,
    seller_name:    selectedListing.seller_name,
    amount:         total,
    units_kwh:      selectedListing.units_available_kwh || 10,
    platform_fee:   fee,
    status:         'completed',
    created_at:     new Date().toISOString().slice(0, 16).replace('T', ' '),
  });

  closeModal('buyModal');
  showToast(`Purchase confirmed — ₹${total.toFixed(2)} debited from wallet.`, 'success');
  renderListings();
  updateWalletUI();
  renderTransactions();
}

/* ════════════════════════════════════════════════════
   9. SELL MODE — Create Listing Form
════════════════════════════════════════════════════ */

// Live preview calculation
['sellUnits', 'sellPrice'].forEach(id => {
  document.getElementById(id).addEventListener('input', updateSellPreview);
});

function updateSellPreview() {
  const units = parseFloat(document.getElementById('sellUnits').value) || 0;
  const price = parseFloat(document.getElementById('sellPrice').value) || 0;
  const preview = document.getElementById('sellPreview');

  if (units > 0 && price > 0) {
    const revenue   = units * price;
    const fee       = revenue * 0.025;
    const net       = revenue - fee;

    document.getElementById('spRevenue').textContent = `₹${revenue.toFixed(2)}`;
    document.getElementById('spFee').textContent     = `₹${fee.toFixed(2)}`;
    document.getElementById('spNet').textContent     = `₹${net.toFixed(2)}`;
    preview.style.display = 'block';
  } else {
    preview.style.display = 'none';
  }
}

function handleSellSubmit(e) {
  e.preventDefault();
  let valid = true;

  const units  = parseFloat(document.getElementById('sellUnits').value);
  const price  = parseFloat(document.getElementById('sellPrice').value);
  const source = document.getElementById('sellSource').value;
  const slot   = document.getElementById('sellSlot').value;

  clearErr('sellUnitsErr');
  clearErr('sellPriceErr');

  if (!units || units <= 0) {
    showErr('sellUnitsErr', 'Units must be greater than 0.');
    valid = false;
  }
  if (!price || price <= 0) {
    showErr('sellPriceErr', 'Price must be greater than 0.');
    valid = false;
  }
  if (!valid) return;

  // Build a new listing (simulates INSERT INTO energy_listings)
  const newListing = {
    listing_id:          energyListings.length + 100,
    seller_id:           1,
    seller_name:         currentUser.name,
    zone_id:             1,
    zone_code:           'UDC-01',
    slot_id:             1,
    slot_name:           slot,
    energy_source_id:    1,
    source_type:         source,
    units_available_kwh: units,
    price_per_kwh:       price,
    status:              'active',
    listing_date:        new Date().toISOString().slice(0, 10),
  };

  energyListings.unshift(newListing);
  myListings.unshift(newListing);

  document.getElementById('sellForm').reset();
  document.getElementById('sellPreview').style.display = 'none';

  showToast(`Listing published — ${units} kWh at ₹${price}/kWh`, 'success');
  renderMyListings();

  // Update active listing count stat
  document.getElementById('statSold').textContent = `${units.toFixed(2)} kWh`;
}

// Render "My Active Listings" in the sell panel
function renderMyListings() {
  const list = document.getElementById('myListingsList');
  if (myListings.length === 0) {
    list.innerHTML = '<div class="mli-empty">No active listings yet. Create your first one!</div>';
    return;
  }
  list.innerHTML = myListings.map(l => `
    <div class="my-listing-item">
      <div class="mli-top">
        <span class="mli-source">${l.source_type.toUpperCase()}</span>
        <span class="mli-slot">${l.slot_name}</span>
      </div>
      <div class="mli-data">
        <div class="mli-d">Units: <span>${l.units_available_kwh.toFixed(2)} kWh</span></div>
        <div class="mli-d">Rate: <span>₹${l.price_per_kwh.toFixed(2)}/kWh</span></div>
        <div class="mli-d">Status: <span style="color:var(--green)">${l.status}</span></div>
      </div>
    </div>
  `).join('');
}

/* ════════════════════════════════════════════════════
   10. TRANSACTIONS TABLE
════════════════════════════════════════════════════ */
function renderTransactions() {
  const tbody = document.getElementById('txBody');
  tbody.innerHTML = '';

  transactions.forEach(tx => {
    const statusClass = { completed: 's-completed', pending: 's-pending', failed: 's-failed' }[tx.status] || 's-pending';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="color:var(--text3)">#${tx.transaction_id}</td>
      <td class="td-name">${tx.buyer_name}</td>
      <td class="td-name" style="color:var(--text2)">${tx.seller_name}</td>
      <td>${(tx.units_kwh || 0).toFixed(2)}</td>
      <td style="color:var(--text);font-weight:600">₹${tx.amount.toFixed(2)}</td>
      <td style="color:var(--orange)">₹${(tx.platform_fee || 0).toFixed(2)}</td>
      <td><span class="status-chip ${statusClass}">${tx.status}</span></td>
      <td style="color:var(--text3);font-size:0.72rem">${tx.created_at.slice(0, 10)}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Export to CSV
function exportCSV() {
  const headers = ['Tx ID', 'Buyer', 'Seller', 'Units (kWh)', 'Amount', 'Fee', 'Status', 'Date'];
  const rows    = transactions.map(tx => [
    tx.transaction_id, tx.buyer_name, tx.seller_name,
    (tx.units_kwh || 0).toFixed(2), tx.amount.toFixed(2),
    (tx.platform_fee || 0).toFixed(2), tx.status, tx.created_at.slice(0, 10)
  ]);

  const csv  = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = 'voltshare_transactions.csv';
  a.click();

  showToast('Transactions exported as CSV', 'info');
}

/* ════════════════════════════════════════════════════
   11. WALLET
════════════════════════════════════════════════════ */
function updateWalletUI() {
  document.getElementById('walletBalanceDisplay').textContent = `₹${walletBalance.toFixed(2)}`;
  document.getElementById('statWallet').textContent           = `₹${Math.round(walletBalance).toLocaleString()}`;
}

function renderRechargeHistory() {
  const list = document.getElementById('rechargeList');

  const methodIconSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>`;

  list.innerHTML = rechargeLogs.map(log => {
    const isSuccess = log.status === 'success';
    return `
      <div class="recharge-item">
        <div class="ri-icon ${isSuccess ? 's' : 'f'}">${methodIconSVG}</div>
        <div class="ri-body">
          <div class="ri-method">${log.payment_method}</div>
          <div class="ri-date">${log.initiated_at} · Ref: ${log.gateway_reference}</div>
        </div>
        <div class="ri-right">
          <div class="ri-amount ${isSuccess ? 'pos' : 'neg'}">${isSuccess ? '+' : '×'} ₹${log.amount.toFixed(2)}</div>
          <span class="status-chip ${isSuccess ? 's-completed' : 's-failed'}">${log.status}</span>
        </div>
      </div>
    `;
  }).join('');
}

function setAmt(amount) {
  document.getElementById('rechargeAmount').value = amount;
}

function processRecharge() {
  const amount = parseFloat(document.getElementById('rechargeAmount').value);
  if (!amount || amount < 50) { showToast('Minimum recharge amount is ₹50', 'error'); return; }
  if (amount > 50000)         { showToast('Maximum recharge limit is ₹50,000', 'error'); return; }

  const method = document.querySelector('input[name="pmethod"]:checked')?.value || 'UPI';

  walletBalance += amount;

  rechargeLogs.unshift({
    recharge_id:       100 + rechargeLogs.length,
    wallet_id:         1001,
    amount:            amount,
    payment_method:    method,
    gateway_reference: `${method.replace(/\s/g,'')}${Date.now()}`,
    status:            'success',
    initiated_at:      new Date().toISOString().slice(0, 16).replace('T', ' '),
  });

  closeModal('rechargeModal');
  showToast(`₹${amount.toFixed(2)} added via ${method}`, 'success');
  updateWalletUI();
  renderRechargeHistory();
}

/* ════════════════════════════════════════════════════
   12. MODAL HELPERS
════════════════════════════════════════════════════ */
function openModal(id) {
  document.getElementById(id).classList.add('show');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('show');
}

// Click outside modal to close
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', function (e) {
    if (e.target === this) this.classList.remove('show');
  });
});

/* ════════════════════════════════════════════════════
   13. TOAST NOTIFICATIONS
════════════════════════════════════════════════════ */
let toastTimer = null;

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className   = `toast ${type} show`;

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
}

// Notification bell
document.getElementById('notifBtn').addEventListener('click', () => {
  showToast('You have 3 unread notifications', 'info');
});

/* ════════════════════════════════════════════════════
   14. LOGOUT
════════════════════════════════════════════════════ */
function logout() {
  showScreen('auth-screen');
  showAuthTab('login');
}

/* ════════════════════════════════════════════════════
   15. INIT
════════════════════════════════════════════════════ */
function init() {
  renderTransactions();
  renderRechargeHistory();
  updateWalletUI();
}

init();
