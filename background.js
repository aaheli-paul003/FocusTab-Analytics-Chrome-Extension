
// ---------- MESSAGE HANDLER ----------
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "TOGGLE_FOCUS") {
    toggleFocus().then(sendResponse);
    return true;
  }
});

// ---------- FOCUS TOGGLE ----------
async function toggleFocus() {
  const data = await chrome.storage.local.get([
    "activeSession",
    "sessions",
    "blockedDomains",
    "tasks",
    "taskHistory"
  ]);

  let { activeSession, sessions = [], blockedDomains = [], tasks = [], taskHistory = [] } = data;

  // START SESSION
  if (!activeSession) {
    activeSession = {
      id: Date.now(),
      start_time: new Date().toISOString(),
      num_block_events: 0,
      num_tasks_touched: 0
    };

    await chrome.storage.local.set({ activeSession });
    await enableBlocking(blockedDomains);

    return { active: true, startTime: activeSession.start_time };
  }

  /* // STOP SESSION
  activeSession.end_time = new Date().toISOString();
  activeSession.duration_minutes =
    (new Date(activeSession.end_time) -
      new Date(activeSession.start_time)) / 60000;

  // ALWAYS read latest activeSession before saving
  const { activeSession: finalSession } =
    await chrome.storage.local.get("activeSession");

  sessions.push(finalSession);

  const { tasks = [], taskHistory = [] } =
    await chrome.storage.local.get(["tasks", "taskHistory"]);

  // Split tasks
  const completed = tasks.filter(t => t.status === "done");
  const remaining = tasks.filter(t => t.status !== "done");

  // Archive completed tasks for analytics
  completed.forEach(t => {
    taskHistory.push({
      ...t,
      session_id: activeSession.id,
      archived_at: new Date().toISOString()
    });
  });

  await chrome.storage.local.set({
    activeSession: null,
    sessions,
    tasks: remaining,   // popup still shows only remaining
    taskHistory         // analytics data
  });

  await disableBlocking();

  return { active: false };


  await disableBlocking();

  return { active: false };
} */

  // ---------- STOP SESSION ----------
  if (activeSession) {
    // End the session
    activeSession.end_time = new Date().toISOString();
    activeSession.duration_minutes =
      (new Date(activeSession.end_time) - new Date(activeSession.start_time)) / 60000;

    // Read existing sessions and taskHistory
    const { sessions = [], tasks = [], taskHistory = [] } =
      await chrome.storage.local.get(["sessions", "tasks", "taskHistory"]);

    // Archive completed tasks for analytics
    const completed = tasks.filter(t => t.status === "done");
    const remaining = tasks.filter(t => t.status !== "done");

    completed.forEach(t => {
      taskHistory.push({
        ...t,
        session_id: activeSession.id,
        archived_at: new Date().toISOString()
      });
    });

    // Push the fully updated activeSession into sessions
    sessions.push(activeSession);

    // Save updated data
    await chrome.storage.local.set({
      activeSession: null,
      sessions,
      tasks: remaining,   // keep only open tasks in popup
      taskHistory         // store completed tasks for analytics
    });

    // Disable site blocking
    await disableBlocking();

    return { active: false };
  }
}

// ---------- DNR BLOCKING ----------
async function enableBlocking(domains) {
  const rules = domains.map((d, i) => ({
    id: 1000 + i,
    priority: 1,
    action: {
      type: "redirect",
      redirect: { extensionPath: "/blocked.html" }
    },
    condition: {
      urlFilter: d,
      resourceTypes: ["main_frame"]
    }
  }));

  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existing.map(r => r.id),
    addRules: rules
  });
}

async function disableBlocking() {
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existing.map(r => r.id)
  });
}

// ---------- UPDATE BLOCKING MID-SESSION ----------
chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area !== "local" || !changes.blockedDomains) return;
  const { activeSession, blockedDomains = [] } =
    await chrome.storage.local.get(["activeSession", "blockedDomains"]);
  if (activeSession) {
    await enableBlocking(blockedDomains);
  }
});

// ---------- COUNT BLOCKED ATTEMPTS ----------
if (
  chrome.declarativeNetRequest &&
  chrome.declarativeNetRequest.onRuleMatchedDebug
) {
  chrome.declarativeNetRequest.onRuleMatchedDebug.addListener(
    async (info) => {
      const { activeSession } =
        await chrome.storage.local.get("activeSession");

      if (!activeSession) return;

      activeSession.num_block_events =
        (activeSession.num_block_events || 0) + 1;

      await chrome.storage.local.set({ activeSession });
    }
  );
}
