const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSOVAB4idBjItPEOwxQvOGM4dAaYeWBuY49qlllo9bo-YW11K2e9wHLo3Ul8RKwiswKanQ29XbSMbZ8/pub?output=csv';
const AUTO_REFRESH_MS = 30000;

let currentEntries = [], imageGallery = [], imageGalleryIndex = 0;

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
    currentEntries = parseCSV(csv);
    renderCards(currentEntries);
  } catch (e) {
    document.getElementById('card-list').innerHTML = "<div style='color:red;font-weight:600;'>Error fetching listings.</div>";
  }
}

// Car grid cards
function renderCards(entries) {
  const container = document.getElementById('card-list');
  container.innerHTML = entries.map((car, idx) => `
    <div class="card" tabindex="0" onclick="openCarModal(${idx})">
      <img class="main-image" src="${car.Image || 'https://via.placeholder.com/320x180?text=No+Image'}" alt="${(car.Make || '') + ' ' + (car.Model || '')}" />
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
}

// ---- MODAL ANIMATED POPUP LOGIC ----
window.openCarModal = function(idx) {
  const car = currentEntries[idx];
  showCarModal(car);
};

function showCarModal(car) {
  // Images: main + gallery
  imageGallery = [];
  if (car.Image) imageGallery.push(car.Image);
  if (car.Gallery) {
    imageGallery = imageGallery.concat(car.Gallery.split(';').map(u => u.trim()).filter(u => !!u));
  }
  imageGalleryIndex = 0;
  document.getElementById('modal-images').innerHTML = `
    <img class="modal-main-img" src="${imageGallery[0] || 'https://via.placeholder.com/450x220?text=No+Image'}" alt="Main Car Image"
      onclick="openImgModal(0)"/>
    <div class="modal-gallery-img-row">
      ${imageGallery.slice(1).map((url,idx) => 
        `<img src="${url}" alt="Gallery ${idx+1}" onclick="openImgModal(${idx+1})" />`
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
  const carModal = document.getElementById('car-modal');
  carModal.style.display = "flex";
  document.body.classList.add('modal-open');
  const modalContent = document.querySelector('.modal-content');
  modalContent.classList.remove('hide-modal');
  void modalContent.offsetWidth;
  modalContent.focus();
}

window.closeModal = function(e) {
  const modalContent = document.querySelector('.modal-content');
  modalContent.classList.add('hide-modal');
  setTimeout(() => {
    document.getElementById('car-modal').style.display = "none";
    modalContent.classList.remove('hide-modal');
    document.body.classList.remove('modal-open');
  }, 210);
  if (e) e.stopPropagation();
};

// --- Fullscreen image gallery modal with arrows ---
function setImgModal(index) {
  // Defensive: clamp index
  if (!imageGallery.length) return;
  imageGalleryIndex = Math.max(0, Math.min(index, imageGallery.length-1));
  document.getElementById('full-img').src = imageGallery[imageGalleryIndex];
  document.getElementById('img-modal').style.display = "flex";
  document.getElementById('img-prev').disabled = imageGalleryIndex === 0;
  document.getElementById('img-next').disabled = imageGalleryIndex === imageGallery.length - 1;
  document.querySelector('.img-modal-content').focus();
  document.body.classList.add('modal-open');
}
window.openImgModal = function(idx) {
  setImgModal(idx);
};
window.closeImgModal = function(e) {
  document.getElementById('img-modal').style.display = "none";
  document.getElementById('full-img').src = '';
  document.body.classList.remove('modal-open');
  if (e) e.stopPropagation();
};
// Arrow button listeners
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('img-prev').onclick = () => setImgModal(imageGalleryIndex - 1);
  document.getElementById('img-next').onclick = () => setImgModal(imageGalleryIndex + 1);
});
window.addEventListener('keydown', function(e){
  const imgModalOpen = document.getElementById('img-modal').style.display === "flex";
  if (e.key === "Escape") {
    window.closeModal();
    window.closeImgModal();
  }
  if (imgModalOpen) {
    if (e.key === "ArrowLeft") {
      if (imageGalleryIndex > 0) setImgModal(imageGalleryIndex - 1);
      e.preventDefault();
    }
    if (e.key === "ArrowRight") {
      if (imageGalleryIndex < imageGallery.length-1) setImgModal(imageGalleryIndex + 1);
      e.preventDefault();
    }
  }
});
// Simple mobile touch swipe for gallery (optional/bonus)
let imgTouchStartX = null;
document.getElementById('full-img').addEventListener('touchstart', e => {
  if (e.touches.length === 1) imgTouchStartX = e.touches[0].clientX;
});
document.getElementById('full-img').addEventListener('touchend', e => {
  if (imgTouchStartX === null) return;
  const dx = e.changedTouches[0].clientX - imgTouchStartX;
  if (Math.abs(dx) > 40) {
    if (dx > 0 && imageGalleryIndex > 0) setImgModal(imageGalleryIndex - 1);
    else if (dx < 0 && imageGalleryIndex < imageGallery.length-1) setImgModal(imageGalleryIndex + 1);
  }
  imgTouchStartX = null;
});

// Initial Data Load & Auto-refresh
fetchData();
setInterval(fetchData, AUTO_REFRESH_MS);