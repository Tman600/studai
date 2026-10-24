async function loadProjects(){
  const res = await fetch('site-data.json');
  const data = await res.json();
  render(data);
}

function escapeHtml(str){
  const d = document.createElement('div');
  d.textContent = str == null ? '' : String(str);
  return d.innerHTML;
}

function pad(n){ return String(n).padStart(2, '0'); }

// shipped work leads, since that is what a visitor can actually download;
// the numbering runs on through both groups so every project has one number
function renderGroup(containerId, items, status, startIndex){
  const el = document.getElementById(containerId);
  el.innerHTML = '';
  if(!items || items.length === 0){
    el.innerHTML = '<div class="empty-group">Nothing here yet.</div>';
    return;
  }
  items.forEach((item, idx) => {
    const row = document.createElement('a');
    row.className = 'feature';
    row.href = item.slug ? `project/${item.slug}` : '#';

    // a project with no artwork gets its name set on the plate instead of an
    // empty box, so the column of plates stays even
    const plate = item.image
      ? `<img src="${escapeHtml(window.STUD.asset(item.image))}" alt="" loading="lazy">`
      : `<span class="plate-name">${escapeHtml(item.name)}</span>`;

    row.innerHTML = `
      <span class="feature-plate">${plate}</span>
      <span class="feature-text">
        <span class="feature-index">${pad(startIndex + idx)}</span>
        <span class="feature-name">${escapeHtml(item.name)}</span>
        <span class="feature-desc">${escapeHtml(item.desc)}</span>
        <span class="feature-foot">
          ${window.STUD.tagHtml(item, status)}
          <span class="feature-go">${status === 'shipped' && item.downloadUrl ? 'Details &amp; download' : 'Details'} →</span>
        </span>
      </span>
    `;
    el.appendChild(row);
  });
}

// work in progress has no download and little to list yet, so instead of a
// full row each it is set three across, with the opening of its write-up
// standing in for the version line
function renderBench(items, startIndex){
  const el = document.getElementById('buildingList');
  el.innerHTML = '';
  if(!items || items.length === 0){
    el.innerHTML = '<div class="empty-group">Nothing here yet.</div>';
    return;
  }
  el.className = 'bench-grid';
  items.forEach((item, idx) => {
    const card = document.createElement('a');
    card.className = 'bench-card';
    card.href = item.slug ? `project/${item.slug}` : '#';

    const plate = item.image
      ? `<img src="${escapeHtml(window.STUD.asset(item.image))}" alt="" loading="lazy">`
      : `<span class="plate-name">${escapeHtml(item.name)}</span>`;
    const about = (item.longDesc || '').split(/\n\s*\n/)[0];

    card.innerHTML = `
      <span class="feature-plate">${plate}</span>
      <span class="bench-head">
        <span class="feature-index">${pad(startIndex + idx)}</span>
        ${window.STUD.tagHtml(item, 'building')}
      </span>
      <span class="bench-name">${escapeHtml(item.name)}</span>
      <span class="bench-desc">${escapeHtml(item.desc)}</span>
      ${about ? `<span class="bench-about">${escapeHtml(about)}</span>` : ''}
      <span class="feature-go">Details →</span>
    `;
    el.appendChild(card);
  });
}

function render(data){
  const log = data.buildLog || {};
  const shipped = log.shipped || [];
  const building = log.building || [];

  document.getElementById('footerText').textContent = data.footer || '';
  document.getElementById('projectsCount').textContent =
    `${shipped.length} shipped, ${building.length} in progress.`;
  document.getElementById('shippedTotal').textContent = pad(shipped.length);
  document.getElementById('buildingTotal').textContent = pad(building.length);

  renderGroup('shippedList', shipped, 'shipped', 1);
  renderBench(building, shipped.length + 1);
}

loadProjects();
