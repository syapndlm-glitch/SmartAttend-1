// Helper to generate a random 6-character session code
function randomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Global timer state
let timer = 60;
let sessionCode = "";
let timerInterval = null;

// Get target URL for QR Code generation
function getStudentUrl() {
  const base = (typeof SMARTATTEND_PUBLIC_URL === "string" && SMARTATTEND_PUBLIC_URL.trim())
    ? SMARTATTEND_PUBLIC_URL.trim().replace(/\/$/, "") + "/"
    : window.location.href;
  const url = new URL("student.html", base);
  url.search = "";
  url.hash = "";
  const activeCode = localStorage.getItem("sessionCode") || "";
  if (activeCode) url.searchParams.set("session", activeCode);
  return url.href;
}

// Generate QR Code on Teacher Dashboard
function generateQR() {
  const qr = document.getElementById("qrcode");
  if (!qr || typeof QRCode === "undefined") return;
  const target = getStudentUrl();
  qr.innerHTML = "";
  new QRCode(qr, { text: target, width: 128, height: 128 });
}

// Start active 60-second countdown interval
function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  
  updateTimer();
  timerInterval = setInterval(() => {
    if (timer > 0) {
      timer--;
      updateTimer();
    } else {
      generateNewCode(); // Auto-rotate code when timer reaches zero
    }
  }, 1000);
}

// Generate new session code and reset timer
function generateNewCode() {
  sessionCode = randomCode();
  localStorage.setItem("sessionCode", sessionCode);
  timer = 60;
  
  const codeBox = document.getElementById("code");
  if (codeBox) codeBox.innerText = sessionCode;
  
  startTimer();
  generateQR();
}

// Manual button trigger for starting or refreshing session
function startAttendance() {
  generateNewCode();
}

// Update remaining session time on page UI
function updateTimer() {
  const t = document.getElementById("timer");
  if (t) {
    const minutes = Math.floor(timer / 60);
    const seconds = String(timer % 60).padStart(2, "0");
    t.innerText = `${minutes}:${seconds}`;
  }
}

// Copy session code to clipboard
async function copyCode() {
  const code = localStorage.getItem("sessionCode") || "";
  if (!code) return;
  try {
    await navigator.clipboard.writeText(code);
    alert("Session code copied!");
  } catch (err) {
    console.error("Failed to copy: ", err);
  }
}

// Display submission results on student page
function showResult(text, type) {
  const result = document.getElementById("result");
  if (result) {
    result.innerText = text;
    result.className = "result " + type;
  }
}

// STUDENT PAGE: Push attendance to Firebase
function markAttendance() {
  const roll = document.getElementById("roll").value.trim();
  const name = document.getElementById("name").value.trim();
  const enteredCode = document.getElementById("session").value.trim();
  
  if (!roll || !name || !enteredCode) {
    showResult("Please fill in all fields.", "error");
    return;
  }

  // Save entry to Realtime Database
  database.ref("attendance").push({
    roll: roll,
    name: name,
    code: enteredCode,
    timestamp: Date.now()
  }).then(() => {
    showResult("Attendance submitted successfully!", "success");
    document.getElementById("roll").value = "";
    document.getElementById("name").value = "";
    document.getElementById("session").value = "";
  }).catch((error) => {
    showResult("Error saving attendance: " + error.message, "error");
  });
}

// TEACHER DASHBOARD: Listen for real-time live entries
function listenForAttendance() {
  const table = document.getElementById("attendanceTable");
  const count = document.getElementById("count");
  if (!table) return;

  // Clear existing static rows
  table.innerHTML = "";
  let totalPresent = 0;

  // Real-time Firebase listener
  database.ref("attendance").on("child_added", (snapshot) => {
    const data = snapshot.val();
    
    // Add new row live to the teacher table
    const row = table.insertRow();
    row.insertCell(0).innerText = data.roll || "N/A";
    row.insertCell(1).innerText = data.name || "N/A";
    row.insertCell(2).innerText = new Date(data.timestamp).toLocaleTimeString();
    row.insertCell(3).innerText = "PRESENT";

    // Update live count badge
    totalPresent++;
    if (count) count.innerText = totalPresent;
  });
}

// TEACHER DASHBOARD: Reset Cloud Attendance Data
function clearAttendance() {
  database.ref("attendance").remove()
    .then(() => {
      const table = document.getElementById("attendanceTable");
      if (table) table.innerHTML = "";
      const count = document.getElementById("count");
      if (count) count.innerText = "0";
      alert("Attendance roster reset successfully!");
    })
    .catch((error) => {
      alert("Error clearing data: " + error.message);
    });
}

// Initial setup on page load
document.addEventListener("DOMContentLoaded", () => {
  // Setup teacher dashboard
  if (document.getElementById("code")) {
    sessionCode = localStorage.getItem("sessionCode") || randomCode();
    localStorage.setItem("sessionCode", sessionCode);
    document.getElementById("code").innerText = sessionCode;
    
    startTimer();
    generateQR();
    listenForAttendance();
  }

  // Auto-fill code param on student load if scanned via QR
  if (document.getElementById("session")) {
    const qrSession = new URLSearchParams(window.location.search).get("session");
    if (qrSession) document.getElementById("session").value = qrSession;
  }
});
