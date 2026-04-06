/* ═══════════════════════════════════════════════════════
   script.js — VoltShare P2P Energy Trading Platform
   Beginner-friendly, well-commented JavaScript
   All data mirrors the MySQL schema structure exactly
═══════════════════════════════════════════════════════ */

// ──────────────────────────────────────────────────────
// 1. DUMMY DATA (mirrors MySQL schema field names exactly)
// ──────────────────────────────────────────────────────

// ── energy_listings table rows ──
const energyListings = [
  {
    listing_id: 1,
    seller_id: 3,
    seller_name: "Suresh Shetty",     // Joined from users table
    zone_id: 1,
    zone_code: "UDC-01",              // Joined from grid_zones table
    slot_id: 2,
    slot_name: "Day Standard",        // Joined from time_slots table
    energy_source_id: 1,
    source_type: "solar",             // Joined from renewable_sources table
    units_available_kwh: 10.50,
    price_per_kwh: 5.50,
    status: "active",
    listing_date: "2025-04-06",
    expires_at: "2025-04-07 10:00:00"
  },
  {
    listing_id: 2,
    seller_id: 5,
    seller_name: "Ananya Menon",
    zone_id: 1,
    zone_code: "UDC-01",
    slot_id: 1,
    slot_name: "Morning Peak",
    energy_source_id: 2,
    source_type: "wind",
    units_available_kwh: 25.00,
    price_per_kwh: 4.80,
    status: "active",
    listing_date: "2025-04-06",
    expires_at: "2025-04-06 22:00:00"
  },
  {
    listing_id: 3,
    seller_id: 7,
    seller_name: "Dev Patil",
    zone_id: 2,
    zone_code: "MNG-E1",
    slot_id: 2,
    slot_name: "Day Standard",
    energy_source_id: 3,
    source_type: "biogas",
    units_available_kwh: 8.75,
    price_per_kwh: 5.00,
    status: "active",
    listing_date: "2025-04-06",
    expires_at: "2025-04-06 20:00:00"
  },
  {
    listing_id: 4,
    seller_id: 9,
    seller_name: "Kavitha Rao",
    zone_id: 1,
    zone_code: "UDC-01",
    slot_id: 3,
    slot_name: "Evening Peak",
    energy_source_id: 1,
    source_type: "solar",
    units_available_kwh: 15.00,
    price_per_kwh: 6.20,
    status: "active",
    listing_date: "2025-04-06",
    expires_at: "2025-04-07 00:00:00"
  },
  {
    listing_id: 5,
    seller_id: 11,
    seller_name: "Mohan Gowda",
    zone_id: 2,
    zone_code: "MNG-E1",
    slot_id: 4,
    slot_name: "Night Off-Peak",
    energy_source_id: 2,
    source_type: "wind",
    units_available_kwh: 30.00,
    price_per_kwh: 3.90,
    status: "active",
    listing_date: "2025-04-06",
    expires_at: "2025-04-07 06:00:00"
  },
  {
    listing_id: 6,
    seller_id: 13,
    seller_name: "Preethi Naik",
    zone_id: 1,
    zone_code: "UDC-01",
    slot_id: 1,
    slot_name: "Morning Peak",
    energy_source_id: 3,
    source_type: "biogas",
    units_available_kwh: 0,            // Sold out
    price_per_kwh: 5.25,
    status: "sold",
    listing_date: "2025-04-05",
    expires_at: "2025-04-06 10:00:00"
  }
];

