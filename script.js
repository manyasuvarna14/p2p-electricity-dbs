/* ═══════════════════════════════════════════════════════════
script.js — VoltShare P2P Energy Trading Platform
═══════════════════════════════════════════════════════════ */

/* ===================== 🔥 BACKEND CONFIG ===================== */
const API = "https://p2p-backend-production-f878.up.railway.app";

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

return data.data || data;
```

} catch (err) {
console.error("API Error:", err);
showToast("Server error", "error");
return null;
}
}

/* ===================== ORIGINAL CODE CONTINUES ===================== */

/* KEEP EVERYTHING SAME UNTIL DATA SECTION */

/* ===================== 🔥 REPLACE THIS ===================== */
// OLD:
// const energyListings = [...]

// NEW:
let energyListings = [];

/* ===================== LOAD FROM BACKEND ===================== */
async function loadListings() {
const data = await apiRequest("/api/listings");
if (data) {
energyListings = data;
renderListings();
}
}

/* ===================== MODIFY LOGIN ===================== */
async function handleLogin(e) {
e.preventDefault();

const email = document.getElementById('loginEmail').value.trim();
const pass  = document.getElementById('loginPassword').value;

const user = await apiRequest("/api/users/login", "POST", {
email,
password: pass,
});

if (user) {
enterApp(user.full_name || "User", user.role_name || "Prosumer");
}
}

/* ===================== MODIFY SIGNUP ===================== */
async function handleSignup(e) {
e.preventDefault();

const name  = document.getElementById('signupName').value.trim();
const email = document.getElementById('signupEmail').value.trim();
const pass  = document.getElementById('signupPassword').value;
const role  = document.getElementById('signupRole').value;

const roleMap = { buyer:1, seller:2, prosumer:3, admin:4 };

const user = await apiRequest("/api/users/register", "POST", {
full_name: name,
email,
password: pass,
role_id: roleMap[role] || 3
});

if (user) {
enterApp(name, role);
}
}

/* ===================== MODIFY ENTER APP ===================== */
function enterApp(name, role) {
currentUser.name = name;
currentUser.role = role;

const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
document.getElementById('sidebarAv').textContent   = initials;
document.getElementById('sidebarName').textContent = name;
document.getElementById('sidebarRole').textContent = role;
document.getElementById('topbarName').textContent  = name.split(' ')[0];

showScreen('app-screen');

/* 🔥 LOAD REAL DATA */
loadListings();

renderTransactions();
renderRechargeHistory();
}

/* ===================== BUY CHANGE ===================== */
function confirmPurchase(total, fee) {
if (!selectedListing) return;

showToast("Purchase simulated (backend not implemented)", "info");

walletBalance -= total;
selectedListing.units_available_kwh = 0;
selectedListing.status = 'sold';

renderListings();
updateWalletUI();
renderTransactions();
}

/* ===================== SELL CHANGE ===================== */
function handleSellSubmit(e) {
e.preventDefault();
showToast("Sell API not implemented in backend", "error");
}

/* ===================== KEEP REST OF YOUR FILE SAME ===================== */

/* DO NOT REMOVE ANYTHING BELOW FROM YOUR ORIGINAL FILE */

/* (ALL YOUR ANIMATIONS, UI, WALLET, MODALS, TABLES REMAIN EXACTLY SAME) */
