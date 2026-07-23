/* Shared interaction layer: mobile navigation, reveal motion, route details and theme filters. */
document.addEventListener('DOMContentLoaded', () => {
  const button = document.querySelector('.menu-button'); const nav = document.querySelector('.nav-links');
  if (button && nav) button.addEventListener('click', () => { const open = nav.classList.toggle('open'); button.setAttribute('aria-expanded', String(open)); button.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation'); });
  document.querySelectorAll('.nav-links a').forEach(link => link.addEventListener('click', () => { nav?.classList.remove('open'); button?.setAttribute('aria-expanded','false'); }));
  const observer = new IntersectionObserver(entries => entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('visible'); }), {threshold:.12}); document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  const info = document.querySelector('.map-info'); document.querySelectorAll('.node').forEach(node => node.addEventListener('click', () => { document.querySelectorAll('.node').forEach(n => n.setAttribute('aria-pressed','false')); node.setAttribute('aria-pressed','true'); if(info) info.innerHTML = `<strong>${node.dataset.title}</strong><span>${node.dataset.story}</span>`; }));
  const map = document.querySelector('.map--satellite'); const mapLayer = map?.querySelector('.map-layer');
  if (map && mapLayer) {
    let zoom = 1; let panX = 0; let panY = 0; let dragStart = null; let gestureStart = null;
    const pointers = new Map();
    const clampPan = () => { const maxX = map.clientWidth * (zoom - 1) / 2; const maxY = map.clientHeight * (zoom - 1) / 2; panX = Math.max(-maxX, Math.min(maxX, panX)); panY = Math.max(-maxY, Math.min(maxY, panY)); };
    const renderMap = () => { clampPan(); mapLayer.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`; };
    const setZoom = (nextZoom, clientX, clientY) => { const targetZoom = Math.max(1, Math.min(4, nextZoom)); const rect = map.getBoundingClientRect(); const focusX = clientX ?? rect.left + rect.width / 2; const focusY = clientY ?? rect.top + rect.height / 2; const localX = focusX - rect.left - rect.width / 2; const localY = focusY - rect.top - rect.height / 2; panX = localX - (localX - panX) * targetZoom / zoom; panY = localY - (localY - panY) * targetZoom / zoom; zoom = targetZoom; renderMap(); };
    const resetMap = () => { zoom = 1; panX = 0; panY = 0; renderMap(); };
    const distance = ([first, second]) => Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY);
    const midpoint = ([first, second]) => ({ x: (first.clientX + second.clientX) / 2, y: (first.clientY + second.clientY) / 2 });
    map.addEventListener('wheel', event => { event.preventDefault(); setZoom(zoom + (event.deltaY < 0 ? .25 : -.25), event.clientX, event.clientY); }, { passive: false });
    map.addEventListener('pointerdown', event => {
      if (event.target.closest('button')) return;
      pointers.set(event.pointerId, event); map.setPointerCapture(event.pointerId);
      if (pointers.size === 1) { dragStart = { x: event.clientX, y: event.clientY, panX, panY }; if (zoom > 1) map.classList.add('is-dragging'); }
      if (pointers.size === 2) { const pair = [...pointers.values()]; gestureStart = { distance: distance(pair), zoom, center: midpoint(pair) }; dragStart = null; }
    });
    map.addEventListener('pointermove', event => {
      if (!pointers.has(event.pointerId)) return;
      pointers.set(event.pointerId, event);
      if (pointers.size === 2 && gestureStart) { const pair = [...pointers.values()]; const center = midpoint(pair); setZoom(gestureStart.zoom * distance(pair) / gestureStart.distance, center.x, center.y); return; }
      if (dragStart && zoom > 1) { panX = dragStart.panX + event.clientX - dragStart.x; panY = dragStart.panY + event.clientY - dragStart.y; renderMap(); }
    });
    const endPointer = event => { pointers.delete(event.pointerId); if (!pointers.size) { dragStart = null; gestureStart = null; map.classList.remove('is-dragging'); } };
    map.addEventListener('pointerup', endPointer); map.addEventListener('pointercancel', endPointer);
    map.querySelectorAll('.node--waypoint').forEach(node => node.addEventListener('pointerdown', event => event.stopPropagation()));
    map.querySelectorAll('[data-map-zoom]').forEach(control => control.addEventListener('click', () => { const action = control.dataset.mapZoom; if (action === 'reset') resetMap(); else setZoom(zoom + (action === 'in' ? .5 : -.5)); }));
    window.addEventListener('resize', renderMap); renderMap();
  }
  const rows = [...document.querySelectorAll('.theme-row')]; document.querySelectorAll('.season-tab').forEach(tab => tab.addEventListener('click', () => { document.querySelectorAll('.season-tab').forEach(t => t.classList.remove('active')); tab.classList.add('active'); rows.forEach(row => row.classList.toggle('active', tab.dataset.season === 'all' || row.dataset.season === tab.dataset.season)); }));
});
