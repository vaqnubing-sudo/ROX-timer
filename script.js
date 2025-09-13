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
let swRegistration = null;
let wakeLock = null;

// === Create Timer Card ===
function createTimerElement(timerData, index, category) {
  const timerId = `timer-${category}-${index}`;

  // Initialize timer object
  timers[timerId] = {
    interval: null,
    remaining: 0,
    name: timerData.name,
    image: timerData.image
  };

  loadTimerState(timerId); // Load saved state if exists

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

  container.querySelectorAll("div[id^='timerContainer'] > div").forEach(div => {
    div.style.display = "none";
  });

  container.querySelector(`.category-${category}`).style.display = "block";

  document.getElementById("cat1Btn").classList.toggle("active", category === 1);
  document.getElementById("cat2Btn").classList.toggle("active", category === 2);

  activeCategory = category;
}

// === Start Timer ===
function startTimer(timerId) {
  const hours = document.getElementById(`${timerId}-hours`);
  const minutes = document.getElementById(`${timerId}-minutes`);
  const seconds = document.getElementById(`${timerId}-seconds`);

  const totalSeconds =
    parseInt(hours.value || "0") * 3600 +
    parseInt(minutes.value || "0") * 60 +
    parseInt(seconds.value || "0");

  if (totalSeconds <= 0) return;

  // Set end timestamp
  timers[timerId].endTime = Date.now() + totalSeconds * 1000;
  saveTimerState(timerId);

  hours.value = "00";
  minutes.value = "00";
  seconds.value = "00";

  if (timers[timerId].interval) clearInterval(timers[timerId].interval);

  timers[timerId].interval = setInterval(() => {
    const remaining = Math.max(0, Math.floor((timers[timerId].endTime - Date.now()) / 1000));
    timers[timerId].remaining = remaining;
    updateDisplay(timerId);

    if (remaining <= 0) {
      clearInterval(timers[timerId].interval);
      localStorage.removeItem(timerId);
      notifyUser(timers[timerId].name, `${timers[timerId].name} has spawned!`, timers[timerId].image);
      playNotificationSound();
      return;
    }

    if (remaining === 300) { // 5 min warning
      notifyUser(
        timers[timerId].name,
        `5 minutes remaining, ${timers[timerId].name} will spawn soon.`,
        timers[timerId].image
      );
      playNotificationSound();
    }

    saveTimerState(timerId);
  }, 1000);

  updateDisplay(timerId);
}

// === Reset Timer ===
function resetTimer(timerId) {
  if (timers[timerId].interval) clearInterval(timers[timerId].interval);
  timers[timerId].endTime = Date.now() + 3 * 3599 * 1000; // 2h59m59s
  saveTimerState(timerId);

  startTimer(timerId); // restart interval
}

// === Update Display ===
function updateDisplay(timerId) {
  const display = document.getElementById(`${timerId}-display`);
  const h = Math.floor(timers[timerId].remaining / 3600);
  const m = Math.floor((timers[timerId].remaining % 3600) / 60);
  const s = timers[timerId].remaining % 60;

  display.textContent = `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

// === Notifications ===
function notifyUser(timerName, message, icon) {
  if (!('Notification' in window)) return;

  const options = { body: message, icon: icon || 'images/Phreeoni.png' };

  if (Notification.permission === 'granted') {
    if (swRegistration) swRegistration.showNotification(timerName, options);
    else new Notification(timerName, options);
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        if (swRegistration) swRegistration.showNotification(timerName, options);
        else new Notification(timerName, options);
      }
    });
  }
}

// === Play Notification Sound ===
function playNotificationSound() {
  const sound = document.getElementById("notificationSound");
  if (sound) sound.play();
}

// === Save / Load Timer State ===
function saveTimerState(timerId) {
  const state = {
    endTime: timers[timerId].endTime,
    name: timers[timerId].name,
    image: timers[timerId].image
  };
  localStorage.setItem(timerId, JSON.stringify(state));
}

function loadTimerState(timerId) {
  const saved = localStorage.getItem(timerId);
  if (!saved) return;

  const state = JSON.parse(saved);
  const remaining = Math.max(0, Math.floor((state.endTime - Date.now()) / 1000));

  timers[timerId].remaining = remaining;
  timers[timerId].name = state.name;
  timers[timerId].image = state.image;
  timers[timerId].endTime = state.endTime;

  updateDisplay(timerId);

  if (remaining > 0) startTimer(timerId); // resume timer
}

// === Category Switching ===
function showCategory(category) {
  renderCategory(category);
}

// === Request Screen Wake Lock ===
async function requestWakeLock() {
  if ('wakeLock' in navigator) {
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => console.log('Screen Wake Lock released'));
      console.log('Screen Wake Lock acquired');
    } catch (err) {
      console.error(err);
    }
  }
}

// === Init ===
document.addEventListener("DOMContentLoaded", () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
      .then(reg => {
        console.log('Service Worker registered');
        swRegistration = reg;
      })
      .catch(err => console.log('Service Worker registration failed:', err));
  }

  if ('Notification' in window && Notification.permission !== 'granted') {
    Notification.requestPermission().then(permission => console.log('Notification permission:', permission));
  }

  requestWakeLock();
  renderCategory(1);
});
