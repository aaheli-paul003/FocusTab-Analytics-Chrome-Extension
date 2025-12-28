const statusEl = document.getElementById("status");
const toggleBtn = document.getElementById("toggleBtn");
const timerEl = document.getElementById("timer");
const ring = document.getElementById("ring");
const themeBtn = document.getElementById("themeBtn");

let interval;

// ---------- TIMER ----------
function startTimer(startISO) {
  clearInterval(interval);
  ring.classList.add("pulse");

  interval = setInterval(() => {
    const diff = Date.now() - new Date(startISO).getTime();
    const m = String(Math.floor(diff / 60000)).padStart(2, "0");
    const s = String(Math.floor(diff / 1000) % 60).padStart(2, "0");
    timerEl.textContent = `${m}:${s}`;
  }, 1000);
}

function stopTimer() {
  clearInterval(interval);
  timerEl.textContent = "00:00";
  ring.classList.remove("pulse");
}

// ---------- FOCUS ----------
toggleBtn.onclick = () => {
  chrome.runtime.sendMessage({ type: "TOGGLE_FOCUS" }, res => {
    render(res.active, res.startTime);
  });
};

function render(active, startTime) {
  document.documentElement.style.setProperty(
    "--accent",
    active ? "#16a34a" : "#2563eb"
  );

  if (active) {
    statusEl.textContent = "Focusing";
    toggleBtn.textContent = "Stop Focus";
    startTimer(startTime);
  } else {
    statusEl.textContent = "Not focusing";
    toggleBtn.textContent = "Start Focus";
    stopTimer();
  }
}

// ---------- LOAD STATE ----------
chrome.storage.local.get("activeSession", data => {
  if (data.activeSession) render(true, data.activeSession.start_time);
});

// ---------- TASKS ----------
const taskInput = document.getElementById("taskInput");
const tasksList = document.getElementById("tasks");

document.getElementById("addTaskBtn").onclick = async () => {
  const title = taskInput.value.trim();
  if (!title) return;

  const { tasks = [] } = await chrome.storage.local.get("tasks");
  tasks.push({ task_id: Date.now(), title, status: "open" });
  await chrome.storage.local.set({ tasks });
  taskInput.value = "";
};

async function renderTasks(tasks) {
  const { activeSession } = await chrome.storage.local.get("activeSession");

  const visibleTasks = activeSession
    ? tasks
    : tasks.filter(t => t.status !== "done");

  tasksList.innerHTML = visibleTasks.map(t => `
    <li>
      <input type="checkbox"
        ${t.status === "done" ? "checked" : ""}
        data-id="${t.task_id}">
      <span class="${t.status === "done" ? "done" : ""}">
        ${t.title}
      </span>
    </li>
  `).join("");

  // reattach checkbox listeners
  tasksList.querySelectorAll("input[type=checkbox]").forEach(cb => {
    cb.onchange = async () => {
      const { tasks } = await chrome.storage.local.get("tasks");
      const task = tasks.find(t => t.task_id == cb.dataset.id);

      if (cb.checked) {
        task.status = "done";
        task.completed_at = new Date().toISOString();
      } else {
        task.status = "open";
        task.completed_at = null;
      }

      await chrome.storage.local.set({ tasks });
    };
  });
}

chrome.storage.local.get("tasks").then(d => renderTasks(d.tasks || []));
chrome.storage.onChanged.addListener((c,a)=>{ if(c.tasks) renderTasks(c.tasks.newValue||[]) });

// ---------- BLOCKED SITES ----------
const blockInput = document.getElementById("blockInput");
const blockedList = document.getElementById("blockedList");

document.getElementById("addBlockBtn").onclick = async () => {
  const d = blockInput.value.trim();
  if (!d) return;
  const { blockedDomains = [] } = await chrome.storage.local.get("blockedDomains");
  if (!blockedDomains.includes(d)) {
    blockedDomains.push(d);
    await chrome.storage.local.set({ blockedDomains });
  }
  blockInput.value = "";
};

async function renderBlocked(domains) {
  const { activeSession } = await chrome.storage.local.get("activeSession");

  blockedList.innerHTML = domains.map(d => `
    <li>
      ${d}
      ${!activeSession ? `<button data-d="${d}">✕</button>` : ""}
    </li>
  `).join("");

  // Only add click listeners if session is not active
  if (!activeSession) {
    blockedList.querySelectorAll("button").forEach(b => {
      b.onclick = async () => {
        const { blockedDomains = [] } = await chrome.storage.local.get("blockedDomains");
        await chrome.storage.local.set({
          blockedDomains: blockedDomains.filter(x => x !== b.dataset.d)
        });
      };
    });
  }
}


chrome.storage.local.get("blockedDomains").then(d=>renderBlocked(d.blockedDomains||[]));
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && (changes.activeSession || changes.blockedDomains)) {
    chrome.storage.local.get("blockedDomains", ({ blockedDomains = [] }) => {
      renderBlocked(blockedDomains);
    });
  }
});

// ---------- THEME ----------
themeBtn.onclick = () => {
  document.body.classList.toggle("light");
};

// ---------- ANALYTICS ----------
document.getElementById("analyticsBtn").addEventListener("click", () => {
  chrome.windows.create({
    url: "analytics.html",
    type: "popup",
    width: 350,
    height: 500
  });
});
