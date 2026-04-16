/* ═══════════════════════════════════════════════════════════
   VoltShare — FIXED & COMPLETE script.js
═══════════════════════════════════════════════════════════ */

/* ===================== BACKEND CONFIG ===================== */
const API = "https://p2p-backend-production-f878.up.railway.app";

/* ===================== API HELPER ===================== */
async function apiRequest(endpoint, method = "GET", body = null) {
  try {
    const res = await fetch(`${API}${endpoint}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : null,
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "API error");
    }
    return data.data;
  } catch (err) {
    console.error("API ERROR:", err);
    showToast(err.message || "Server error", "error");
    return null;
  }
}

/* ===================== GLOBAL STATE ===================== */
let energyListings    = [];
let allListings       = [];   // unfiltered copy
let selectedListing   = null;
let walletBalance     = 0;
let currentUserId     = null;
let currentFilter     = "all";
let currentSlotFilter = "all";
const currentUser     = { name: "", role: "" };

/* ===================== SCREEN NAV ===================== */
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => {
    s.classList.remove("active");
    // keep fixed layout correct
    s.style.position = "fixed";
  });
  const target = document.getElementById(id);
  if (!target) return;
  target.classList.add("active");
  target.style.position = "relative";
}

/* ===================== TOAST ===================== */
let toastTimer = null;
function showToast(msg, type = "info") {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = msg;
  el.className = `toast show ${type}`;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.classList.remove("show"); }, 3200);
}

/* ===================== AUTH TAB TOGGLE ===================== */
function showAuthTab(tab) {
  const loginForm  = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const loginBtn   = document.getElementById("loginTabBtn");
  const signupBtn  = document.getElementById("signupTabBtn");
  const slider     = document.getElementById("atSlider");

  if (tab === "login") {
    loginForm.classList.add("active");
    signupForm.classList.remove("active");
    loginBtn.classList.add("active");
    signupBtn.classList.remove("active");
    slider && slider.classList.remove("right");
  } else {
    signupForm.classList.add("active");
    loginForm.classList.remove("active");
    signupBtn.classList.add("active");
    loginBtn.classList.remove("active");
    slider && slider.classList.add("right");
  }
}

/* ===================== TOGGLE PASSWORD ===================== */
function togglePass(inputId, btn) {
  const inp = document.getElementById(inputId);
  if (!inp) return;
  const isPass = inp.type === "password";
  inp.type = isPass ? "text" : "password";
  // swap icon opacity as a visual cue
  btn.style.opacity = isPass ? "1" : "0.5";
}

/* ===================== PASSWORD STRENGTH ===================== */
function checkPassStrength(val) {
  const fill  = document.getElementById("psFill");
  const label = document.getElementById("psLabel");
  if (!fill || !label) return;
  let score = 0;
  if (val.length >= 8)                        score++;
  if (/[A-Z]/.test(val))                      score++;
  if (/[0-9]/.test(val))                      score++;
  if (/[^A-Za-z0-9]/.test(val))               score++;
  const levels = [
    { w: "0%",   color: "var(--text3)",   text: "Enter password" },
    { w: "25%",  color: "var(--red)",     text: "Weak" },
    { w: "50%",  color: "var(--orange)",  text: "Fair" },
    { w: "75%",  color: "var(--blue)",    text: "Good" },
    { w: "100%", color: "var(--green)",   text: "Strong" },
  ];
  const lvl = levels[score];
  fill.style.width      = lvl.w;
  fill.style.background = lvl.color;
  label.textContent     = lvl.text;
  label.style.color     = lvl.color;
}

/* ===================== LOGIN ===================== */
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const pass  = document.getElementById("loginPassword").value;
  const btn   = e.target.querySelector("button[type=submit]");
  btn.textContent = "Signing in…";
  btn.disabled = true;

  const user = await apiRequest("/api/users/login", "POST", { email, password: pass });

  btn.textContent = "Sign In";
  btn.disabled = false;

  if (user) {
    currentUserId = user.user_id;
    walletBalance = parseFloat(user.wallet_balance) || 0;
    enterApp(user.full_name, user.role_name);
  }
}

/* ===================== SIGNUP ===================== */
async function handleSignup(e) {
  e.preventDefault();
  const name  = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const pass  = document.getElementById("signupPassword").value;
  const role  = document.getElementById("signupRole").value;
  const roleMap = { buyer: 1, seller: 2, prosumer: 3, admin: 4 };
  const btn   = e.target.querySelector("button[type=submit]");
  btn.textContent = "Creating…";
  btn.disabled = true;

  const res = await apiRequest("/api/users/register", "POST", {
    full_name: name,
    email,
    password: pass,
    role_id: roleMap[role] || 3,
  });

  btn.textContent = "Create Account";
  btn.disabled = false;

  if (res) {
    showToast("Account created! Please sign in.", "success");
    showAuthTab("login");
  }
}

/* ===================== ENTER APP ===================== */
function enterApp(name, role) {
  currentUser.name = name;
  currentUser.role = role;

  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  document.getElementById("sidebarAv").textContent    = initials;
  document.getElementById("sidebarName").textContent  = name;
  document.getElementById("sidebarRole").textContent  = role;
  document.getElementById("topbarName").textContent   = name.split(" ")[0];

  showScreen("app-screen");
  navigateTo("dashboard");
  updateWalletUI();
  loadListings();
  loadTransactions();
}

/* ===================== LOGOUT ===================== */
function logout() {
  currentUserId   = null;
  walletBalance   = 0;
  energyListings  = [];
  allListings     = [];
  selectedListing = null;
  showScreen("landing-screen");
}

/* ===================== SIDEBAR NAVIGATION ===================== */
function navigateTo(page) {
  // Hide all pages
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));

  // Show target page
  const target = document.getElementById(`page-${page}`);
  if (target) target.classList.add("active");

  // Update nav items
  document.querySelectorAll(".nav-item").forEach(a => {
    a.classList.toggle("active", a.dataset.page === page);
  });

  // Update topbar title
  const titles = { dashboard: "Dashboard", transactions: "Transactions", wallet: "Wallet" };
  const el = document.getElementById("pageTitle");
  if (el) el.textContent = titles[page] || page;

  // Lazy-load wallet data when first visiting
  if (page === "wallet") loadWalletData();
  if (page === "transactions") loadTransactions();
}

/* ===================== LOAD LISTINGS ===================== */
async function loadListings() {
  const grid = document.getElementById("listingsGrid");
  if (grid) grid.innerHTML = `<div class="empty-state">Loading listings…</div>`;

  const data = await apiRequest("/api/listings");
  if (data) {
    allListings    = data;
    energyListings = data;
    applyFilters();
    updateStatCards();
    loadMyListings();
  } else {
    if (grid) grid.innerHTML = `<div class="empty-state">Failed to load listings.</div>`;
  }
}

/* ===================== APPLY FILTERS ===================== */
function applyFilters() {
  let filtered = [...allListings];

  if (currentFilter !== "all") {
    filtered = filtered.filter(l =>
      (l.source_type || "").toLowerCase() === currentFilter.toLowerCase()
    );
  }
  if (currentSlotFilter !== "all") {
    filtered = filtered.filter(l =>
      (l.slot_name || "").toLowerCase().includes(currentSlotFilter.toLowerCase())
    );
  }

  energyListings = filtered;
  renderListings();
}

/* ===================== RENDER LISTINGS ===================== */
function renderListings() {
  const grid = document.getElementById("listingsGrid");
  if (!grid) return;
  grid.innerHTML = "";

  if (!energyListings.length) {
    grid.innerHTML = `<div class="empty-state">No listings found for this filter.</div>`;
    return;
  }

  energyListings.forEach((listing, idx) => {
    const card      = document.createElement("div");
    card.className  = "listing-card";
    card.style.animationDelay = `${idx * 0.05}s`;

    const src        = (listing.source_type || "energy").toLowerCase();
    const sold       = listing.units_available_kwh <= 0;
    const sellerInit = (listing.seller_name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

    card.innerHTML = `
      <div class="card-top">
        <span class="source-tag ${src}">
          ${srcIcon(src)} ${listing.source_type || "Energy"}
        </span>
        <span class="slot-tag">${listing.slot_name || "—"}</span>
      </div>
      <div class="card-seller-row">
        <div class="seller-av">${sellerInit}</div>
        <div>
          <div class="seller-nm">${listing.seller_name || "Unknown"}</div>
          <div class="seller-id">Zone: ${listing.zone_name || "—"}</div>
        </div>
      </div>
      <div class="card-data">
        <div class="cd">
          <div class="cd-label">Available</div>
          <div class="cd-val">${parseFloat(listing.units_available_kwh).toFixed(2)} kWh</div>
        </div>
        <div class="cd">
          <div class="cd-label">Price / kWh</div>
          <div class="cd-val price">₹${parseFloat(listing.price_per_kwh).toFixed(2)}</div>
        </div>
      </div>
      <div class="card-footer">
        <span class="card-zone">ID #${listing.listing_id}</span>
        <button class="buy-btn" ${sold ? "disabled" : ""} onclick="openBuyModal(${listing.listing_id})">
          ${sold ? "Sold Out" : "Buy"}
        </button>
      </div>
      ${sold ? `<div class="sold-overlay">SOLD OUT</div>` : ""}
    `;
    grid.appendChild(card);
  });
}

function srcIcon(src) {
  if (src === "solar")  return "☀️";
  if (src === "wind")   return "💨";
  if (src === "biogas") return "🌿";
  return "⚡";
}

/* ===================== UPDATE STAT CARDS ===================== */
function updateStatCards() {
  const listingCount = document.getElementById("statListings");
  if (listingCount) listingCount.textContent = allListings.filter(l => l.units_available_kwh > 0).length;
}

/* ===================== LOAD MY LISTINGS ===================== */
function loadMyListings() {
  const container = document.getElementById("myListingsList");
  if (!container) return;

  // Filter listings belonging to current user (if seller_id available)
  const mine = allListings.filter(l =>
    l.seller_id === currentUserId || l.seller_name === currentUser.name
  );

  if (!mine.length) {
    container.innerHTML = `<div class="mli-empty">No active listings yet.</div>`;
    return;
  }

  container.innerHTML = mine.map(l => `
    <div class="my-listing-item">
      <div class="mli-top">
        <span class="mli-source">${l.source_type || "Energy"}</span>
        <span class="mli-slot">${l.slot_name || ""}</span>
      </div>
      <div class="mli-data">
        <div class="mli-d"><span>${parseFloat(l.units_available_kwh).toFixed(2)} kWh</span></div>
        <div class="mli-d">₹<span>${parseFloat(l.price_per_kwh).toFixed(2)}</span>/kWh</div>
        <div class="mli-d">Zone: <span>${l.zone_name || "—"}</span></div>
      </div>
    </div>
  `).join("");
}

/* ===================== BUY MODAL ===================== */
function openBuyModal(id) {
  selectedListing = allListings.find(l => l.listing_id === id);
  if (!selectedListing) return;

  const total = (parseFloat(selectedListing.units_available_kwh) * parseFloat(selectedListing.price_per_kwh)).toFixed(2);
  const fee   = (total * 0.025).toFixed(2);
  const net   = (total - fee).toFixed(2);

  document.getElementById("buyModalBody").innerHTML = `
    <div class="modal-row">
      <span class="mr-label">Energy Source</span>
      <span class="mr-val">${selectedListing.source_type || "Energy"}</span>
    </div>
    <div class="modal-row">
      <span class="mr-label">Units</span>
      <span class="mr-val">${parseFloat(selectedListing.units_available_kwh).toFixed(2)} kWh</span>
    </div>
    <div class="modal-row">
      <span class="mr-label">Price / kWh</span>
      <span class="mr-val">₹${parseFloat(selectedListing.price_per_kwh).toFixed(2)}</span>
    </div>
    <div class="modal-row">
      <span class="mr-label">Seller</span>
      <span class="mr-val">${selectedListing.seller_name || "—"}</span>
    </div>
    <div class="modal-row">
      <span class="mr-label">Time Slot</span>
      <span class="mr-val">${selectedListing.slot_name || "—"}</span>
    </div>
    <hr class="modal-div"/>
    <div class="modal-row">
      <span class="mr-label">Subtotal</span>
      <span class="mr-val hi">₹${total}</span>
    </div>
    <div class="modal-row">
      <span class="mr-label">Platform Fee (2.5%)</span>
      <span class="mr-val">₹${fee}</span>
    </div>
    <div class="modal-row">
      <span class="mr-label">Total Charged</span>
      <span class="mr-val g">₹${(parseFloat(total) + parseFloat(fee)).toFixed(2)}</span>
    </div>
  `;

  const confirmBtn = document.getElementById("confirmBuyBtn");
  confirmBtn.onclick = confirmPurchase;
  openModal("buyModal");
}

/* ===================== CONFIRM PURCHASE ===================== */
async function confirmPurchase() {
  if (!selectedListing) return;
  if (!currentUserId) { showToast("Please log in first.", "error"); return; }

  const btn = document.getElementById("confirmBuyBtn");
  btn.textContent = "Processing…";
  btn.disabled    = true;

  const res = await apiRequest("/api/orders", "POST", {
    buyer_id:           currentUserId,
    listing_id:         selectedListing.listing_id,
    units_requested_kwh: selectedListing.units_available_kwh,
  });

  btn.textContent = "Confirm";
  btn.disabled    = false;

  if (res) {
    closeModal("buyModal");
    showToast(`Purchase successful! ₹${parseFloat(res.amount_charged || 0).toFixed(2)} charged.`, "success");
    walletBalance -= parseFloat(res.amount_charged || 0);
    updateWalletUI();
    loadListings();
    loadTransactions();
  }
}

/* ===================== SELL FORM ===================== */
async function handleSellSubmit(e) {
  e.preventDefault();

  if (!currentUserId) { showToast("Please log in first.", "error"); return; }

  const units  = parseFloat(document.getElementById("sellUnits").value);
  const price  = parseFloat(document.getElementById("sellPrice").value);
  const source = document.getElementById("sellSource").value;
  const slot   = document.getElementById("sellSlot").value;
  const today  = new Date().toISOString().split("T")[0];

  // Map names to IDs (adjust if your backend has different IDs)
  const sourceMap = { solar: 1, wind: 2, biogas: 3 };
  const slotMap   = {
    "Morning Peak":    1,
    "Day Standard":    2,
    "Evening Peak":    3,
    "Night Off-Peak":  4,
  };

  const btn = e.target.querySelector("button[type=submit]");
  btn.textContent = "Publishing…";
  btn.disabled    = true;

  const res = await apiRequest("/api/listings", "POST", {
    seller_id:          currentUserId,
    zone_id:            1,
    slot_id:            slotMap[slot] || 1,
    energy_source_id:   sourceMap[source] || 1,
    units_available_kwh: units,
    price_per_kwh:      price,
    listing_date:       today,
  });

  btn.textContent = "Publish Listing";
  btn.disabled    = false;

  if (res) {
    showToast("Listing published!", "success");
    e.target.reset();
    document.getElementById("sellPreview").style.display = "none";
    loadListings();
    setMode("buy");
  }
}

/* ===================== SELL PREVIEW ===================== */
function updateSellPreview() {
  const units    = parseFloat(document.getElementById("sellUnits")?.value) || 0;
  const price    = parseFloat(document.getElementById("sellPrice")?.value) || 0;
  const preview  = document.getElementById("sellPreview");
  const revenue  = document.getElementById("spRevenue");
  const feeEl    = document.getElementById("spFee");
  const netEl    = document.getElementById("spNet");

  if (!units || !price) {
    if (preview) preview.style.display = "none";
    return;
  }

  const rev = (units * price).toFixed(2);
  const fee = (rev * 0.025).toFixed(2);
  const net = (rev - fee).toFixed(2);

  if (preview)  preview.style.display = "block";
  if (revenue)  revenue.textContent   = `₹${rev}`;
  if (feeEl)    feeEl.textContent     = `₹${fee}`;
  if (netEl)    netEl.textContent     = `₹${net}`;
}

/* ===================== BUY / SELL MODE TOGGLE ===================== */
function setMode(mode) {
  const buyMode   = document.getElementById("buyMode");
  const sellMode  = document.getElementById("sellMode");
  const buyBtn    = document.getElementById("buyModeBtn");
  const sellBtn   = document.getElementById("sellModeBtn");
  const filterArea = document.getElementById("filterArea");

  if (mode === "buy") {
    buyMode?.style && (buyMode.style.display = "block");
    sellMode?.style && (sellMode.style.display = "none");
    buyBtn?.classList.add("active");
    sellBtn?.classList.remove("active");
    filterArea?.style && (filterArea.style.display = "flex");
  } else {
    buyMode?.style && (buyMode.style.display = "none");
    sellMode?.style && (sellMode.style.display = "block");
    sellBtn?.classList.add("active");
    buyBtn?.classList.remove("active");
    filterArea?.style && (filterArea.style.display = "none");
  }
}

/* ===================== WALLET ===================== */
function updateWalletUI() {
  const fmt = `₹${walletBalance.toFixed(2)}`;
  const els = ["walletBalance", "walletBalanceDisplay", "statWallet"];
  els.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = fmt;
  });
}

async function loadWalletData() {
  if (!currentUserId) return;
  const data = await apiRequest(`/api/users/${currentUserId}/wallet`);
  if (data) {
    walletBalance = parseFloat(data.wallet_balance || walletBalance);
    updateWalletUI();
    renderRechargeHistory(data.recharge_history || []);
  }
}

function renderRechargeHistory(history) {
  const container = document.getElementById("rechargeList");
  if (!container) return;

  if (!history.length) {
    container.innerHTML = `<div style="padding:20px;text-align:center;color:var(--text3);font-size:0.82rem">No recharge history yet.</div>`;
    return;
  }

  container.innerHTML = history.map(item => {
    const pos = item.amount > 0;
    return `
      <div class="recharge-item">
        <div class="ri-icon ${pos ? "s" : "f"}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            ${pos
              ? `<path d="M12 5v14M5 12l7-7 7 7"/>`
              : `<path d="M12 19V5M5 12l7 7 7-7"/>`
            }
          </svg>
        </div>
        <div class="ri-body">
          <div class="ri-method">${item.payment_method || "Wallet"}</div>
          <div class="ri-date">${formatDate(item.created_at || item.date)}</div>
        </div>
        <div class="ri-right">
          <div class="ri-amount ${pos ? "pos" : "neg"}">${pos ? "+" : ""}₹${Math.abs(item.amount).toFixed(2)}</div>
        </div>
      </div>
    `;
  }).join("");
}

/* ===================== RECHARGE ===================== */
function setAmt(val) {
  const el = document.getElementById("rechargeAmount");
  if (el) el.value = val;
}

async function processRecharge() {
  const amtEl  = document.getElementById("rechargeAmount");
  const method = document.querySelector('input[name="pmethod"]:checked')?.value || "UPI";
  const amount = parseFloat(amtEl?.value);

  if (!amount || amount < 50) {
    showToast("Minimum recharge is ₹50.", "error");
    return;
  }
  if (!currentUserId) { showToast("Please log in first.", "error"); return; }

  const btn = document.querySelector("#rechargeModal .modal-btn.confirm");
  if (btn) { btn.textContent = "Processing…"; btn.disabled = true; }

  const res = await apiRequest("/api/wallet/recharge", "POST", {
    user_id:        currentUserId,
    amount,
    payment_method: method,
  });

  if (btn) { btn.textContent = "Add Money"; btn.disabled = false; }

  if (res) {
    walletBalance += amount;
    updateWalletUI();
    closeModal("rechargeModal");
    if (amtEl) amtEl.value = "";
    showToast(`₹${amount.toFixed(2)} added to wallet!`, "success");
    renderRechargeHistory(res.recharge_history || []);
  }
}

/* ===================== TRANSACTIONS ===================== */
async function loadTransactions() {
  if (!currentUserId) return;
  const data = await apiRequest(`/api/orders?user_id=${currentUserId}`);
  if (data) renderTransactions(data);
}

function renderTransactions(orders) {
  const body = document.getElementById("txBody");
  if (!body) return;

  if (!orders.length) {
    body.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text3)">No transactions yet.</td></tr>`;
    return;
  }

  body.innerHTML = orders.map(o => {
    const status = (o.status || "completed").toLowerCase();
    const statusClass = status === "completed" ? "s-completed"
                      : status === "pending"   ? "s-pending"
                      : "s-failed";
    return `
      <tr>
        <td>#${o.order_id || o.id}</td>
        <td class="td-name">${o.buyer_name || currentUser.name}</td>
        <td class="td-name">${o.seller_name || "—"}</td>
        <td>${parseFloat(o.units_requested_kwh || o.units || 0).toFixed(2)}</td>
        <td>₹${parseFloat(o.amount_charged || o.total || 0).toFixed(2)}</td>
        <td>₹${parseFloat(o.platform_fee || o.fee || 0).toFixed(2)}</td>
        <td><span class="status-chip ${statusClass}">${status}</span></td>
        <td>${formatDate(o.created_at || o.date)}</td>
      </tr>
    `;
  }).join("");

  // Update summary cards
  const bought = orders.filter(o => o.buyer_id === currentUserId || o.buyer_name === currentUser.name);
  const sold   = orders.filter(o => o.seller_id === currentUserId || o.seller_name === currentUser.name);

  const totalBought = bought.reduce((s, o) => s + parseFloat(o.amount_charged || 0), 0);
  const totalSold   = sold.reduce((s, o) => s + parseFloat(o.amount_charged || 0), 0);

  const purch = document.querySelector(".tx-sum-card.green .txs-val");
  const soldEl = document.querySelector(".tx-sum-card.blue .txs-val");
  const countEl = document.querySelector(".tx-sum-card.orange .txs-val");
  if (purch)  purch.textContent  = `₹${totalBought.toFixed(0)}`;
  if (soldEl) soldEl.textContent = `₹${totalSold.toFixed(0)}`;
  if (countEl) countEl.textContent = orders.length;

  // Update dashboard stat cards too
  const statBought = document.getElementById("statBought");
  const statSold   = document.getElementById("statSold");
  if (statBought) {
    const kwhBought = bought.reduce((s, o) => s + parseFloat(o.units_requested_kwh || o.units || 0), 0);
    statBought.textContent = `${kwhBought.toFixed(2)} kWh`;
  }
  if (statSold) {
    const kwhSold = sold.reduce((s, o) => s + parseFloat(o.units_requested_kwh || o.units || 0), 0);
    statSold.textContent = `${kwhSold.toFixed(2)} kWh`;
  }
}

