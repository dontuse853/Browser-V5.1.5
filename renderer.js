// ====== EDIT THESE ======
// %s is replaced with whatever the user types into the address bar
const SEARCH_URL = "https://www.google.com/search?q=%s";
// Page that opens in every new tab
const HOME_URL = "https://www.youtube.com";
// ========================

const tabbar = document.getElementById("tabbar");
const views = document.getElementById("views");
const urlInput = document.getElementById("url");

let tabs = [];
let activeId = null;
let nextId = 1;

function toURL(input) {
  const text = input.trim();
  if (!text) return HOME_URL;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(text)) return text;
  if (/^localhost(:\d+)?(\/.*)?$/i.test(text)) return "http://" + text;
  if (!/\s/.test(text) && /^[^\/]+\.[a-z]{2,}(:\d+)?(\/.*)?$/i.test(text)) return "https://" + text;
  return SEARCH_URL.replace("%s", encodeURIComponent(text));
}

function activeTab() {
  return tabs.find((t) => t.id === activeId);
}

function newTab(url = HOME_URL) {
  const id = nextId++;

  const view = document.createElement("webview");
  view.setAttribute("src", url);
  view.setAttribute("partition", "persist:main"); // keeps logins/cookies between launches
  view.setAttribute("allowpopups", "");
  views.appendChild(view);

  const el = document.createElement("div");
  el.className = "tab";
  el.innerHTML = '<span class="title">New Tab</span><span class="close">×</span>';
  tabbar.insertBefore(el, document.getElementById("newtab"));

  const tab = { id, view, el };
  tabs.push(tab);

  el.addEventListener("click", () => switchTab(id));
  el.querySelector(".close").addEventListener("click", (e) => {
    e.stopPropagation();
    closeTab(id);
  });

  view.addEventListener("page-title-updated", (e) => {
    el.querySelector(".title").textContent = e.title;
  });
  const syncUrl = (e) => {
    if (id === activeId && e.url && document.activeElement !== urlInput) urlInput.value = e.url;
  };
  view.addEventListener("did-navigate", syncUrl);
  view.addEventListener("did-navigate-in-page", syncUrl);

  switchTab(id);
}

function switchTab(id) {
  activeId = id;
  tabs.forEach((t) => {
    t.view.classList.toggle("hidden", t.id !== id);
    t.el.classList.toggle("active", t.id === id);
  });
  const tab = activeTab();
  try {
    urlInput.value = tab.view.getURL() || "";
  } catch {
    urlInput.value = "";
  }
}

function closeTab(id) {
  const index = tabs.findIndex((t) => t.id === id);
  if (index === -1) return;
  const [tab] = tabs.splice(index, 1);
  tab.view.remove();
  tab.el.remove();
  if (tabs.length === 0) return newTab();
  if (id === activeId) switchTab(tabs[Math.max(0, index - 1)].id);
}

function navigate(input) {
  const tab = activeTab();
  if (tab) tab.view.loadURL(toURL(input));
}

// Toolbar
document.getElementById("newtab").addEventListener("click", () => newTab());
document.getElementById("back").addEventListener("click", () => {
  const t = activeTab();
  if (t && t.view.canGoBack()) t.view.goBack();
});
document.getElementById("forward").addEventListener("click", () => {
  const t = activeTab();
  if (t && t.view.canGoForward()) t.view.goForward();
});
document.getElementById("reload").addEventListener("click", () => {
  const t = activeTab();
  if (t) t.view.reload();
});
document.getElementById("vpn").addEventListener("click", () => {
  newTab(new URL("vpn.html", location.href).href);
});
urlInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    navigate(urlInput.value);
    activeTab().view.focus();
  }
});
urlInput.addEventListener("focus", () => urlInput.select());

// Menu shortcuts and popup links from the main process
window.api.on("open-tab", (url) => newTab(url));
window.api.on("new-tab", () => newTab());
window.api.on("close-tab", () => activeTab() && closeTab(activeId));
window.api.on("focus-url", () => urlInput.focus());
window.api.on("reload", () => activeTab() && activeTab().view.reload());

newTab();
