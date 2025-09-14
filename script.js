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
let swRegistration = null; // Global Service Worker registration

// === Create Timer Card ===
function createTimerElement(timerData, index, category) {
  const timerId = `timer-${category}-${index}`;
  timers[timerId] = {
    interval: null,
    remaining: 0,
    endTime: null,         // NEW: absolute end timestamp
    notified5min: false,   // NEW: prevent duplicate 5-min alerts
    name: timerData.name,
    image: timerData.image
  };

  const card = document.createElement("div");
  card.className = "timer-card";

  card.innerHTML = `
    <div class="timer-header">
      <img src="${timerData.image}" alt="${timerData.name}" class="timer-image">
      <span class="timer-name">${timerData.name}</span>
    </div>
    <div class="timer-display" id="${timerId}-display">00:00:00</div>
    <div class="timer-inputs">
      <input type="number" id="${timerId}-hours" min="0" value="00">
      :
      <input type="number" id="${timerId}-minutes" min="0" max="59" value="00" oninput="validateTwoDigit(this)">
      :
      <input type="number" id="${timerId}-seconds" min="0" max="59" value="00" oninput="validateTwoDigit(this)">
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

// === Helper: Start interval ===
function _beginInterval(timerId) {
  if (timers[timerId].interval) clearInterval(timers[timerId].interval);

  timers[timerId].interval = setInterval(() => {
    if (!timers[timerId].endTime) return;

    const remainingMs = timers[timerId].endTime - Date.now();
    const remaining = Math.max(0, Math.ceil(remainingMs / 1000)); // in seconds
    timers[timerId].remaining = remaining;

    // 5-minute warning
    if (!timers[timerId].notified5min && remaining <= 300 && remaining > 0) {
      timers[timerId].notified5min = true;
      notifyUser(
        timers[timerId].name,
        `5 minutes remaining, the ${timers[timerId].name} will spawn soon.`,
        timers[timerId].image
      );
      playNotificationSound();
    }

    updateDisplay(timerId);

    // When timer finishes
    if (remaining <= 0) {
      clearInterval(timers[timerId].interval);
      timers[timerId].interval = null;
      notifyUser(timers[timerId].name, `${timers[timerId].name} is already spawned!`, timers[timerId].image);
      playNotificationSound();
    }
  }, 1000);

  updateDisplay(timerId);
}

// === Start Timer ===
function startTimer(timerId) {
  const hours = document.getElementById(`${timerId}-hours`);
  const minutes = document.getElementById(`${timerId}-minutes`);
  const seconds = document.getElementById(`${timerId}-seconds`);

  const totalSeconds =
    (parseInt(hours.value || "0", 10) * 3600) +
    (parseInt(minutes.value || "0", 10) * 60) +
    (parseInt(seconds.value || "0", 10));

  if (totalSeconds <= 0) return;

  timers[timerId].endTime = Date.now() + totalSeconds * 1000;
  timers[timerId].notified5min = false;

  hours.value = "00";
  minutes.value = "00";
  seconds.value = "00";

  _beginInterval(timerId);
}

// === Reset Timer ===
function resetTimer(timerId) {
  timers[timerId].remaining = 7175; // 1h59m35s
  if (timers[timerId].interval) clearInterval(timers[timerId].interval);

  timers[timerId].interval = setInterval(() => {
    timers[timerId].remaining--;

    if (timers[timerId].remaining < 0) {
      clearInterval(timers[timerId].interval);
      notifyUser(timers[timerId].name, `${timers[timerId].name} is already spawned!`, timers[timerId].image);
      playNotificationSound();
      return;
    }

    if (timers[timerId].remaining === 300) {
      notifyUser(
        timers[timerId].name,
        `5 minutes remaining, the ${timers[timerId].name} will spawn soon.`,
        timers[timerId].image
      );
      playNotificationSound();
    }

    updateDisplay(timerId);
  }, 1000);

  updateDisplay(timerId);
}

// === Update Display ===
function updateDisplay(timerId) {
  const display = document.getElementById(`${timerId}-display`);
  if (!display) return;

  let remaining = timers[timerId].remaining;
  if (timers[timerId].endTime) {
    remaining = Math.max(0, Math.ceil((timers[timerId].endTime - Date.now()) / 1000));
    timers[timerId].remaining = remaining;
  }

  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;

  display.textContent = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// === Notifications ===
function notifyUser(timerName, message, icon) {
  if (!('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    if (swRegistration) {
      swRegistration.showNotification(timerName, {
        body: message,
        icon: icon || 'images/Phreeoni.png'
      });
    } else {
      new Notification(timerName, { body: message, icon: icon || 'images/Phreeoni.png' });
    }
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        if (swRegistration) {
          swRegistration.showNotification(timerName, { body: message, icon: icon || 'images/Phreeoni.png' });
        } else {
          new Notification(timerName, { body: message, icon: icon || 'images/Phreeoni.png' });
        }
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
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
      .then(reg => {
        console.log('Service Worker registered');
        swRegistration = reg; // store globally
      })
      .catch(err => console.log('Service Worker registration failed:', err));
  }

  // Request Notification Permission
  if ('Notification' in window && Notification.permission !== 'granted') {
    Notification.requestPermission().then(permission => {
      console.log('Notification permission:', permission);
    });
  }

  // Keep display synced when tab becomes visible again
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      Object.keys(timers).forEach(id => {
        if (timers[id].endTime) {
          timers[id].remaining = Math.max(0, Math.ceil((timers[id].endTime - Date.now()) / 1000));
          updateDisplay(id);
        }
      });
    }
  });

  // Render first category
  renderCategory(1);
});


