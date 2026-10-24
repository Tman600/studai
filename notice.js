/* A one-time note that the site has changed. Each visitor sees it once, on
   whichever page they land on first, and never again after that. It is only
   worth saying for a while after the change, so it stops appearing for
   everyone after SHOW_UNTIL. */
(function(){
  const KEY = 'studai-notice-redesign-2026-10';
  const SHOW_UNTIL = new Date('2026-12-01T00:00:00');

  if(new Date() >= SHOW_UNTIL) return;

  // if this browser will not remember that the note was seen, it is not shown
  // at all - otherwise it would come back on every page
  try{
    if(localStorage.getItem(KEY)) return;
    localStorage.setItem(KEY, String(Date.now()));
  }catch(e){
    return;
  }

  const note = document.createElement('aside');
  note.className = 'site-notice';
  note.setAttribute('role', 'status');
  note.innerHTML = `
    <span class="site-notice-label"><span class="status-chip building"></span> Site update</span>
    <p class="site-notice-text">Our site has changed its look a bit, and it should be more convenient to get around. Every project now lives on one <a href="projects">Projects</a> page.</p>
    <button type="button" class="site-notice-close">Got it</button>
  `;
  note.querySelector('.site-notice-close').addEventListener('click', () => note.remove());
  document.body.appendChild(note);
})();