// ── transactions table rows ──
const transactions = [
  {
    transaction_id: 101,
    match_id: 201,
    buyer_id: 1,
    buyer_name: "Ravi Kumar",
    seller_id: 3,
    seller_name: "Suresh Shetty",
    amount: 57.75,                    // units × price
    units_kwh: 10.50,
    platform_fee: 1.44,
    tax_amount: 5.19,
    net_seller_amount: 56.31,
    status: "completed",
    created_at: "2025-04-05 09:15:00"
  },
  {
    transaction_id: 102,
    match_id: 202,
    buyer_id: 1,
    buyer_name: "Ravi Kumar",
    seller_id: 5,
    seller_name: "Ananya Menon",
    amount: 120.00,
    units_kwh: 25.00,
    platform_fee: 3.00,
    tax_amount: 10.80,
    net_seller_amount: 117.00,
    status: "completed",
    created_at: "2025-04-04 14:30:00"
  },
  {
    transaction_id: 103,
    match_id: 203,
    buyer_id: 2,
    buyer_name: "Priya Nair",
    seller_id: 7,
    seller_name: "Dev Patil",
    amount: 43.75,
    units_kwh: 8.75,
    platform_fee: 1.09,
    tax_amount: 3.94,
    net_seller_amount: 42.66,
    status: "completed",
    created_at: "2025-04-03 11:00:00"
  },
  {
    transaction_id: 104,
    match_id: 204,
    buyer_id: 4,
    buyer_name: "Divya Shenoy",
    seller_id: 9,
    seller_name: "Kavitha Rao",
    amount: 93.00,
    units_kwh: 15.00,
    platform_fee: 2.33,
    tax_amount: 8.37,
    net_seller_amount: 90.67,
    status: "pending",
    created_at: "2025-04-06 08:45:00"
  },
  {
    transaction_id: 105,
    match_id: 205,
    buyer_id: 6,
    buyer_name: "Arjun Shetty",
    seller_id: 11,
    seller_name: "Mohan Gowda",
    amount: 117.00,
    units_kwh: 30.00,
    platform_fee: 2.93,
    tax_amount: 10.53,
    net_seller_amount: 114.08,
    status: "failed",
    created_at: "2025-04-02 22:30:00"
  },
  {
    transaction_id: 106,
    match_id: 206,
    buyer_id: 1,
    buyer_name: "Ravi Kumar",
    seller_id: 13,
    seller_name: "Preethi Naik",
    amount: 65.63,
    units_kwh: 12.50,
    platform_fee: 1.64,
    tax_amount: 5.91,
    net_seller_amount: 63.99,
    status: "completed",
    created_at: "2025-04-01 18:00:00"
  }
];

// ── wallets table row (current user) ──
const walletData = {
  wallet_id: 1001,
  user_id: 1,
  balance: 4200.00,
  currency: "INR",
  last_updated: "2025-04-06 07:00:00"
};

// ── wallet_recharge_logs table rows ──
const rechargeLogs = [
  {
    recharge_id: 1,
    wallet_id: 1001,
    amount: 1000.00,
    payment_method: "UPI",
    gateway_reference: "UPI2025040501",
    status: "success",
    initiated_at: "2025-04-05 09:00:00"
  },
  {
    recharge_id: 2,
    wallet_id: 1001,
    amount: 2000.00,
    payment_method: "Card",
    gateway_reference: "CARD20250403X",
    status: "success",
    initiated_at: "2025-04-03 17:30:00"
  },
  {
    recharge_id: 3,
    wallet_id: 1001,
    amount: 500.00,
    payment_method: "Net Banking",
    gateway_reference: "NB20250401Q",
    status: "success",
    initiated_at: "2025-04-01 10:15:00"
  },
  {
    recharge_id: 4,
    wallet_id: 1001,
    amount: 300.00,
    payment_method: "UPI",
    gateway_reference: "UPI20250330Z",
    status: "failed",
    initiated_at: "2025-03-30 20:45:00"
  }
];

// ─────────────────────────────────────────────────────
// 2. STATE — variables to track app state
// ─────────────────────────────────────────────────────
let currentFilter = "all";       // Active source filter (solar/wind/biogas/all)
let currentSlot   = "all";       // Active slot filter
let selectedListing = null;      // Listing chosen for buying
let walletBalance = walletData.balance; // Current balance (in memory)

// ─────────────────────────────────────────────────────
// 3. NAVIGATION
// ─────────────────────────────────────────────────────
const pageTitles = {
  dashboard:    { title: "Energy Marketplace",   sub: "Live listings in your grid zone" },
  transactions: { title: "Transactions",          sub: "Your complete trade history" },
  wallet:       { title: "My Wallet",             sub: "Balance, payments & recharge history" }
};

