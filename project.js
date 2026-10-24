function escapeHtml(str){
  const d = document.createElement('div');
  d.textContent = str == null ? '' : String(str);
  return d.innerHTML;
}

function getSlugFromPath(){
  // the slug is whatever follows "project" - /project/<slug> locally,
  // /studai/project/<slug>/ on GitHub Pages
  const parts = window.location.pathname.split('/').filter(Boolean);
  const at = parts.indexOf('project');
  return at >= 0 ? (parts[at + 1] || '') : '';
}

async function loadProject(){
  const slug = getSlugFromPath();
  const res = await fetch('site-data.json');
  const data = await res.json();

  const all = [
    ...(data.buildLog.building || []).map(p => ({ ...p, status: 'building' })),
    ...(data.buildLog.shipped || []).map(p => ({ ...p, status: 'shipped' }))
  ];

  const project = all.find(p => p.slug === slug);

  document.getElementById('footerText').textContent = data.footer || '';

  if(!project){
    document.getElementById('notFound').style.display = 'block';
    return;
  }

  document.title = project.name + ' — STUD AI';

  const statusChip = document.getElementById('statusChip');
  statusChip.className = 'status-chip ' + project.status;

  document.getElementById('statusLabel').textContent = project.status === 'building' ? 'In progress' : 'Shipped';
  document.getElementById('metaTag').innerHTML = window.STUD.tagHtml(project, project.status);
  document.getElementById('projectName').textContent = project.name;
  document.getElementById('projectDesc').textContent = project.desc || '';

  const img = document.getElementById('projectImage');
  if(project.image){
    img.src = window.STUD.asset(project.image);
    img.alt = project.name;
  } else {
    document.getElementById('imageBleed').style.display = 'none';
  }

  document.getElementById('projectLongDesc').textContent = project.longDesc || project.desc || '';

  renderChangelog(project.changelog);
  renderUpcoming(project.upcoming);
  renderDownloadButton(project);

  document.getElementById('projectContent').style.display = 'block';
}

function renderChangelog(changelog){
  const section = document.getElementById('changelogSection');
  const list = document.getElementById('changelogList');
  list.innerHTML = '';

  const entries = (changelog || []).filter(e => e && (e.version || e.notes));
  if(entries.length === 0){
    section.style.display = 'none';
    return;
  }

  entries.forEach(entry => {
    const row = document.createElement('div');
    row.className = 'changelog-entry';
    row.innerHTML = `
      <div class="changelog-marker">
        <span class="changelog-version">${escapeHtml(entry.version || '')}</span>
        <span class="changelog-date">${escapeHtml(entry.date || '')}</span>
      </div>
      <p class="changelog-notes">${escapeHtml(entry.notes || '')}</p>
    `;
    list.appendChild(row);
  });

  section.style.display = 'flex';
}

function renderUpcoming(upcoming){
  const section = document.getElementById('upcomingSection');
  const list = document.getElementById('upcomingList');
  list.innerHTML = '';

  const items = (upcoming || []).filter(item => item && String(item).trim());
  if(items.length === 0){
    section.style.display = 'none';
    return;
  }

  items.forEach(item => {
    const row = document.createElement('div');
    row.className = 'upcoming-item';
    row.innerHTML = `<span class="upcoming-icon" aria-hidden="true"></span><span>${escapeHtml(item)}</span>`;
    list.appendChild(row);
  });

  section.style.display = 'block';
}

function renderDownloadButton(project){
  const btn = document.getElementById('downloadBtn');
  const label = document.getElementById('downloadBtnText');
  const note = document.getElementById('downloadNote');
  const hasDownload = !!(project.downloadUrl && project.downloadUrl.trim());

  // where it comes from used to be stuffed into the status tag; it belongs
  // with the download instead
  note.textContent = hasDownload && project.status !== 'building'
    ? window.STUD.sourceNote(project.downloadUrl.trim())
    : '';

  if(project.status === 'building'){
    btn.classList.add('disabled');
    btn.classList.remove('available');
    btn.removeAttribute('href');
    btn.removeAttribute('download');
    label.textContent = 'Coming soon';
    return;
  }

  if(hasDownload){
    btn.classList.add('available');
    btn.classList.remove('disabled');
    btn.href = project.downloadUrl.trim();
    btn.setAttribute('target', '_blank');
    btn.setAttribute('rel', 'noopener noreferrer');
    label.textContent = project.meta ? `Download ${project.meta}` : 'Download';
  } else {
    btn.classList.add('disabled');
    btn.classList.remove('available');
    btn.removeAttribute('href');
    label.textContent = 'Download not available';
  }
}

loadProject();
