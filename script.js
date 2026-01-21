// === Timer Data ===
const category1Timers = [
  { name: "Phreeoni", image: "images/Phreeoni.png" },
  { name: "Mistress", image: "images/Mistress.png" },
  { name: "Eddga", image: "images/Eddga.png" },
  { name: "Kraken", image: "images/Kraken.png" },
  { name: "Orc Hero", image: "images/Orc Hero.png" },
  { name: "Maya", image: "images/Maya.png" },
  { name: "Pharaoh", image: "images/Pharaoh.png" },
  { name: "Orc Lord", image: "images/Orc Lord.png" }
];

const category2Timers = [
  { name: "Eclipse", image: "images/Eclipse.png" },
  { name: "Dragon Fly", image: "images/Dragonfly.png" },
  { name: "Ghostring", image: "images/Ghostring.png" },
  { name: "Mastering", image: "images/Mastering.png" },
  { name: "Toad", image: "images/Toad.png" },
  { name: "King Dramoh", image: "images/King Dramoh.png" },
  { name: "Deviling", image: "images/Deviling.png" },
  { name: "Angeling", image: "images/Angeling.png" }
];

// === Global State ===
let activeCategory = 1;
const timers = {};
let swRegistration = null; // Service Worker Registration

const sentNotifications = new Set();

// === Create Timer Card ===
function createTimerElement(timerData, index, category) {
  const timerId = `timer-${category}-${index}`;
  timers[timerId] = {
    endTime: null,
    remaining: 0,
    name: timerData.name,
    image: timerData.image,
    category: category,
    interval: null,
    notified5min: false,
    notified30s: false
    finished: false
  };

function notifyOnce(timerId, type, message, icon) {
  const key = `${timerId}-${type}`;
  if (sentNotifications.has(key)) return;

  sentNotifications.add(key);
  notifyUser(timers[timerId].name, message, icon);
  playNotificationSound();
}

  const card = document.createElement("div");
  card.className = "timer-card";

  card.innerHTML = `
    <div class="timer-header">
      <img src="${timerData.image}" alt="${timerData.name}" class="timer-image">
      <span class="timer-name">${timerData.name}</span>
    </div>
    <div class="timer-display" id="${timerId}-display">00:00:00</div>
    <div class="timer-inputs">
      <input type="number" id="${timerId}-hours" min="0" placeholder="HH">
      :
      <input type="number" id="${timerId}-minutes" min="0" max="59" placeholder="MM" oninput="validateTwoDigit(this)">
      :
      <input type="number" id="${timerId}-seconds" min="0" max="59" placeholder="SS" oninput="validateTwoDigit(this)">
    </div>
    <div class="timer-buttons">
      <button class="start-btn" onclick="startTimer('${timerId}')">Start</button>
      <button class="reset-btn" onclick="resetTimer('${timerId}')">Reset</button>
    </div>
  `;
  return card;
}

// === Validate Minutes and Seconds ===
function validateTwoDigit(input) {
  input.value = input.value.replace(/\D/g, "");
  if (input.value.length > 2) input.value = input.value.slice(0, 2);
  if (parseInt(input.value || "0") > 59) input.value = "59";
}

// === Render Category ===
function renderCategory(category) {
  const container = document.getElementById("timerContainer");

  if (!container.querySelector(`.category-${category}`)) {
    const data = category === 1 ? category1Timers : category2Timers;
    const categoryWrapper = document.createElement("div");
    categoryWrapper.className = `category-${category}`;
    data.forEach((timerData, index) => {
      categoryWrapper.appendChild(createTimerElement(timerData, index, category));
    });
    container.appendChild(categoryWrapper);
  }

  // Hide all categories
  container.querySelectorAll("div[id^='timerContainer'] > div").forEach(div => {
    div.style.display = "none";
  });

  // Show only the active category
  container.querySelector(`.category-${category}`).style.display = "block";

  document.getElementById("cat1Btn").classList.toggle("active", category === 1);
  document.getElementById("cat2Btn").classList.toggle("active", category === 2);

  activeCategory = category;
}

// === Start Timer ===
function startTimer(timerId) {
  const hours = parseInt(document.getElementById(`${timerId}-hours`).value || "0");
  const minutes = parseInt(document.getElementById(`${timerId}-minutes`).value || "0");
  const seconds = parseInt(document.getElementById(`${timerId}-seconds`).value || "0");

  let totalSeconds = hours * 3600 + minutes * 60 + seconds;
  if (totalSeconds <= 0) return;

  const now = Date.now();
  timers[timerId].endTime = now + totalSeconds * 1000;

  // ✅ ADD THESE LINES
  timers[timerId].finished = false;
  timers[timerId].notified5min = false;
  timers[timerId].notified30s = false;

  // ✅ CLEAR old notifications for THIS timer
  [...sentNotifications]
    .filter(k => k.startsWith(timerId))
    .forEach(k => sentNotifications.delete(k));

  // Clear fields after start
  document.getElementById(`${timerId}-hours`).value = "";
  document.getElementById(`${timerId}-minutes`).value = "";
  document.getElementById(`${timerId}-seconds`).value = "";

  if (timers[timerId].interval) clearInterval(timers[timerId].interval);

  updateTimer(timerId);
}

