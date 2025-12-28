// Fetch sessions and generate stats
chrome.storage.local.get(["sessions", "tasks"], ({ sessions = [], tasks = [] }) => {
  if (!sessions.length) return;

  // ----- Total and average -----
  const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
  document.getElementById("totalMinutes").textContent = `Total focus minutes: ${Math.round(totalMinutes)}`;

  const avgDuration = totalMinutes / sessions.length;
  document.getElementById("avgDuration").textContent = `Average session duration: ${Math.round(avgDuration)} minutes`;

  // ----- Focus minutes trend by day (line chart) -----
  const byDay = {};
  sessions.forEach(s => {
    const day = s.start_time.slice(0, 10);
    byDay[day] = (byDay[day] || 0) + (s.duration_minutes || 0);
  });

  new Chart(document.getElementById("focusTrendChart"), {
    type: 'line',
    data: {
      labels: Object.keys(byDay),
      datasets: [{
        label: 'Focus minutes per day',
        data: Object.values(byDay),
        borderColor: 'rgba(54, 162, 235, 0.8)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        fill: true,
        tension: 0.2
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });

  // ----- Tasks completed vs remaining (pie chart) -----
  chrome.storage.local.get(
  ["taskHistory", "tasks"],
  ({ taskHistory = [], tasks = [] }) => {

    const doneTasks = taskHistory.length;
    const openTasks = tasks.length;

    new Chart(document.getElementById("tasksPieChart"), {
      type: "pie",
      data: {
        labels: ["Completed", "Remaining"],
        datasets: [{
          data: [doneTasks, openTasks],
          backgroundColor: ["#4CAF50", "#FFC107"]
        }]
      }
    });
  }
);


  // ----- Blocked attempts per session (bar chart) -----
  if (!sessions.length) {
    console.warn("No sessions found for blocked attempts chart");
    return;
  }

  const sessionLabels = sessions.map(s => new Date(s.start_time).toLocaleDateString());

  const blockedCounts = sessions.map(s => s.num_block_events || 0);

  new Chart(document.getElementById("blockedPieChart"), {
    type: 'bar',
    data: {
      labels: sessionLabels,
      datasets: [{
        label: 'Blocked site attempts',
        data: blockedCounts,
        backgroundColor: 'rgba(255, 99, 132, 0.7)'
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
});

