const API = "http://localhost:3000";

// ================= SIGNUP =================
async function signup() {
  const name = document.getElementById("signupName").value;
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;
  const role = document.getElementById("signupRole").value;

  const res = await fetch(`${API}/signup`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ name, email, password, role })
  });

  const data = await res.json();
  alert(data.message);
}

// ================= LOGIN =================
async function login() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  const res = await fetch(`${API}/login`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();

  if (res.ok) {
    localStorage.setItem("userId", data.user.user_id);
    showDashboard();
  } else {
    alert("Login failed");
  }
}

// ================= SHOW DASHBOARD =================
function showDashboard() {
  document.getElementById("auth").style.display = "none";
  document.getElementById("dashboard").style.display = "block";
  loadDashboard();
}

// ================= LOAD DASHBOARD =================
async function loadDashboard() {
  const userId = localStorage.getItem("userId");

  const res = await fetch(`${API}/dashboard/${userId}`);
  const data = await res.json();

  document.getElementById("bought").innerText = data.consumed || 0;
  document.getElementById("sold").innerText = data.produced || 0;
  document.getElementById("wallet").innerText = "₹" + (data.wallet || 0);
}

// ================= LOAD LISTINGS =================
async function loadListings() {
  const res = await fetch(`${API}/listings`);
  const listings = await res.json();

  const div = document.getElementById("listings");
  div.innerHTML = "";

  listings.forEach(l => {
    div.innerHTML += `
      <div>
        ${l.units_available_kwh} kWh - ₹${l.price_per_kwh}
      </div>
    `;
  });
}

// ================= SELL ENERGY =================
async function sellEnergy() {
  const units = document.getElementById("sellUnits").value;
  const price = document.getElementById("sellPrice").value;
  const userId = localStorage.getItem("userId");

  const res = await fetch(`${API}/listings`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      seller_id: userId,
      units,
      price
    })
  });

  const data = await res.json();
  alert(data.message);
}

// ================= LOGOUT =================
function logout() {
  localStorage.removeItem("userId");
  location.reload();
}
