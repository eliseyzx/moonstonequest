/* Shared interaction layer: mobile navigation, reveal motion, route details and theme filters. */
document.addEventListener('DOMContentLoaded', () => {
  const button = document.querySelector('.menu-button'); const nav = document.querySelector('.nav-links');
  if (button && nav) button.addEventListener('click', () => { const open = nav.classList.toggle('open'); button.setAttribute('aria-expanded', String(open)); button.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation'); });
  document.querySelectorAll('.nav-links a').forEach(link => link.addEventListener('click', () => { nav?.classList.remove('open'); button?.setAttribute('aria-expanded','false'); }));
  const observer = new IntersectionObserver(entries => entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('visible'); }), {threshold:.12}); document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  const info = document.querySelector('.map-info'); document.querySelectorAll('.node').forEach(node => node.addEventListener('click', () => { document.querySelectorAll('.node').forEach(n => n.setAttribute('aria-pressed','false')); node.setAttribute('aria-pressed','true'); if(info) info.innerHTML = `<strong>${node.dataset.title}</strong><span>${node.dataset.story}</span>`; }));
  const rows = [...document.querySelectorAll('.theme-row')]; document.querySelectorAll('.season-tab').forEach(tab => tab.addEventListener('click', () => { document.querySelectorAll('.season-tab').forEach(t => t.classList.remove('active')); tab.classList.add('active'); rows.forEach(row => row.classList.toggle('active', tab.dataset.season === 'all' || row.dataset.season === tab.dataset.season)); }));
});
