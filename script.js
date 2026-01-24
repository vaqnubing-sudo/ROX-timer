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
const sentNotifications = new Set();
let swRegistration = null;

// === Notifications ===
function notifyOnce(timerId, type, message, icon) {
  const key = `${timerId}-${type}`;
  if (sentNotifications.has(key)) return;
  sentNotifications.add(key);
  notifyUser(timers[timerId].name, message, icon);
  playNotificationSound();
}

function notifyUser(timerName, message, icon) {
  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    if (swRegistration) {
      swRegistration.showNotification(timerName, { body: message, icon });
    } else {
      new Notification(timerName, { body: message, icon });
    }
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then(p => {
      if (p === "granted") new Notification(timerName, { body: message, icon });
    });
  }
}

function playNotificationSound() {
  const sound = document.getElementById("notificationSound");
  if (sound) sound.play();
}

// === Create Timer Card ===
function createTimerElement(timerData, index, category) {
  const timerId = `timer-${category}-${index}`;
  timers[timerId] = {
    endTime: null,
    name: timerData.name,
    image: timerData.image,
    category,
    notified5min: false,
    notified30s: false,
    finished: false
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

// === Validate Inputs ===
function validateTwoDigit(input) {
  input.value = input.value.replace(/\D/g, "").slice(0,2);
  if (parseInt(input.value||0) > 59) input.value = "59";
}

// === Render Category ===
function renderCategory(category) {
  const container = document.getElementById("timerContainer");
  if (!container.querySelector(`.category-${category}`)) {
    const data = category === 1 ? category1Timers : category2Timers;
    const wrapper = document.createElement("div");
    wrapper.className = `category-${category}`;
    data.forEach((t,i)=>wrapper.appendChild(createTimerElement(t,i,category)));
    container.appendChild(wrapper);
  }
  container.querySelectorAll("div[id^='timerContainer'] > div").forEach(d=>d.style.display="none");
  container.querySelector(`.category-${category}`).style.display="block";
  document.getElementById("cat1Btn").classList.toggle("active", category===1);
  document.getElementById("cat2Btn").classList.toggle("active", category===2);
  activeCategory = category;
}

// === Start / Reset ===
function startTimer(timerId) {
  const h = parseInt(document.getElementById(`${timerId}-hours`).value||0);
  const m = parseInt(document.getElementById(`${timerId}-minutes`).value||0);
  const s = parseInt(document.getElementById(`${timerId}-seconds`).value||0);
  const total = h*3600 + m*60 + s;
  if (total<=0) return;

  timers[timerId].endTime = Date.now() + total*1000;
  timers[timerId].finished=false;
  timers[timerId].notified5min=false;
  timers[timerId].notified30s=false;

  // clear old notifications
  [...sentNotifications].filter(k=>k.startsWith(timerId)).forEach(k=>sentNotifications.delete(k));

  // clear inputs
  document.getElementById(`${timerId}-hours`).value="";
  document.getElementById(`${timerId}-minutes`).value="";
  document.getElementById(`${timerId}-seconds`).value="";
}

function resetTimer(timerId) {
  const defaultSeconds = timers[timerId].category===1?10790:7190;
  timers[timerId].endTime = Date.now()+defaultSeconds*1000;
  timers[timerId].finished=false;
  timers[timerId].notified5min=false;
  timers[timerId].notified30s=false;

  [...sentNotifications].filter(k=>k.startsWith(timerId)).forEach(k=>sentNotifications.delete(k));
  closeAllNotifications();
}

// === Close Notifications ===
function closeAllNotifications() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.getRegistration().then(reg=>{
    if (!reg) return;
    reg.getNotifications().then(notifs=>notifs.forEach(n=>n.close()));
  });
}

// === Update Timer ===
function updateTimer(timerId) {
  const t = timers[timerId];
  if (!t.endTime || t.finished) return;

  const rem = Math.floor((t.endTime - Date.now())/1000);
  const display = document.getElementById(`${timerId}-display`);
  if (!display) return;

  if (rem <=0) {
    t.finished=true;
    t.endTime=null;
    display.textContent="00:00:00";
    notifyOnce(timerId,"spawned",`${t.name} is already spawned!`, t.image);
    return;
  }

  if(rem===300 && !t.notified5min) notifyOnce(timerId,"5min",`5 minutes remaining, ${t.name} will spawn soon!`, t.image);
  if(rem===30 && !t.notified30s) notifyOnce(timerId,"30s",`30 seconds remaining, ${t.name} will spawn very soon!`, t.image);

  const h = Math.floor(rem/3600), m=Math.floor((rem%3600)/60), s=rem%60;
  display.textContent=`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

// === Category Switch ===
function showCategory(c){renderCategory(c)}

// === Init ===
document.addEventListener("DOMContentLoaded", () => {

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/ROX-timer/sw.js")
      .then(r => { swRegistration = r; console.log("SW registered with scope:", r.scope); })
      .catch(err => console.error("SW registration failed:", err));
  }

  if ("Notification" in window && Notification.permission !== "granted") {
    Notification.requestPermission();
  }

  // Main loop
  function loop() {
    Object.keys(timers).forEach(tid => updateTimer(tid));
    requestAnimationFrame(loop);
  }
  loop();

  renderCategory(1);
});