// Attach click handlers to sidebar nav links
document.querySelectorAll(".nav-item").forEach(navItem => {
  navItem.addEventListener("click", function (e) {
    e.preventDefault();
    const pageName = this.dataset.page;
    navigateTo(pageName);
  });
});

function navigateTo(pageName) {
  // Update active nav item
  document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
  document.querySelector(`[data-page="${pageName}"]`).classList.add("active");

  // Show the correct page section, hide others
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(`page-${pageName}`).classList.add("active");

  // Update topbar title and subtitle
  const info = pageTitles[pageName];
  document.getElementById("page-title").textContent = info.title;
  document.getElementById("page-sub").textContent   = info.sub;
}

// ─────────────────────────────────────────────────────
// 4. DASHBOARD — Render Energy Listings
// ─────────────────────────────────────────────────────

// Source icons and colors for display
const sourceIcons  = { solar: "☀", wind: "💨", biogas: "🌿" };
const glowColors   = { solar: "#ffb800", wind: "#00b4ff", biogas: "#00e5a0" };

// Render the listing cards based on current filters
function renderListings() {
  const grid = document.getElementById("listingsGrid");
  grid.innerHTML = ""; // Clear existing cards

  // Apply source & slot filters
  const filtered = energyListings.filter(l => {
    const matchSource = (currentFilter === "all" || l.source_type === currentFilter);
    const matchSlot   = (currentSlot   === "all" || l.slot_name   === currentSlot);
    return matchSource && matchSlot;
  });

  // Show empty state if no results
  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚡</div>
        <div class="empty-text">No listings match your filter.</div>
      </div>`;
    return;
  }

  // Build and insert each card
  filtered.forEach((listing, index) => {
    const card = buildListingCard(listing, index);
    grid.appendChild(card);
  });

  // Update stat counters
  const activeListings = filtered.filter(l => l.status === "active");
  const totalUnits     = activeListings.reduce((sum, l) => sum + l.units_available_kwh, 0);
  document.getElementById("stat-listings").textContent = activeListings.length;
  document.getElementById("stat-units").textContent    = totalUnits.toFixed(1);
}

// Build a single listing card DOM element
function buildListingCard(listing, index) {
  const isSold    = listing.status === "sold" || listing.units_available_kwh <= 0;
  const srcType   = listing.source_type;
  const initials  = listing.seller_name.split(" ").map(w => w[0]).join(""); // e.g. "SS"
  const totalCost = (listing.units_available_kwh * listing.price_per_kwh).toFixed(2);

  // Create card element
  const card = document.createElement("div");
  card.className = "listing-card";
  card.style.animationDelay = `${index * 0.07}s`;

  card.innerHTML = `
    <!-- Background glow effect -->
    <div class="card-glow" style="background:${glowColors[srcType]}"></div>

    <!-- Top row: source badge + slot -->
    <div class="card-top">
      <div class="source-badge ${srcType}">
        ${sourceIcons[srcType]} ${srcType.toUpperCase()}
      </div>
      <div class="slot-badge">${listing.slot_name}</div>
    </div>

    <!-- Seller Info (seller_id from energy_listings, joined with users) -->
    <div class="card-seller">
      <div class="seller-label">Seller</div>
      <div class="seller-name">${listing.seller_name}</div>
      <div class="seller-id">seller_id: ${listing.seller_id} · listing_id: ${listing.listing_id}</div>
    </div>

    <!-- Key stats: units_available_kwh and price_per_kwh -->
    <div class="card-stats">
      <div class="cstat">
        <div class="cstat-label">Units Available</div>
        <div class="cstat-val">${listing.units_available_kwh.toFixed(2)} <small style="font-size:0.65rem;color:var(--text3)">kWh</small></div>
      </div>
      <div class="cstat">
        <div class="cstat-label">Price / kWh</div>
        <div class="cstat-val price">₹${listing.price_per_kwh.toFixed(2)}</div>
      </div>
    </div>

    <!-- Footer: zone + buy button -->
    <div class="card-footer">
      <div class="listing-zone">Zone: ${listing.zone_code}</div>
      <button class="buy-btn" 
              onclick="openBuyModal(${listing.listing_id})"
              ${isSold ? "disabled" : ""}>
        ${isSold ? "Sold Out" : "Buy Energy"}
      </button>
    </div>

    <!-- Overlay for sold-out listings -->
    ${isSold ? '<div class="sold-overlay">SOLD OUT</div>' : ""}
  `;

  return card;
}

// ─────────────────────────────────────────────────────
// 5. FILTER BUTTONS
// ─────────────────────────────────────────────────────

// Source filter buttons (All / Solar / Wind / Biogas)
document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.addEventListener("click", function () {
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    this.classList.add("active");
    currentFilter = this.dataset.filter;
    renderListings();
  });
});

// Slot dropdown filter
document.getElementById("slotFilter").addEventListener("change", function () {
  currentSlot = this.value;
  renderListings();
});

// ─────────────────────────────────────────────────────
// 6. BUY MODAL
// ─────────────────────────────────────────────────────

function openBuyModal(listingId) {
  // Find the listing object by its id
  selectedListing = energyListings.find(l => l.listing_id === listingId);
  if (!selectedListing) return;

  const platformFee = +(selectedListing.price_per_kwh * selectedListing.units_available_kwh * 0.025).toFixed(2);
  const totalCost   = +(selectedListing.price_per_kwh * selectedListing.units_available_kwh + platformFee).toFixed(2);
  const canAfford   = walletBalance >= totalCost;

  // Fill modal with listing details
  document.getElementById("modalBody").innerHTML = `
    <div class="modal-row">
      <span class="modal-row-label">Seller</span>
      <span class="modal-row-val">${selectedListing.seller_name} (ID: ${selectedListing.seller_id})</span>
    </div>
    <div class="modal-row">
      <span class="modal-row-label">Source Type</span>
      <span class="modal-row-val">${sourceIcons[selectedListing.source_type]} ${selectedListing.source_type.toUpperCase()}</span>
    </div>
    <div class="modal-row">
      <span class="modal-row-label">Units (kWh)</span>
      <span class="modal-row-val">${selectedListing.units_available_kwh.toFixed(2)} kWh</span>
    </div>
    <div class="modal-row">
      <span class="modal-row-label">Price / kWh</span>
      <span class="modal-row-val highlight">₹${selectedListing.price_per_kwh.toFixed(2)}</span>
    </div>
    <div class="modal-row">
      <span class="modal-row-label">Time Slot</span>
      <span class="modal-row-val">${selectedListing.slot_name}</span>
    </div>
    <div class="modal-row">
      <span class="modal-row-label">Grid Zone</span>
      <span class="modal-row-val">${selectedListing.zone_code}</span>
    </div>
    <hr class="modal-divider"/>
    <div class="modal-row">
      <span class="modal-row-label">Platform Fee (2.5%)</span>
      <span class="modal-row-val">₹${platformFee.toFixed(2)}</span>
    </div>
    <div class="modal-row">
      <span class="modal-row-label">Total Payable</span>
      <span class="modal-row-val green" style="font-size:1.05rem;font-weight:700">₹${totalCost.toFixed(2)}</span>
    </div>
    <div class="modal-row" style="background:${canAfford ? 'rgba(0,229,160,.06)' : 'rgba(255,77,106,.06)'}">
      <span class="modal-row-label">Wallet Balance</span>
      <span class="modal-row-val" style="color:${canAfford ? 'var(--green)' : 'var(--red)'}">₹${walletBalance.toFixed(2)}</span>
    </div>
    ${!canAfford ? `<div style="font-size:0.78rem;color:var(--red);text-align:center;padding:4px 0">
      ⚠ Insufficient balance — please recharge your wallet
    </div>` : ""}
  `;

  // Configure confirm button
  const confirmBtn = document.getElementById("confirmBuyBtn");
  confirmBtn.disabled = !canAfford;
  confirmBtn.onclick  = canAfford ? () => confirmPurchase(totalCost, platformFee) : null;

  openModal("buyModal");
}

function confirmPurchase(totalCost, platformFee) {
  if (!selectedListing) return;

  // Simulate: deduct from wallet balance
  walletBalance -= totalCost;

  // Mark listing as sold (in memory — in real app, this hits the DB)
  selectedListing.units_available_kwh = 0;
  selectedListing.status = "sold";

  // Add a new transaction record (simulating INSERT INTO transactions)
  const newTx = {
    transaction_id: 200 + Math.floor(Math.random() * 1000),
    match_id: 300 + Math.floor(Math.random() * 100),
    buyer_id: 1,
    buyer_name: "Ravi Kumar",
    seller_id: selectedListing.seller_id,
    seller_name: selectedListing.seller_name,
    amount: totalCost,
    units_kwh: selectedListing.units_available_kwh || 10,
    platform_fee: platformFee,
    tax_amount: +(totalCost * 0.09).toFixed(2),
    net_seller_amount: +(totalCost - platformFee).toFixed(2),
    status: "completed",
    created_at: new Date().toISOString().slice(0, 19).replace("T", " ")
  };
  transactions.unshift(newTx); // Add to top of list

  closeModal("buyModal");
  showToast(`✅ Purchase successful! ₹${totalCost.toFixed(2)} debited from wallet.`, "success");

  // Re-render to show listing as sold
  renderListings();
  updateWalletDisplay();
}

// ─────────────────────────────────────────────────────
// 7. TRANSACTIONS TABLE
// ─────────────────────────────────────────────────────

function renderTransactions() {
  const tbody = document.getElementById("txBody");
  tbody.innerHTML = "";

  transactions.forEach(tx => {
    const statusClass = {
      completed: "status-completed",
      pending:   "status-pending",
      failed:    "status-failed"
    }[tx.status] || "status-pending";

    // Format date nicely
    const dateStr = tx.created_at.slice(0, 10);

    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="tx-id">#${tx.transaction_id}</td>
      <td class="tx-buyer">${tx.buyer_name}</td>
      <td class="tx-seller">${tx.seller_name}</td>
      <td style="font-family:var(--font-mono)">${(tx.units_kwh || 0).toFixed(2)}</td>
      <td class="tx-amount">₹${tx.amount.toFixed(2)}</td>
      <td class="tx-fee">₹${(tx.platform_fee || 0).toFixed(2)}</td>
      <td><span class="status-chip ${statusClass}">${tx.status}</span></td>
      <td style="color:var(--text3);font-family:var(--font-mono);font-size:0.72rem">${dateStr}</td>
    `;
    tbody.appendChild(row);
  });
}