// === Reset Timer ===
function resetTimer(timerId) {
  const defaultSeconds = timers[timerId].category === 1 ? 10790 : 7190;
  timers[timerId].endTime = Date.now() + defaultSeconds * 1000;

  // ✅ ADD THESE LINES
  timers[timerId].finished = false;
  timers[timerId].notified5min = false;
  timers[timerId].notified30s = false;

  // ✅ CLEAR old notifications for THIS timer
  [...sentNotifications]
    .filter(k => k.startsWith(timerId))
    .forEach(k => sentNotifications.delete(k));

  closeAllNotifications();
  
  if (timers[timerId].interval) clearInterval(timers[timerId].interval);

  updateTimer(timerId);
}

function closeAllNotifications() {
  navigator.serviceWorker.getRegistration().then(reg => {
    if (!reg) return;
    reg.getNotifications().then(notifs => {
      notifs.forEach(n => n.close());
    });
  });
}

// === Update Timer ===
function updateTimer(timerId) {
  const timer = timers[timerId];

  // STOP if already finished or not running
  if (!timer.endTime || timer.finished) return;

  const now = Date.now();
  const remaining = Math.floor((timer.endTime - now) / 1000);

  if (remaining <= 0) {
    timer.finished = true;
    timer.endTime = null;

    document.getElementById(`${timerId}-display`).textContent = "00:00:00";

    notifyOnce(
      timerId,
      "spawned",
      `${timer.name} is already spawned!`,
      timer.image
    );
    return;
  }

  if (remaining === 300 && !timer.notified5min) {
    timer.notified5min = true;
    notifyOnce(
      timerId,
      "5min",
      `5 minutes remaining, ${timer.name} will spawn soon!`,
      timer.image
    );
  }

  if (remaining === 30 && !timer.notified30s) {
    timer.notified30s = true;
    notifyOnce(
      timerId,
      "30s",
      `30 seconds remaining, ${timer.name} will spawn very soon!`,
      timer.image
    );
  }

  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;

  document.getElementById(`${timerId}-display`).textContent =
    `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

  // Alerts
  if (!timers[timerId].notified5min && remaining === 300) {
    timers[timerId].notified5min = true;
    notifyUser(timers[timerId].name, `5 minutes remaining, ${timers[timerId].name} will spawn soon!`, timers[timerId].image);
    playNotificationSound();
  }

  if (!timers[timerId].notified30s && remaining === 30) {
    timers[timerId].notified30s = true;
    notifyUser(timers[timerId].name, `30 seconds remaining, ${timers[timerId].name} will spawn very soon!`, timers[timerId].image);
    playNotificationSound();
  }

  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;

  document.getElementById(`${timerId}-display`).textContent =
    `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// === Notifications ===
function notifyUser(timerName, message, icon) {
  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    if (swRegistration) {
      swRegistration.showNotification(timerName, {
        body: message,
        icon: icon || "images/Phreeoni.png"
      });
    } else {
      new Notification(timerName, { body: message, icon: icon || "images/Phreeoni.png" });
    }
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then(permission => {
      if (permission === "granted") {
        new Notification(timerName, { body: message, icon: icon || "images/Phreeoni.png" });
      }
    });
  }
}

// === Play Sound ===
function playNotificationSound() {
  const sound = document.getElementById("notificationSound");
  if (sound) sound.play();
}

// === Category Switching ===
function showCategory(category) {
  renderCategory(category);
}

// === Init ===
document.addEventListener("DOMContentLoaded", () => {
  // Register Service Worker
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js")
      .then(reg => {
        console.log("Service Worker registered");
        swRegistration = reg;
      })
      .catch(err => console.log("Service Worker registration failed:", err));
  }

  // Request Notification Permission
  if ("Notification" in window && Notification.permission !== "granted") {
    Notification.requestPermission().then(permission => {
      console.log("Notification permission:", permission);
    });
  }

  // === Ultra Accurate Timer Loop ===
function accurateLoop() {
  Object.keys(timers).forEach(timerId => {
    if (timers[timerId].endTime) {
      updateTimer(timerId);
    }
  });
  requestAnimationFrame(accurateLoop);  // Runs 60 times per second without drift
}
accurateLoop();

  // Render initial category
  renderCategory(1);
});







