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
  const makeLocationMap = (elementId, resetId, zoom, focused = false) => {
    const element = document.querySelector(elementId); if (!element || !window.L || element.dataset.leafletReady) return;
    element.dataset.leafletReady = 'true'; const estateLocation = [1.3286, 103.8683]; const entrance = [1.3306, 103.8664]; const booths = [1.3298, 103.8695];
    const map = L.map(element, { scrollWheelZoom: true, zoomControl: true, tap: true }).setView(estateLocation, zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(map);
    const estateIcon = L.divIcon({ className: 'estate-location-pin', html: '<span>⌖</span>', iconSize: [42, 42], iconAnchor: [21, 42], popupAnchor: [0, -38] });
    L.marker(estateLocation, { icon: estateIcon }).addTo(map).bindPopup('<strong>Moonstone Estate</strong><br>Moonstone Quest arrival area.');
    L.circleMarker(entrance, { radius: 8, color: '#fff', weight: 2, fillColor: '#258bd0', fillOpacity: 1 }).addTo(map).bindTooltip('Visitor Entrance · Topaz Road', { permanent: focused, direction: 'top' });
    if (focused) { L.circleMarker(booths, { radius: 8, color: '#fff', weight: 2, fillColor: '#d4af37', fillOpacity: 1 }).addTo(map).bindTooltip('Proposed Pop-up Booth Area', { permanent: true, direction: 'bottom' }); L.polygon([[1.3311,103.8670],[1.3306,103.8702],[1.3285,103.8706],[1.3281,103.8680]], { color:'#8fb37b', weight:2, fillColor:'#8fb37b', fillOpacity:.18 }).addTo(map); L.polyline([entrance, booths], { color:'#d4af37', weight:4, dashArray:'8 8' }).addTo(map); }
    const reset = () => { map.setView(estateLocation, zoom); map.invalidateSize(); }; document.querySelector(resetId)?.addEventListener('click', reset);
    requestAnimationFrame(() => window.setTimeout(() => map.invalidateSize(), 150)); window.addEventListener('load', () => map.invalidateSize()); window.addEventListener('resize', () => map.invalidateSize());
  };
  makeLocationMap('#location-map', '#location-map-reset', 15);
  const rows = [...document.querySelectorAll('.theme-row')]; document.querySelectorAll('.season-tab').forEach(tab => tab.addEventListener('click', () => { document.querySelectorAll('.season-tab').forEach(t => t.classList.remove('active')); tab.classList.add('active'); rows.forEach(row => row.classList.toggle('active', tab.dataset.season === 'all' || row.dataset.season === tab.dataset.season)); }));
});
