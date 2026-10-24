/* One tag, drawn the same way everywhere: the home page cards, the projects
   page and a project's own page all call this, so a tag cannot drift between
   them. A tag carries one fact - the version, or that there is not one yet -
   and the data file holds only that version string. */
window.STUD = window.STUD || {};

window.STUD.tagHtml = function(item, status){
  const version = (item && item.meta ? String(item.meta) : '').trim();
  const shipped = status === 'shipped';
  const text = version || (shipped ? 'Released' : 'Unreleased');
  return `<span class="tag ${shipped ? 'shipped' : 'building'}">${window.STUD.escape(text)}</span>`;
};

// where a download comes from, said once, next to the download itself rather
// than inside the status tag
window.STUD.sourceNote = function(url){
  try{
    const host = new URL(url).hostname.replace(/^www\./, '');
    if(host.endsWith('github.com')) return 'Source on GitHub';
    if(host.endsWith('google.com')) return 'Hosted on Google Drive';
    return host;
  }catch(e){
    return '';
  }
};

// image paths in site-data.json start with a slash ("/images/zion.png"), which
// would skip past the sub-path the site is served from on GitHub Pages; made
// relative, they resolve against the page's <base> instead
window.STUD.asset = function(path){
  return String(path || '').replace(/^\/+/, '');
};

window.STUD.escape = function(str){
  const d = document.createElement('div');
  d.textContent = str == null ? '' : String(str);
  return d.innerHTML;
};
