/* ═══════════════════════════════════════════════════════════
VoltShare — FULL script.js (Backend Integrated)
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

```
const data = await res.json();
if (!res.ok) throw new Error(data.message || "API error");

return data.data;
```

} catch (err) {
console.error("API Error:", err);
showToast("Server error", "error");
return null;
}
}

/* ===================== GLOBAL STATE ===================== */
let energyListings = [];
let selectedListing = null;
let walletBalance = 0;

const currentUser = {
name: "",
role: ""
};

/* ===================== LOGIN ===================== */
async function handleLogin(e) {
e.preventDefault();

const email = document.getElementById("loginEmail").value.trim();
const pass  = document.getElementById("loginPassword").value;

const user = await apiRequest("/api/users/login", "POST", {
email,
password: pass
});

if (user) {
walletBalance = user.wallet_balance || 0;
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

const roleMap = {
buyer: 1,
seller: 2,
prosumer: 3,
admin: 4
};

const res = await apiRequest("/api/users/register", "POST", {
full_name: name,
email,
password: pass,
role_id: roleMap[role] || 3
});

if (res) {
walletBalance = 0;
enterApp(name, role);
}
}

/* ===================== ENTER APP ===================== */
function enterApp(name, role) {
currentUser.name = name;
currentUser.role = role;

const initials = name.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase();

document.getElementById("sidebarAv").textContent = initials;
document.getElementById("sidebarName").textContent = name;
document.getElementById("sidebarRole").textContent = role;
document.getElementById("topbarName").textContent = name.split(" ")[0];

showScreen("app-screen");

updateWalletUI();
loadListings();
}

/* ===================== LOAD LISTINGS ===================== */
async function loadListings() {
const grid = document.getElementById("listingsGrid");
if (grid) grid.innerHTML = "Loading...";

const data = await apiRequest("/api/listings");

console.log("LISTINGS:", data);

if (data) {
energyListings = data;
renderListings();
} else {
if (grid) grid.innerHTML = "Failed to load listings";
}
}

/* ===================== RENDER LISTINGS ===================== */
function renderListings() {
const grid = document.getElementById("listingsGrid");
if (!grid) return;

grid.innerHTML = "";

energyListings.forEach(listing => {
const card = document.createElement("div");
card.className = "listing-card";

```
card.innerHTML = `
  <h3>${listing.source_name || "Energy"}</h3>
  <p><strong>Units:</strong> ${listing.units_available_kwh} kWh</p>
  <p><strong>Price:</strong> ₹${listing.price_per_kwh}</p>
  <p><strong>Seller:</strong> ${listing.seller_id || "User"}</p>
  <button onclick="selectListing(${listing.listing_id})">
    ${listing.units_available_kwh > 0 ? "Buy" : "Sold"}
  </button>
`;

grid.appendChild(card);
```

});
}

/* ===================== SELECT LISTING ===================== */
function selectListing(id) {
selectedListing = energyListings.find(l => l.listing_id === id);
showToast("Listing selected", "success");
}

/* ===================== BUY (SIMULATED) ===================== */
function confirmPurchase() {
if (!selectedListing) return;

const total = selectedListing.units_available_kwh * selectedListing.price_per_kwh;

walletBalance -= total;
selectedListing.units_available_kwh = 0;
selectedListing.status = "sold";

showToast("Purchase simulated (backend missing)", "info");

updateWalletUI();
renderListings();
}

/* ===================== SELL ===================== */
function handleSellSubmit(e) {
e.preventDefault();
showToast("Sell feature not implemented yet", "error");
}

/* ===================== WALLET ===================== */
function updateWalletUI() {
const el = document.getElementById("walletBalance");
if (el) el.textContent = `₹${walletBalance.toFixed(2)}`;
}

/* ===================== TOAST ===================== */
function showToast(msg, type = "info") {
console.log(type.toUpperCase(), msg);
}

/* ===================== SCREEN NAV ===================== */
function showScreen(id) {
document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
document.getElementById(id)?.classList.add("active");
}

/* ===================== INIT ===================== */
document.addEventListener("DOMContentLoaded", () => {
console.log("App loaded");
});
