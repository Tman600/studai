async function loadSite(){
  const res = await fetch('site-data.json');
  const data = await res.json();
  render(data);
}

function escapeHtml(str){
  const d = document.createElement('div');
  d.textContent = str == null ? '' : String(str);
  return d.innerHTML;
}

function renderCapabilities(caps){
  const el = document.getElementById('capabilitiesList');
  el.innerHTML = '';
  const letters = ['A','B','C','D','E','F'];
  (caps || []).forEach((cap, idx) => {
    const card = document.createElement('div');
    card.className = 'cap-card';
    card.innerHTML = `
      <span class="cap-index">${letters[idx] || (idx+1)}</span>
      <h3 class="cap-title">${escapeHtml(cap.title)}</h3>
      <p class="cap-desc">${escapeHtml(cap.desc)}</p>
    `;
    el.appendChild(card);
  });
}

function renderCards(containerId, items, status){
  const el = document.getElementById(containerId);
  el.innerHTML = '';
  items.forEach(item => {
    const card = document.createElement('a');
    card.className = 'featured-card';
    card.href = item.slug ? `project/${item.slug}` : 'projects';
    // no artwork yet: the name goes on the plate, as on the projects page
    const plate = item.image
      ? `<img src="${escapeHtml(window.STUD.asset(item.image))}" alt="" loading="lazy">`
      : `<span class="plate-name">${escapeHtml(item.name)}</span>`;
    card.innerHTML = `
      <span class="featured-plate">${plate}</span>
      <span class="featured-name">${escapeHtml(item.name)}</span>
      <span class="featured-desc">${escapeHtml(item.desc)}</span>
      ${window.STUD.tagHtml(item, status)}
    `;
    el.appendChild(card);
  });
}

// the home page shows three finished things with artwork, newest first (the
// order they sit in site-data.json), then everything still being built
function renderFeatured(log){
  const shipped = (log && log.shipped) || [];
  const building = (log && log.building) || [];

  renderCards('featuredList', shipped.filter(p => p.image).slice(0, 3), 'shipped');
  renderCards('buildingList', building, 'building');
  document.getElementById('in-progress').hidden = building.length === 0;

  document.getElementById('allProjectsLink').textContent =
    `All ${shipped.length + building.length} projects →`;
}

function render(data){
  document.getElementById('eyebrowText').textContent = data.eyebrow || '';
  document.getElementById('wordmarkText').textContent = data.wordmark || '';
  document.getElementById('captionText').textContent = data.caption || '';
  document.getElementById('ctaTitleText').textContent = data.ctaTitle || '';
  document.getElementById('footerText').textContent = data.footer || '';

  const ctaBtn = document.getElementById('ctaBtn');
  ctaBtn.href = 'mailto:' + (data.ctaEmail || '');
  ctaBtn.textContent = (data.ctaEmail || '') + ' →';

  renderFeatured(data.buildLog);
  renderCapabilities(data.capabilities);
}

loadSite();
