Notification.requestPermission().then(permission => {
  console.log(permission); // 'granted', 'denied', or 'default'
});

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

// === Create Timer Card ===
function createTimerElement(timerData, index, category) {
  const timerId = `timer-${category}-${index}`;
  timers[timerId] = {
    interval: null,
    remaining: 0,
    name: timerData.name
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

// === Validate Minutes and Seconds (Two-Digit Limit, no auto zero) ===
function validateTwoDigit(input) {
  input.value = input.value.replace(/\D/g, ""); // Remove non-numeric characters
  if (input.value.length > 2) {
    input.value = input.value.slice(0, 2);
  }
  if (parseInt(input.value || "0") > 59) {
    input.value = "59";
  }
}

// === Render Category ===
function renderCategory(category) {
  const container = document.getElementById("timerContainer");

  // Check if timers for this category are already created
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
  const hours = document.getElementById(`${timerId}-hours`);
  const minutes = document.getElementById(`${timerId}-minutes`);
  const seconds = document.getElementById(`${timerId}-seconds`);

  let totalSeconds =
    parseInt(hours.value || "0") * 3600 +
    parseInt(minutes.value || "0") * 60 +
    parseInt(seconds.value || "0");

  if (totalSeconds <= 0) return;

  timers[timerId].remaining = totalSeconds;

  // Reset inputs to 00:00:00 when timer starts
  hours.value = "00";
  minutes.value = "00";
  seconds.value = "00";

  if (timers[timerId].interval) clearInterval(timers[timerId].interval);

  timers[timerId].interval = setInterval(() => {
    timers[timerId].remaining--;

    if (timers[timerId].remaining < 0) {
      clearInterval(timers[timerId].interval);
      notifyUser(timers[timerId].name, `${timers[timerId].name} is already spawned!`);
      playNotificationSound();
      return;
    }

    if (timers[timerId].remaining === 300) {
      notifyUser(timers[timerId].name, `5 minutes remaining, the ${timers[timerId].name} will spawn soon.`);
      playNotificationSound();
    }

    updateDisplay(timerId);
  }, 1000);

  updateDisplay(timerId);
}

// === Reset Timer ===
function resetTimer(timerId) {
  timers[timerId].remaining = 3 * 3599; // Fixed reset to 2 hours, 59 minutes and 59 seconds
  if (timers[timerId].interval) clearInterval(timers[timerId].interval);

  timers[timerId].interval = setInterval(() => {
    timers[timerId].remaining--;

    if (timers[timerId].remaining < 0) {
      clearInterval(timers[timerId].interval);
      notifyUser(timers[timerId].name, `${timers[timerId].name} is already spawned!`);
      playNotificationSound();
      return;
    }

    if (timers[timerId].remaining === 300) {
      notifyUser(timers[timerId].name, `5 minutes remaining, the ${timers[timerId].name} will spawn soon.`);
      playNotificationSound();
    }

    updateDisplay(timerId);
  }, 1000);

  updateDisplay(timerId);
}

// === Update Display ===
function updateDisplay(timerId) {
  const display = document.getElementById(`${timerId}-display`);
  const h = Math.floor(timers[timerId].remaining / 3600);
  const m = Math.floor((timers[timerId].remaining % 3600) / 60);
  const s = timers[timerId].remaining % 60;

  display.textContent = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// === Notifications ===
function notifyUser(timerName, message) {
  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    new Notification(timerName, { body: message });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then(permission => {
      if (permission === "granted") {
        new Notification(timerName, { body: message });
      }
    });
  }
}

function playNotificationSound() {
  const sound = document.getElementById("notificationSound");
  sound.play();
}

// === Category Switching ===
function showCategory(category) {
  renderCategory(category);
}

// === Init ===
document.addEventListener("DOMContentLoaded", () => {
  renderCategory(1);
});




