
async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("membershipDB", 1);
    request.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("cards")) {
        db.createObjectStore("cards", { keyPath: "id", autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
document.addEventListener("DOMContentLoaded", () => {
  // 設定頁邏輯、主題與備份功能
  const themeSelect = document.getElementById("themeMode");
  if (themeSelect) {
    const savedTheme = localStorage.getItem("theme") || "auto";
    themeSelect.value = savedTheme;
    applyTheme(savedTheme);
    themeSelect.addEventListener("change", () => {
      const mode = themeSelect.value;
      localStorage.setItem("theme", mode);
      applyTheme(mode);
    });
  }
  function applyTheme(mode) {
    document.documentElement.removeAttribute("data-theme");
    if (mode === "dark") document.documentElement.setAttribute("data-theme", "dark");
    if (mode === "light") document.documentElement.setAttribute("data-theme", "light");
  }

  const exportBtn = document.getElementById("exportBtn");
  const importBtn = document.getElementById("importBtn");
  const importFile = document.getElementById("importFile");
  if (exportBtn) {
    exportBtn.addEventListener("click", async () => {
      const db = await openDB();
      const tx = db.transaction("cards", "readonly");
      const store = tx.objectStore("cards");
      const req = store.getAll();
      req.onsuccess = () => {
        const blob = new Blob([JSON.stringify(req.result, null, 2)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "membership-cards-backup.json";
        a.click();
      };
    });
  }
  if (importBtn) {
    importBtn.addEventListener("click", async () => {
      const file = importFile.files[0];
      if (!file) return alert("請選擇檔案");
      const text = await file.text();
      try {
        const cards = JSON.parse(text);
        const db = await openDB();
        const tx = db.transaction("cards", "readwrite");
        const store = tx.objectStore("cards");
        cards.forEach(card => store.put(card));
        alert("匯入成功！");
      } catch (e) {
        alert("匯入失敗：" + e.message);
      }
    });
  }

  const syncBtn = document.getElementById("syncBtn");
  if (syncBtn) {
    syncBtn.addEventListener("click", () => {
      alert("同步功能尚未實作");
    });
  }

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js")
      .then(() => console.log("✅ Service Worker 註冊成功"))
      .catch(err => console.error("SW 註冊失敗", err));
  }
});
