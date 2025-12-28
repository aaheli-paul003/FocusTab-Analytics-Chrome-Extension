const input = document.getElementById("domainInput");
const list = document.getElementById("list");

document.getElementById("addBtn").onclick = async () => {
  const { blockedDomains = [] } = await chrome.storage.local.get("blockedDomains");
  if (input.value && !blockedDomains.includes(input.value)) {
    blockedDomains.push(input.value);
    await chrome.storage.local.set({ blockedDomains });
    render(blockedDomains);
    input.value = "";
  }
};

function render(domains) {
  list.innerHTML = domains.map(d => `<li>${d}</li>`).join("");
}

// Load saved blocked domains
chrome.storage.local.get("blockedDomains").then(data => {
  render(data.blockedDomains || []);
});
