let db;

async function initDb() {
  const SQL = await initSqlJs({ locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.6.2/${file}` });
  db = new SQL.Database();
  db.run("CREATE TABLE IF NOT EXISTS cards (id INTEGER PRIMARY KEY, name TEXT, barcode TEXT)");
  loadCards();
}

function loadCards() {
  const res = db.exec("SELECT * FROM cards");
  const cardsList = document.getElementById('cardsList');
  cardsList.innerHTML = '';

  if (res.length > 0) {
    const values = res[0].values;
    values.forEach(row => {
      const [id, name, barcode] = row;
      const cardDiv = document.createElement('div');
      cardDiv.className = 'card';
      cardDiv.innerHTML = `
        <h3>${name}</h3>
        <svg id="barcode-${id}"></svg><br/>
        <button onclick="editCard(${id})">Edit</button>
        <button onclick="deleteCard(${id})">Delete</button>
      `;
      cardsList.appendChild(cardDiv);
      JsBarcode(`#barcode-${id}`, barcode, { format: "CODE128", width: 2, height: 50 });
    });
  }
}

function deleteCard(id) {
  db.run("DELETE FROM cards WHERE id = ?", [id]);
  loadCards();
}

function editCard(id) {
  const res = db.exec("SELECT * FROM cards WHERE id = ?", [id]);
  if (res.length > 0) {
    const [card] = res[0].values;
    document.getElementById('cardId').value = card[0];
    document.getElementById('cardName').value = card[1];
    document.getElementById('barcodeData').value = card[2];
  }
}

document.getElementById('cardForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const id = document.getElementById('cardId').value;
  const name = document.getElementById('cardName').value.trim();
  const barcode = document.getElementById('barcodeData').value.trim();

  if (name && barcode) {
    if (id) {
      db.run("UPDATE cards SET name = ?, barcode = ? WHERE id = ?", [name, barcode, id]);
    } else {
      db.run("INSERT INTO cards (name, barcode) VALUES (?, ?)", [name, barcode]);
    }
    document.getElementById('cardForm').reset();
    loadCards();
  }
});

async function exportDb() {
  const binaryArray = db.export();
  const blob = new Blob([binaryArray], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'cards.sqlite';
  a.click();
  URL.revokeObjectURL(url);
}

async function importDb() {
  const fileInput = document.getElementById('importFile');
  const file = fileInput.files[0];
  if (!file) return;

  const arrayBuffer = await file.arrayBuffer();
  const SQL = await initSqlJs({ locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.6.2/${file}` });
  db = new SQL.Database(new Uint8Array(arrayBuffer));
  loadCards();
}

let scanner;

function startScan() {
  document.getElementById('scanner').style.display = 'block';
  if (!scanner) {
    scanner = new Html5Qrcode("scanner");
  }
  scanner.start(
    { facingMode: "environment" },
    {
      fps: 10,
      qrbox: { width: 250, height: 250 }
    },
    barcode => {
      document.getElementById('barcodeData').value = barcode;
      scanner.stop();
      document.getElementById('scanner').style.display = 'none';
    }
  ).catch(err => {
    console.error("Scan error", err);
  });
}

initDb();
