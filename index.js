let db;
const defaultIcon = 'icon/icon-192.png';
// 開啟 IndexedDB
const dbRequest = indexedDB.open('membershipCards', 1);
dbRequest.onupgradeneeded = event => {
  db = event.target.result;
  if (!db.objectStoreNames.contains('cards')) {
    db.createObjectStore('cards', { keyPath: 'id', autoIncrement: true });
  }
};
dbRequest.onsuccess = event => {
  db = event.target.result;
  const path = window.location.pathname;
  if (path.endsWith('index.html') || path === '/' || path === '') initIndexPage();
  else if (path.endsWith('add.html')) initAddPage();
  else if (path.endsWith('settings.html')) initSettingsPage();
};

// ==================== 首頁 ====================
function initIndexPage() {
  const cardListEl = document.getElementById('cardList');
  const cardDetailEl = document.getElementById('cardDetail');
  const backBtn = document.getElementById('backBtn');
  const editBtn = document.getElementById('editBtn');
  const deleteBtn = document.getElementById('deleteBtn');
  let currentCardId = null;

  function renderCardList() {
    const tx = db.transaction(['cards'], 'readonly');
    const store = tx.objectStore('cards');
    const request = store.getAll();
    request.onsuccess = () => {
      const cards = request.result;
      cardListEl.innerHTML = '';
      if (cards.length === 0) {
        cardListEl.innerHTML = '<p>尚未新增任何卡片</p>';
        return;
      }
      cards.forEach(card => {
        const cardEl = document.createElement('article');
        cardEl.classList.add('card');
        cardEl.innerHTML = `
          <img src="${card.icon || defaultIcon}" alt="${card.name}" width="48" />
          <strong>${card.name}</strong>
        `;
        cardEl.addEventListener('click', () => showCardDetail(card));
        cardListEl.appendChild(cardEl);
      });
    };
  }

  function showCardDetail(card) {
  currentCardId = card.id;
  cardListEl.style.display = 'none';
  cardDetailEl.style.display = 'block';
  document.getElementById('cardIcon').src = card.icon || defaultIcon;
  document.getElementById('cardIcon').onerror = () => {
	  document.getElementById('cardIcon').src = defaultIcon;
	};
  document.getElementById('cardName').textContent = card.name;

  const container = document.getElementById('barcodeContainer');
  container.innerHTML = '';

  if (card.format === 'QRCode') {
    const qrDiv = document.createElement('div');
    new QRCode(qrDiv, { text: card.barcode, width: 160, height: 160 });
    container.appendChild(qrDiv);
  } else {
    const svg = document.createElement('svg');
    container.appendChild(svg);
    JsBarcode(svg, card.barcode, {
      format: card.format || 'CODE128',
      displayValue: true
    });
  }

  const barcodeText = document.createElement('p');
  barcodeText.textContent = `條碼號碼：${card.barcode}`;
  barcodeText.style.marginTop = '0.5rem';
  container.appendChild(barcodeText);
}

  backBtn?.addEventListener('click', e => {
    e.preventDefault();
    cardDetailEl.style.display = 'none';
    cardListEl.style.display = 'block';
  });

  deleteBtn?.addEventListener('click', () => {
    if (!confirm('確定要刪除這張卡片嗎？')) return;
    const tx = db.transaction(['cards'], 'readwrite');
    const store = tx.objectStore('cards');
    store.delete(currentCardId);
    tx.oncomplete = () => {
      alert('卡片已刪除');
      cardDetailEl.style.display = 'none';
      renderCardList();
      cardListEl.style.display = 'block';
    };
  });

  editBtn?.addEventListener('click', () => {
    const tx = db.transaction(['cards'], 'readonly');
    const store = tx.objectStore('cards');
    const req = store.get(currentCardId);
    req.onsuccess = () => {
      localStorage.setItem('editCard', JSON.stringify(req.result));
      window.location.href = 'add.html?edit=1';
    };
  });

  renderCardList();
}

