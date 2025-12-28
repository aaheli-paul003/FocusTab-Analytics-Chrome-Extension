# Focus Tab Analytics - Productivity Tracking Chrome Extension
#### Video Demo:  https://youtu.be/SP4oYDL2fPc

---

## Description:
**FocusTab Analytics** is a Chrome extension built using **Manifest V3** that helps users improve productivity by tracking focus sessions, managing tasks, blocking distracting websites, and visualizing productivity data through an analytics dashboard.

The goal of this project was to combine **software engineering** with **data analytics concepts** by logging structured behavioral data and transforming it into meaningful insights. The extension was designed to be lightweight, persistent, and analytics-ready.

---
->
## Features:
### Focus Sessions
* Start and stop focus sessions from the extension popup
* Sessions persist even when the popup is closed
* Automatic calculation of session duration

### Website Blocking
* User-defined list of distracting websites
* Blocking is enabled only during active focus sessions
* Custom blocked page shown instead of default Chrome message
* Counts how many times blocked sites were attempted during a session

### Task Management
* Create and complete tasks directly in the popup
* Tasks remain visible during an active session
* Completed tasks are archived after each session for analytics

### Analytics Dashboard
* Total focus time
* Average session duration
* Focus minutes per day (line chart)
* Tasks completed vs remaining (pie chart)
* Blocked site attempts per session (bar chart)

---

## Technical Details:
* **Platform:** Google Chrome Extension
* **Manifest Version:** MV3
* **Languages:** JavaScript, HTML, CSS
* **Storage:** `chrome.storage.local`
* **Background Logic:** Service Worker
* **Blocking:** `chrome.declarativeNetRequest`
* **Visualization:** Chart.js (local bundle)

---

## Data Model
### Focus Sessions

Each focus session is stored as a structured object containing:

* `id`
* `start_time`
* `end_time`
* `duration_minutes`
* `num_block_events`
* `num_tasks_touched`

### Tasks

Tasks include:

* `task_id`
* `title`
* `status` (open / done)
* `created_at`
* `completed_at`

### Task History

Completed tasks are archived after each session for analytics:

* `task_id`
* `session_id`
* `archived_at`

This design allows task data to remain available for analytics even after being removed from the popup view.

---

## How to run:
1. Clone or download the repository
2. Open Chrome and navigate to `chrome://extensions`
3. Enable **Developer Mode**
4. Click **Load unpacked** and select the project folder
5. Click the extension icon to start using FocusTab Analytics

---

## Conclusion

FocusTab Analytics demonstrates how browser extensions can be used not only as productivity tools but also as platforms for collecting and analyzing behavioral data. This project reflects both my interest in **software development** and **data analytics**, and it served as a practical application of concepts learned throughout CS50.

---