/* ===================== EXPORT CSV ===================== */
function exportCSV() {
  const table = document.getElementById("txTable");
  if (!table) return;

  const rows = [...table.querySelectorAll("tr")].map(row =>
    [...row.querySelectorAll("th,td")].map(cell =>
      `"${cell.textContent.trim().replace(/"/g, '""')}"`
    ).join(",")
  );

  const blob = new Blob([rows.join("\n")], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = "voltshare_transactions.csv";
  a.click();
  URL.revokeObjectURL(url);
  showToast("CSV exported!", "success");
}

/* ===================== MODAL HELPERS ===================== */
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add("show");
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove("show");
}

/* ===================== DATE FORMATTER ===================== */
function formatDate(str) {
  if (!str) return "—";
  const d = new Date(str);
  if (isNaN(d)) return str;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

/* ===================== CANVAS ANIMATION ===================== */
function initCanvas() {
  const canvas = document.getElementById("energyCanvas");
  if (!canvas) return;

  const ctx    = canvas.getContext("2d");
  let W, H;
  const particles = [];

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x    = Math.random() * W;
      this.y    = Math.random() * H;
      this.vx   = (Math.random() - 0.5) * 0.4;
      this.vy   = (Math.random() - 0.5) * 0.4;
      this.r    = Math.random() * 2 + 0.5;
      this.alpha = Math.random() * 0.5 + 0.1;
      this.color = Math.random() > 0.5 ? "16,217,160" : "14,165,233";
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset();
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.color},${this.alpha})`;
      ctx.fill();
    }
  }

  for (let i = 0; i < 80; i++) particles.push(new Particle());

  function animate() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx   = particles[i].x - particles[j].x;
        const dy   = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(16,217,160,${0.08 * (1 - dist / 100)})`;
          ctx.lineWidth   = 0.5;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(animate);
  }
  animate();
}

/* ===================== INIT ===================== */
document.addEventListener("DOMContentLoaded", () => {
  /* Landing → Auth */
  document.getElementById("enterBtn")?.addEventListener("click", () => {
    showScreen("auth-screen");
  });

  /* Canvas */
  initCanvas();

  /* Sidebar nav */
  document.querySelectorAll(".nav-item").forEach(a => {
    a.addEventListener("click", e => {
      e.preventDefault();
      navigateTo(a.dataset.page);
    });
  });

  /* Filter chips */
  document.querySelectorAll(".filter-chip").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-chip").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.filter || "all";
      applyFilters();
    });
  });

  /* Slot filter */
  document.getElementById("slotFilter")?.addEventListener("change", e => {
    currentSlotFilter = e.target.value;
    applyFilters();
  });

  /* Sell form preview */
  ["sellUnits", "sellPrice"].forEach(id => {
    document.getElementById(id)?.addEventListener("input", updateSellPreview);
  });

  /* Password strength */
  document.getElementById("signupPassword")?.addEventListener("input", e => {
    checkPassStrength(e.target.value);
  });

  /* Close modal on overlay click */
  document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", e => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });

  console.log("VoltShare loaded ✓");
});