// ==================== 新增卡片 ====================
function initAddPage() {
  const nameInput = document.getElementById('name');
  const iconInput = document.getElementById('icon');
  const barcodeInput = document.getElementById('barcode');
  const formatSelect = document.getElementById('barcodeFormat');
  const presetSelect = document.getElementById('preset');
  const video = document.getElementById('scanner');
  const scanBtn = document.getElementById('scanBtn');
  const form = document.getElementById('cardForm');

  fetch('preset-cards.json')
    .then(res => res.json())
    .then(data => {
      data.forEach(card => {
        const option = document.createElement('option');
        option.value = card.name;
        option.textContent = card.name;
        option.dataset.icon = card.icon;
        option.dataset.sample = card.sample;
        option.dataset.format = card.format;
        presetSelect.appendChild(option);
      });
    });

  presetSelect?.addEventListener('change', () => {
    const selected = presetSelect.selectedOptions[0];
    nameInput.value = selected.value;
    iconInput.value = selected.dataset.icon || '';
    barcodeInput.value = selected.dataset.sample || '';
    if (selected.dataset.format) {
      formatSelect.value = selected.dataset.format;
    }
  });

  // 編輯模式
  const editData = localStorage.getItem('editCard');
  if (editData) {
    const card = JSON.parse(editData);
    nameInput.value = card.name;
    iconInput.value = card.icon;
    barcodeInput.value = card.barcode;
    formatSelect.value = card.format || 'CODE128';
    localStorage.removeItem('editCard');
    form.dataset.editId = card.id;
  }

  form?.addEventListener('submit', e => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const icon = iconInput.value.trim();
    const barcode = barcodeInput.value.trim();
    const format = formatSelect.value;
    const cardData = { name, icon, barcode, format };
    const tx = db.transaction(['cards'], 'readwrite');
    const store = tx.objectStore('cards');
    if (form.dataset.editId) {
      cardData.id = parseInt(form.dataset.editId);
      store.put(cardData);
    } else {
      store.add(cardData);
    }
    tx.oncomplete = () => {
      alert('卡片已儲存');
      location.href = 'index.html';
    };
  });

  scanBtn?.addEventListener('click', async () => {
    const codeReader = new ZXing.BrowserMultiFormatReader();
    video.style.display = 'block';
    try {
      const result = await codeReader.decodeOnceFromVideoDevice(undefined, video);
      barcodeInput.value = result.text;
      video.style.display = 'none';
      codeReader.reset();
    } catch (err) {
      alert('掃描失敗：' + err);
      video.style.display = 'none';
    }
  });
}

// ==================== 設定頁 ====================
function initSettingsPage() {
  const themeSelect = document.getElementById('themeSelect');
  const exportBtn = document.getElementById('exportBtn');
  const importBtn = document.getElementById('importBtn');
  const importFile = document.getElementById('importFile');
  const syncBtn = document.getElementById('syncBtn');

  const storedTheme = localStorage.getItem('theme') || 'auto';
  themeSelect.value = storedTheme;
  applyTheme(storedTheme);

  themeSelect.addEventListener('change', () => {
    const selected = themeSelect.value;
    localStorage.setItem('theme', selected);
    applyTheme(selected);
  });

  function applyTheme(mode) {
    const html = document.documentElement;
    html.removeAttribute('data-theme');
    if (mode === 'dark') html.setAttribute('data-theme', 'dark');
    else if (mode === 'light') html.setAttribute('data-theme', 'light');
  }

  exportBtn.addEventListener('click', () => {
    const tx = db.transaction(['cards'], 'readonly');
    const store = tx.objectStore('cards');
    const req = store.getAll();
    req.onsuccess = () => {
      const blob = new Blob([JSON.stringify(req.result, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cards-backup.json';
      a.click();
    };
  });

  importBtn.addEventListener('click', () => {
    const file = importFile.files[0];
    if (!file) return alert('請先選擇檔案');
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        const tx = db.transaction(['cards'], 'readwrite');
        const store = tx.objectStore('cards');
        data.forEach(card => store.put(card));
        tx.oncomplete = () => alert('匯入成功！');
      } catch (err) {
        alert('無法解析檔案');
      }
    };
    reader.readAsText(file);
  });

  syncBtn.addEventListener('click', () => {
    alert('雲端同步尚未實作，可串接 Google Drive 或 Firebase 等服務');
  });
}
