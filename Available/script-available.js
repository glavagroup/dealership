const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSOVAB4idBjItPEOwxQvOGM4dAaYeWBuY49qlllo9bo-YW11K2e9wHLo3Ul8RKwiswKanQ29XbSMbZ8/pub?output=csv';
const AUTO_REFRESH_MS = 30000;

// Format utils
function formatMileage(str) {
  if (!str) return '';
  let miles = parseFloat(str.replace(/,/g, '').replace(/[^\d.]/g,''));
  if (!isNaN(miles)) return `${miles.toLocaleString()} miles`;
  return str;
}
function formatPrice(str) {
  if (!str) return '';
  let price = parseFloat(str.replace(/,/g, '').replace(/[^\d.]/g,''));
  if (!isNaN(price)) return `$${price.toLocaleString()}`;
  return str;
}

function parseCSV(data) {
  const lines = data.trim().split('\n');
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    let cols = [];
    let curr = '', inQuotes = false;
    for(let i=0;i<line.length;i++){
      if(line[i]==='"') inQuotes = !inQuotes;
      else if(line[i]===',' && !inQuotes) {cols.push(curr); curr='';}
      else curr+=line[i];
    }
    cols.push(curr);
    const obj = {};
    headers.forEach((hdr,i) => obj[hdr.trim()] = cols[i] ? cols[i].trim() : '');
    return obj;
  });
}

async function fetchData() {
  try {
    const res = await fetch(SHEET_CSV_URL);
    const csv = await res.text();
    const entries = parseCSV(csv);

    renderCards(entries);
  } catch (e) {
    document.getElementById('card-list').innerHTML = "<div style='color:red;font-weight:600;'>Error fetching listings.</div>";
  }
}

// Car grid cards
function renderCards(entries) {
  const container = document.getElementById('card-list');
  container.innerHTML = entries.map((car, idx) => `
    <div class="card" tabindex="0" onclick="openCarModal(${idx})">
      <img class="main-image" src="${car.Image || 'https://via.placeholder.com/320x180?text=No+Image'}" alt="${car.Make} ${car.Model}" />
      <div class="card-content">
        <div class="make-model">${car.Make || ''} ${car.Model || ''}</div>
        <div class="price">${formatPrice(car.Price)}</div>
        <div class="card-details">
          ${car.Year ? car.Year : ''}
          ${car.Mileage ? ' | ' + formatMileage(car.Mileage) : ''}
          ${car["Transmission"] ? ' | ' + car["Transmission"] : ''}
          ${car["Fuel type"] ? ' | ' + car["Fuel type"] : ''}
          ${car["Exterior Color"] ? ' | ' + car["Exterior Color"] : ''}
        </div>
        <div class="card-description">${car.Description || ''}</div>
      </div>
    </div>
  `).join('');
  window.currentEntries = entries;
}

// Modal view logic
window.openCarModal = function(idx) {
  const car = window.currentEntries[idx];
  showCarModal(car);
};

function showCarModal(car) {
  // Images: main + gallery
  let images = [];
  if (car.Image) images.push(car.Image);
  if (car.Gallery) {
    images = images.concat(car.Gallery.split(';').map(u => u.trim()).filter(u => !!u));
  }

  // Main image (large), gallery images (small)
  document.getElementById('modal-images').innerHTML = `
    <img class="modal-main-img" src="${images[0] || 'https://via.placeholder.com/450x220?text=No+Image'}" alt="Main Car Image"
      onclick="openImgModal('${encodeURIComponent(images[0]||'') || ''}')"/>
    <div class="modal-gallery-img-row">
      ${images.slice(1).map((url,idx) => 
        `<img src="${url}" alt="Gallery ${idx+1}" onclick="openImgModal('${encodeURIComponent(url)}')" />`
      ).join('')}
    </div>
  `;

  document.getElementById('modal-details').innerHTML = `
      <div class="modal-make-model">${car.Make || ''} ${car.Model || ''}</div>
      <div class="modal-price">${formatPrice(car.Price)}</div>
      <div class="modal-specs-row">
        ${car.Year ? `<div class="modal-spec">Year: ${car.Year}</div>` : ''}
        ${car.Mileage ? `<div class="modal-spec">Mileage: ${formatMileage(car.Mileage)}</div>` : ''}
        ${car["Transmission"] ? `<div class="modal-spec">Transmission: ${car["Transmission"]}</div>` : ''}
        ${car["Fuel type"] ? `<div class="modal-spec">Fuel: ${car["Fuel type"]}</div>` : ''}
        ${car["Interior"] ? `<div class="modal-spec">Interior: ${car["Interior"]}</div>` : ''}
        ${car["Exterior Color"] ? `<div class="modal-spec">Color: ${car["Exterior Color"]}</div>` : ''}
      </div>
      <div class="modal-desc"><span class="modal-desc-title">Description</span><br>${car.Description || ''}</div>
      <div class="modal-feats"><span class="modal-feats-title">Features</span><br>${car.Features || ''}</div>
  `;
  document.getElementById('car-modal').style.display = "flex";
  document.querySelector('.modal-content').focus();
}

window.closeModal = function(e) {
  document.getElementById('car-modal').style.display = "none";
  if (e) e.stopPropagation();
}

// Fullscreen image modal
window.openImgModal = function(urlEnc) {
  const url = decodeURIComponent(urlEnc);
  const imgModal = document.getElementById('img-modal');
  document.getElementById('full-img').src = url;
  imgModal.style.display = "flex";
  document.querySelector('.img-modal-content').focus();
};
window.closeImgModal = function(e) {
  document.getElementById('img-modal').style.display = "none";
  document.getElementById('full-img').src = '';
  if (e) e.stopPropagation();
};

// Allow ESC to close modals
window.addEventListener('keydown', function(e){
  if (e.key === "Escape") {
    document.getElementById('car-modal').style.display = "none";
    document.getElementById('img-modal').style.display = "none";
    document.getElementById('full-img').src = '';
  }
});

// Initial Data Load & Auto-refresh
fetchData();
setInterval(fetchData, AUTO_REFRESH_MS);