// Export transactions as CSV file
function exportCSV() {
  const headers = ["Tx ID", "Buyer", "Seller", "Units (kWh)", "Amount (₹)", "Platform Fee", "Status", "Date"];
  const rows = transactions.map(tx => [
    tx.transaction_id,
    tx.buyer_name,
    tx.seller_name,
    (tx.units_kwh || 0).toFixed(2),
    tx.amount.toFixed(2),
    (tx.platform_fee || 0).toFixed(2),
    tx.status,
    tx.created_at.slice(0, 10)
  ]);

  const csvContent = [headers, ...rows].map(r => r.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "transactions.csv";
  link.click();

  showToast("📥 Transactions exported as CSV", "info");
}

// ─────────────────────────────────────────────────────
// 8. WALLET PAGE
// ─────────────────────────────────────────────────────

function updateWalletDisplay() {
  // Update balance shown in wallet card
  document.getElementById("walletBalance").textContent = `₹${walletBalance.toFixed(2)}`;
  // Also update the stat card on dashboard
  document.querySelectorAll(".stat-value")[3].textContent = `₹${walletBalance.toFixed(0)}`;
}

function renderRechargeHistory() {
  const list = document.getElementById("rechargeList");
  list.innerHTML = "";

  const methodIcons = {
    "UPI": "📱",
    "Card": "💳",
    "Net Banking": "🏦"
  };

  rechargeLogs.forEach(log => {
    const iconClass = log.status === "success" ? "success"
                    : log.status === "failed"  ? "fail"
                    : "pending";

    const item = document.createElement("div");
    item.className = "recharge-item";
    item.innerHTML = `
      <div class="ri-icon ${iconClass}">${methodIcons[log.payment_method] || "💰"}</div>
      <div class="ri-body">
        <div class="ri-method">${log.payment_method}</div>
        <div class="ri-date">${log.initiated_at}</div>
        <div class="ri-ref">Ref: ${log.gateway_reference}</div>
      </div>
      <div class="ri-right">
        <div class="ri-amount" style="color:${log.status === 'failed' ? 'var(--red)' : 'var(--green)'}">
          ${log.status === 'failed' ? '✕' : '+'} ₹${log.amount.toFixed(2)}
        </div>
        <div class="ri-status">
          <span class="status-chip status-${log.status}">${log.status}</span>
        </div>
      </div>
    `;
    list.appendChild(item);
  });
}

// Open the recharge modal
function openRecharge() {
  document.getElementById("rechargeAmount").value = "";
  openModal("rechargeModal");
}

// Set a quick amount in the input field
function setAmount(amount) {
  document.getElementById("rechargeAmount").value = amount;
}

// Process a wallet recharge
function processRecharge() {
  const amtInput = document.getElementById("rechargeAmount");
  const amount   = parseFloat(amtInput.value);

  // Validate input
  if (isNaN(amount) || amount < 50) {
    showToast("⚠ Please enter a valid amount (minimum ₹50)", "error");
    return;
  }
  if (amount > 50000) {
    showToast("⚠ Maximum recharge limit is ₹50,000", "error");
    return;
  }

  // Get selected payment method
  const method = document.querySelector('input[name="method"]:checked')?.value || "upi";
  const methodLabels = { upi: "UPI", card: "Card", netbanking: "Net Banking" };

  // Simulate: add to wallet balance
  walletBalance += amount;

  // Add to recharge log (simulating INSERT INTO wallet_recharge_logs)
  rechargeLogs.unshift({
    recharge_id: 100 + rechargeLogs.length,
    wallet_id: walletData.wallet_id,
    amount: amount,
    payment_method: methodLabels[method],
    gateway_reference: `${method.toUpperCase()}${Date.now()}`,
    status: "success",
    initiated_at: new Date().toISOString().slice(0, 19).replace("T", " ")
  });

  closeModal("rechargeModal");
  showToast(`✅ ₹${amount.toFixed(2)} added to your wallet via ${methodLabels[method]}!`, "success");

  // Refresh wallet UI
  updateWalletDisplay();
  renderRechargeHistory();
}

function showWithdraw() {
  showToast("💡 Withdraw feature coming soon!", "info");
}

// ─────────────────────────────────────────────────────
// 9. MODAL HELPERS
// ─────────────────────────────────────────────────────

function openModal(id) {
  document.getElementById(id).classList.add("show");
}

function closeModal(id) {
  document.getElementById(id).classList.remove("show");
}

// Close modal when clicking on the dark overlay (outside the box)
document.querySelectorAll(".modal-overlay").forEach(overlay => {
  overlay.addEventListener("click", function (e) {
    if (e.target === this) {           // Only close if clicking the backdrop itself
      this.classList.remove("show");
    }
  });
});

// ─────────────────────────────────────────────────────
// 10. TOAST NOTIFICATION
// ─────────────────────────────────────────────────────

function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className   = `toast ${type} show`;

  // Auto-hide after 3.5 seconds
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3500);
}

// Notification bell click
document.getElementById("notifBtn").addEventListener("click", () => {
  showToast("🔔 You have 3 unread notifications", "info");
});

// ─────────────────────────────────────────────────────
// 11. METHOD OPTION TOGGLE (Radio buttons in recharge modal)
// ─────────────────────────────────────────────────────

document.querySelectorAll(".method-opt input").forEach(radio => {
  radio.addEventListener("change", function () {
    document.querySelectorAll(".method-opt").forEach(opt => opt.classList.remove("active"));
    this.parentElement.classList.add("active");
  });
});

// ─────────────────────────────────────────────────────
// 12. INIT — Run everything when the page loads
// ─────────────────────────────────────────────────────

function init() {
  renderListings();       // Draw the dashboard energy listing cards
  renderTransactions();   // Fill in the transactions table
  renderRechargeHistory();// Fill in the wallet recharge list
  updateWalletDisplay();  // Sync wallet balance display
}

// Start the app!
init();
