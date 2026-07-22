import { initSmoothScroll } from './smooth-scroll.js';

const lenis = initSmoothScroll({ anchorOffset: -112 });

const header = document.querySelector('[data-header]');
const menuToggle = document.querySelector('[data-menu-toggle]');
const mainNav = document.querySelector('[data-nav]');
let lastScrollY = window.scrollY;
let directionDistance = 0;
let lastDirection = 0;
let tabNavigationInProgress = false;
let tabNavigationId = 0;

function setHeaderHidden(isHidden) {
  document.documentElement.classList.toggle('analysis-header-hidden', isHidden);
}

window.addEventListener('scroll', () => {
  const currentScrollY = Math.max(window.scrollY, 0);
  const delta = currentScrollY - lastScrollY;
  const direction = Math.sign(delta);

  header?.classList.toggle('scrolled', currentScrollY > 40);

  if (currentScrollY <= 24) {
    setHeaderHidden(false);
    directionDistance = 0;
  } else if (!tabNavigationInProgress && Math.abs(delta) > .5 && !mainNav?.classList.contains('open')) {
    directionDistance = direction === lastDirection
      ? directionDistance + Math.abs(delta)
      : Math.abs(delta);

    if (direction > 0 && currentScrollY > 90 && directionDistance > 14) setHeaderHidden(true);
    if (direction < 0 && directionDistance > 10) setHeaderHidden(false);
  }

  if (direction) lastDirection = direction;
  lastScrollY = currentScrollY;
}, { passive: true });

function setMenuOpen(isOpen) {
  if (isOpen) setHeaderHidden(false);
  mainNav?.classList.toggle('open', isOpen);
  menuToggle?.setAttribute('aria-expanded', String(isOpen));
}

menuToggle?.addEventListener('click', () => setMenuOpen(!mainNav?.classList.contains('open')));
mainNav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenuOpen(false)));

let menuTouchStartX = 0;
let menuTouchStartY = 0;

window.addEventListener('touchstart', (event) => {
  menuTouchStartX = event.touches[0].clientX;
  menuTouchStartY = event.touches[0].clientY;
}, { passive: true });

window.addEventListener('touchend', (event) => {
  if (window.innerWidth > 800 || !mainNav) return;
  const touch = event.changedTouches[0];
  const deltaX = touch.clientX - menuTouchStartX;
  const deltaY = touch.clientY - menuTouchStartY;
  const horizontal = Math.abs(deltaX) > 65 && Math.abs(deltaX) > Math.abs(deltaY) * 1.25;
  if (!horizontal) return;
  if (deltaX < 0 && menuTouchStartX > window.innerWidth * .72) setMenuOpen(true);
  if (deltaX > 0 && mainNav.classList.contains('open')) setMenuOpen(false);
}, { passive: true });

const reveal = new IntersectionObserver((entries) => entries.forEach((entry) => {
  if (entry.isIntersecting) {
    entry.target.classList.add('visible');
    reveal.unobserve(entry.target);
  }
}), { threshold: 0.08, rootMargin: '0px 0px -40px' });

document.querySelectorAll('.analysis-block, .categories, .analysis-contact').forEach((section) => {
  section.classList.add('is-reveal');
  reveal.observe(section);
});

const analysisSections = [...document.querySelectorAll('.analysis-block[id]')];
const analysisLinks = [...document.querySelectorAll('[data-analysis-tabs] a')];
const analysisNavigationLinks = [...document.querySelectorAll('[data-analysis-tabs] a, .categories nav a')];
const analysisTabs = document.querySelector('[data-analysis-tabs]');
const analysisTabsScroller = analysisTabs?.querySelector('.analysis-tabs-links');

analysisNavigationLinks.forEach((link) => link.addEventListener('click', (event) => {
  const section = document.getElementById(link.hash.slice(1));
  if (!section) return;

  event.preventDefault();
  event.stopPropagation();
  setHeaderHidden(true);
  tabNavigationInProgress = true;
  const navigationId = ++tabNavigationId;
  const title = section.querySelector('.analysis-content header') || section;
  const tabsHeight = analysisTabs?.offsetHeight || (window.innerWidth <= 800 ? 48 : 42);
  const titleGap = window.innerWidth <= 800 ? 22 : 30;
  const titleTop = tabsHeight + titleGap;
  const offset = -titleTop;

  analysisLinks.forEach((tabLink) => tabLink.classList.toggle('active', tabLink.hash === link.hash));
  history.replaceState(null, '', link.hash);
  lenis.scrollTo(title, {
    offset,
    duration: 1.35,
    onComplete: () => {
      if (navigationId === tabNavigationId) tabNavigationInProgress = false;
    },
  });
}));

const activeAnalysis = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const currentLink = analysisLinks.find((link) => link.hash === `#${entry.target.id}`);
    analysisLinks.forEach((link) => link.classList.toggle('active', link === currentLink));
    if (currentLink && analysisTabsScroller) {
      const centeredLeft = currentLink.offsetLeft
        - (analysisTabsScroller.clientWidth - currentLink.offsetWidth) / 2;
      analysisTabsScroller.scrollTo({ left: centeredLeft, behavior: 'smooth' });
    }
  });
}, { rootMargin: '-35% 0px -55%', threshold: 0 });
analysisSections.forEach((section) => activeAnalysis.observe(section));

const map = document.querySelector('.land-price-map');
const mapImage = map?.querySelector('img');
const mapTooltip = map?.querySelector('[data-map-tooltip]');
const mapHint = map?.querySelector('[data-map-hint]');

if (map && mapHint) {
  map.addEventListener('pointerenter', () => map.classList.add('map-interacted'));
  map.addEventListener('pointerleave', (event) => {
    if (event.pointerType !== 'touch') map.classList.remove('map-interacted');
  });
  map.addEventListener('touchstart', () => map.classList.add('map-interacted'), { once: true, passive: true });
}
const classRows = [
  ['Agricultura de Alto Potencial', 100000],
  ['Agricultura de Médio Potencial', 75000],
  ['Culturas Permanentes', 50000],
  ['Pastagem de Alto Suporte', 30000],
  ['Pastagem de Médio Suporte', 15000],
  ['Silvicultura', 25000],
  ['Remanescente de Vegetação', 75000],
];
const poleFactors = { 1: 1, 2: .94, 3: .88, 4: .81, 5: .74, 6: .68, 7: .62, 8: .56, 9: .51, 10: .46 };
const valueFormatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const poleColors = {
  1: [24, 88, 45, 132],
  2: [48, 111, 49, 129],
  3: [76, 137, 54, 126],
  4: [106, 159, 58, 123],
  5: [137, 180, 63, 120],
  6: [166, 198, 69, 117],
  7: [190, 211, 77, 114],
  8: [208, 220, 86, 111],
  9: [221, 226, 98, 108],
  10: [232, 232, 112, 105],
};

async function prepareVectorBoundaries() {
  const [polesResponse, stateResponse] = await Promise.all([
    fetch('/polos-agro.geojson'),
    fetch('/mt-limite.geojson'),
  ]);
  if (!polesResponse.ok || !stateResponse.ok) throw new Error('Não foi possível carregar os limites territoriais.');
  const [polesCollection, stateCollection] = await Promise.all([
    polesResponse.json(),
    stateResponse.json(),
  ]);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = mapImage.naturalWidth;
  canvas.height = mapImage.naturalHeight;
  canvas.className = 'map-boundary-overlay';

  const worldSize = 1024 * Math.pow(2, 3.7);
  const project = ([longitude, latitude]) => {
    const sinLatitude = Math.sin(latitude * Math.PI / 180);
    const worldX = (longitude + 180) / 360 * worldSize;
    const worldY = (0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (4 * Math.PI)) * worldSize;
    const centerLongitude = (-57.5 + 180) / 360 * worldSize;
    const centerSinLatitude = Math.sin(-11 * Math.PI / 180);
    const centerLatitude = (0.5 - Math.log((1 + centerSinLatitude) / (1 - centerSinLatitude)) / (4 * Math.PI)) * worldSize;
    return [
      worldX - centerLongitude + canvas.width / 2,
      worldY - centerLatitude + canvas.height / 2,
    ];
  };

  const traceRing = (target, ring) => {
    ring.forEach((coordinate, index) => {
      const [x, y] = project(coordinate);
      if (index === 0) target.moveTo(x, y);
      else target.lineTo(x, y);
    });
    target.closePath();
  };

  context.lineJoin = 'round';
  context.lineCap = 'round';
  const getGeometries = (collection) => collection.features?.map((feature) => feature.geometry)
    || collection.geometries
    || [collection];
  const drawCollection = (collection, { color, width, shadowColor = 'transparent', shadowBlur = 0 }) => {
    context.strokeStyle = color;
    context.lineWidth = width;
    context.shadowColor = shadowColor;
    context.shadowBlur = shadowBlur;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;
    getGeometries(collection).forEach((geometry) => {
      const polygons = geometry.type === 'MultiPolygon'
        ? geometry.coordinates
        : [geometry.coordinates];
      context.beginPath();
      polygons.forEach((polygon) => polygon.forEach((ring) => traceRing(context, ring)));
      context.stroke();
    });
  };

  drawCollection(polesCollection, {
    color: 'rgba(139, 145, 140, 0.68)',
    width: 1,
  });
  drawCollection(stateCollection, {
    color: 'rgba(47, 107, 71, 0.95)',
    width: 2.4,
    shadowColor: 'rgba(18, 36, 24, 0.3)',
    shadowBlur: 6,
  });

  map.insertBefore(canvas, mapTooltip);

  const highlightCanvas = document.createElement('canvas');
  const highlightContext = highlightCanvas.getContext('2d');
  highlightCanvas.width = canvas.width;
  highlightCanvas.height = canvas.height;
  highlightCanvas.className = 'pixel-region-overlay';
  map.insertBefore(highlightCanvas, mapTooltip);
  const cursorLabel = document.createElement('div');
  cursorLabel.className = 'map-cursor-label';
  map.insertBefore(cursorLabel, mapTooltip);
  const statePrompt = document.createElement('div');
  statePrompt.className = 'map-state-prompt';
  statePrompt.innerHTML = '<strong>Passe o mouse</strong><small>Explore os valores de cada polo</small>';
  map.insertBefore(statePrompt, mapTooltip);

  const statePath = new Path2D();
  getGeometries(stateCollection).forEach((geometry) => {
    const polygons = geometry.type === 'MultiPolygon'
      ? geometry.coordinates
      : [geometry.coordinates];
    polygons.forEach((polygon) => polygon.forEach((ring) => traceRing(statePath, ring)));
  });

  const polePaths = polesCollection.features.map((feature) => {
    const path = new Path2D();
    const polygons = feature.geometry.type === 'MultiPolygon'
      ? feature.geometry.coordinates
      : [feature.geometry.coordinates];
    polygons.forEach((polygon) => polygon.forEach((ring) => traceRing(path, ring)));
    return { path, pole: feature.properties.polo, properties: feature.properties };
  });
  let highlightedPole = 0;

  const paintStatePrompt = () => {
    highlightContext.clearRect(0, 0, highlightCanvas.width, highlightCanvas.height);
    highlightContext.fillStyle = 'rgba(13, 37, 27, 0.58)';
    highlightContext.strokeStyle = 'rgba(182, 214, 92, 0.72)';
    highlightContext.lineWidth = 2.4;
    highlightContext.lineJoin = 'round';
    highlightContext.fill(statePath, 'evenodd');
    highlightContext.stroke(statePath);
    statePrompt.classList.remove('hidden');
  };

  const paintHighlight = (poleEntry) => {
    const nextPole = poleEntry?.pole || 0;
    if (nextPole === highlightedPole) return;
    highlightedPole = nextPole;
    highlightContext.clearRect(0, 0, highlightCanvas.width, highlightCanvas.height);
    if (!poleEntry) {
      paintStatePrompt();
      mapTooltip.classList.remove('visible');
      mapTooltip.setAttribute('aria-hidden', 'true');
      return;
    }
    statePrompt.classList.add('hidden');
    highlightContext.fillStyle = 'rgba(47, 107, 71, 0.2)';
    highlightContext.strokeStyle = 'rgba(47, 107, 71, 0.9)';
    highlightContext.lineWidth = 2;
    highlightContext.lineJoin = 'round';
    highlightContext.fill(poleEntry.path, 'evenodd');
    highlightContext.stroke(poleEntry.path);

    const factor = poleFactors[poleEntry.pole];
    const rows = classRows.map(([name, baseValue]) => {
      const finalValue = Math.round(baseValue * factor / 500) * 500;
      return `<tr><th>${name}</th><td>abr.-26</td><td>${valueFormatter.format(finalValue)}</td></tr>`;
    }).join('');
    mapTooltip.innerHTML = `<b>Polo ${poleEntry.pole} · ${poleEntry.properties.nome}</b><strong>Classes e valores da terra</strong><small>${poleEntry.properties.referencia}</small><div class="tooltip-table-wrap"><table><thead><tr><th>Classe</th><th>Data</th><th>Valor</th></tr></thead><tbody>${rows}</tbody></table></div><p class="tooltip-disclaimer">Valores meramente demonstrativos. Não representam referências reais de mercado.</p>`;
    mapTooltip.classList.add('visible');
    mapTooltip.setAttribute('aria-hidden', 'false');
  };

  paintStatePrompt();

  map.addEventListener('pointermove', (event) => {
    const rect = mapImage.getBoundingClientRect();
    const coverScale = Math.max(rect.width / canvas.width, rect.height / canvas.height);
    const cropX = (canvas.width * coverScale - rect.width) / 2;
    const cropY = (canvas.height * coverScale - rect.height) / 2;
    const x = (event.clientX - rect.left + cropX) / coverScale;
    const y = (event.clientY - rect.top + cropY) / coverScale;
    const poleEntry = polePaths.find(({ path }) => highlightContext.isPointInPath(path, x, y, 'evenodd'));
    paintHighlight(poleEntry);
    if (poleEntry) {
      cursorLabel.textContent = `Polo ${poleEntry.pole} · ${poleEntry.properties.nome}`;
      cursorLabel.style.left = `${event.clientX - rect.left}px`;
      cursorLabel.style.top = `${event.clientY - rect.top}px`;
      cursorLabel.classList.add('visible');
    } else {
      cursorLabel.classList.remove('visible');
    }

    if (poleEntry && window.innerWidth > 800) {
      const viewportMargin = 16;
      const panelWidth = Math.min(390, Math.max(220, rect.left - viewportMargin));
      mapTooltip.style.width = `${panelWidth}px`;
      mapTooltip.style.left = `${Math.max(viewportMargin, rect.left - panelWidth)}px`;
      const tooltipHalfHeight = mapTooltip.offsetHeight / 2;
      const minimumCenter = viewportMargin + tooltipHalfHeight;
      const maximumCenter = window.innerHeight - viewportMargin - tooltipHalfHeight;
      const mapCenter = rect.top + rect.height / 2;
      const desiredCenter = Math.max(minimumCenter, Math.min(maximumCenter, mapCenter));
      mapTooltip.style.top = `${desiredCenter}px`;
    }
  });
  map.addEventListener('pointerleave', () => {
    paintHighlight(null);
    cursorLabel.classList.remove('visible');
    mapTooltip.style.removeProperty('width');
    mapTooltip.style.removeProperty('left');
    mapTooltip.style.removeProperty('top');
  });
  map.classList.add('pointer-ready');
}

function prepareRedBoundaryMap(boundaryImage) {
  const maxDetectionWidth = 1200;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });
  canvas.width = Math.min(maxDetectionWidth, mapImage.naturalWidth);
  canvas.height = Math.round(canvas.width * mapImage.naturalHeight / mapImage.naturalWidth);

  // Reprojeta o recorte histórico dos polos para o enquadramento continental
  // da imagem Mapbox (centro -57.5/-11, zoom 3.7).
  const outputScale = canvas.width / mapImage.naturalWidth;
  const worldSize = 1024 * Math.pow(2, 3.7) * outputScale;
  const project = (longitude, latitude) => {
    const sinLatitude = Math.sin(latitude * Math.PI / 180);
    return {
      x: (longitude + 180) / 360 * worldSize,
      y: (0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (4 * Math.PI)) * worldSize,
    };
  };
  const mapCenter = project(-57.5, -11);
  const viewportLeft = mapCenter.x - canvas.width / 2;
  const viewportTop = mapCenter.y - canvas.height / 2;
  const sourceNorthWest = project(-64.9, -6.9);
  const sourceSouthEast = project(-46.95, -18.35);
  const boundaryOffsetX = sourceNorthWest.x - viewportLeft;
  const boundaryOffsetY = sourceNorthWest.y - viewportTop;
  const boundaryWidth = sourceSouthEast.x - sourceNorthWest.x;
  const boundaryHeight = sourceSouthEast.y - sourceNorthWest.y;
  context.drawImage(boundaryImage, boundaryOffsetX, boundaryOffsetY, boundaryWidth, boundaryHeight);

  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const pixelCount = canvas.width * canvas.height;
  const redBoundary = new Uint8Array(pixelCount);

  for (let index = 0; index < pixelCount; index += 1) {
    const pixel = index * 4;
    const red = pixels[pixel];
    const green = pixels[pixel + 1];
    const blue = pixels[pixel + 2];
    if (red > 145 && red - green > 48 && red - blue > 38 && green < 165) redBoundary[index] = 1;
  }

  // Expande levemente os traços para fechar as áreas apesar do antialiasing.
  const sealedBoundary = redBoundary.slice();
  const boundaryRadius = 2;
  for (let y = 0; y < canvas.height; y += 1) {
    for (let x = 0; x < canvas.width; x += 1) {
      const index = y * canvas.width + x;
      if (!redBoundary[index]) continue;
      for (let offsetY = -boundaryRadius; offsetY <= boundaryRadius; offsetY += 1) {
        const neighborY = y + offsetY;
        if (neighborY < 0 || neighborY >= canvas.height) continue;
        for (let offsetX = -boundaryRadius; offsetX <= boundaryRadius; offsetX += 1) {
          const neighborX = x + offsetX;
          if (neighborX < 0 || neighborX >= canvas.width) continue;
          sealedBoundary[neighborY * canvas.width + neighborX] = 1;
        }
      }
    }
  }

  const boundaryCanvas = document.createElement('canvas');
  const boundaryContext = boundaryCanvas.getContext('2d');
  boundaryCanvas.width = canvas.width;
  boundaryCanvas.height = canvas.height;
  boundaryCanvas.className = 'map-boundary-overlay';
  const boundaryLayer = boundaryContext.createImageData(canvas.width, canvas.height);
  for (let index = 0; index < pixelCount; index += 1) {
    if (!sealedBoundary[index]) continue;
    const pixel = index * 4;
    boundaryLayer.data[pixel] = 47;
    boundaryLayer.data[pixel + 1] = 107;
    boundaryLayer.data[pixel + 2] = 71;
    boundaryLayer.data[pixel + 3] = 255;
  }
  boundaryContext.putImageData(boundaryLayer, 0, 0);
  map.insertBefore(boundaryCanvas, mapTooltip);

  const labels = new Uint32Array(pixelCount);
  const queue = new Int32Array(pixelCount);
  const components = [{ area: 0, touchesEdge: true }];
  let label = 0;

  for (let start = 0; start < pixelCount; start += 1) {
    if (sealedBoundary[start] || labels[start]) continue;
    label += 1;
    let head = 0;
    let tail = 0;
    let touchesEdge = false;
    labels[start] = label;
    queue[tail++] = start;

    while (head < tail) {
      const index = queue[head++];
      const x = index % canvas.width;
      const y = Math.floor(index / canvas.width);
      if (x === 0 || y === 0 || x === canvas.width - 1 || y === canvas.height - 1) touchesEdge = true;

      const neighbors = [
        x > 0 ? index - 1 : -1,
        x < canvas.width - 1 ? index + 1 : -1,
        y > 0 ? index - canvas.width : -1,
        y < canvas.height - 1 ? index + canvas.width : -1,
      ];
      for (const neighbor of neighbors) {
        if (neighbor < 0 || sealedBoundary[neighbor] || labels[neighbor]) continue;
        labels[neighbor] = label;
        queue[tail++] = neighbor;
      }
    }

    components[label] = { area: tail, touchesEdge };
  }

  const poleAnchors = {
    1: [.292, .266],
    2: [.511, .234],
    3: [.722, .42],
    4: [.70, .75],
    5: [.60, .86],
    6: [.60, .67],
    7: [.45, .79],
    8: [.32, .73],
    9: [.36, .56],
    10: [.52, .46],
  };
  const minimumPoleArea = pixelCount * .004;
  const labelToPole = new Map();

  const isValidPoleLabel = (candidate) => candidate
    && !components[candidate]?.touchesEdge
    && components[candidate].area >= minimumPoleArea
    && !labelToPole.has(candidate);

  Object.entries(poleAnchors).forEach(([poleValue, [relativeX, relativeY]]) => {
    const pole = Number(poleValue);
    const anchorX = Math.round(boundaryOffsetX + relativeX * boundaryWidth);
    const anchorY = Math.round(boundaryOffsetY + relativeY * boundaryHeight);
    let componentLabel = labels[anchorY * canvas.width + anchorX];

    if (!isValidPoleLabel(componentLabel)) {
      componentLabel = 0;
      const searchLimit = Math.round(Math.min(canvas.width, canvas.height) * .07);
      for (let radius = 4; radius <= searchLimit && !componentLabel; radius += 4) {
        const samples = Math.max(16, Math.round(radius * .8));
        for (let sample = 0; sample < samples; sample += 1) {
          const angle = sample / samples * Math.PI * 2;
          const x = Math.round(anchorX + Math.cos(angle) * radius);
          const y = Math.round(anchorY + Math.sin(angle) * radius);
          if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) continue;
          const candidate = labels[y * canvas.width + x];
          if (isValidPoleLabel(candidate)) { componentLabel = candidate; break; }
        }
      }
    }

    if (componentLabel) labelToPole.set(componentLabel, pole);
  });

  const regions = new Uint8Array(pixelCount);
  for (let index = 0; index < pixelCount; index += 1) {
    regions[index] = labelToPole.get(labels[index]) || 0;
  }

  // Mantém o entorno nítido e aplica o desfoque inicial somente dentro dos
  // limites detectados do estado.
  const stateBlurCanvas = document.createElement('canvas');
  const stateBlurContext = stateBlurCanvas.getContext('2d');
  stateBlurCanvas.width = canvas.width;
  stateBlurCanvas.height = canvas.height;
  stateBlurCanvas.className = 'map-state-blur';
  stateBlurContext.filter = 'blur(10px)';
  stateBlurContext.drawImage(mapImage, 0, 0, canvas.width, canvas.height);
  stateBlurContext.filter = 'none';
  stateBlurContext.globalCompositeOperation = 'destination-in';
  const stateMask = stateBlurContext.createImageData(canvas.width, canvas.height);
  for (let index = 0; index < regions.length; index += 1) {
    if (!regions[index]) continue;
    const pixel = index * 4;
    stateMask.data[pixel] = 255;
    stateMask.data[pixel + 1] = 255;
    stateMask.data[pixel + 2] = 255;
    stateMask.data[pixel + 3] = 255;
  }
  const stateMaskCanvas = document.createElement('canvas');
  stateMaskCanvas.width = canvas.width;
  stateMaskCanvas.height = canvas.height;
  stateMaskCanvas.getContext('2d').putImageData(stateMask, 0, 0);
  stateBlurContext.drawImage(stateMaskCanvas, 0, 0);
  stateBlurContext.globalCompositeOperation = 'source-over';
  map.insertBefore(stateBlurCanvas, mapTooltip);

  const regionCanvas = document.createElement('canvas');
  const regionContext = regionCanvas.getContext('2d');
  regionCanvas.width = canvas.width;
  regionCanvas.height = canvas.height;
  regionCanvas.className = 'pixel-region-overlay';
  map.insertBefore(regionCanvas, mapTooltip);
  map.dataset.detectedPoles = String(labelToPole.size);
  map.dataset.detectedPoleIds = [...labelToPole.values()].sort((a, b) => a - b).join(',');

  let paintedPole = 0;
  let tooltipPole = 0;
  let countAnimation = 0;

  const animateTooltipValues = () => {
    const animationId = ++countAnimation;
    const cells = [...mapTooltip.querySelectorAll('[data-value]')];
    const duration = 750;
    const startedAt = performance.now();

    const update = (now) => {
      if (animationId !== countAnimation) return;
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      cells.forEach((cell) => {
        const finalValue = Number(cell.dataset.value);
        cell.textContent = valueFormatter.format(Math.round(finalValue * eased));
      });
      if (progress < 1) requestAnimationFrame(update);
    };

    requestAnimationFrame(update);
  };

  const paintRegion = (pole) => {
    if (pole === paintedPole) return;
    paintedPole = pole;
    regionContext.clearRect(0, 0, regionCanvas.width, regionCanvas.height);
    if (!pole) return;
    const color = poleColors[pole];
    const layer = regionContext.createImageData(regionCanvas.width, regionCanvas.height);
    for (let index = 0; index < regions.length; index += 1) {
      if (regions[index] !== pole) continue;
      const pixel = index * 4;
      layer.data[pixel] = color[0];
      layer.data[pixel + 1] = color[1];
      layer.data[pixel + 2] = color[2];
      layer.data[pixel + 3] = color[3];
    }
    regionContext.putImageData(layer, 0, 0);
  };

  map.classList.add('pointer-ready');
  map.addEventListener('pointermove', (event) => {
    const rect = mapImage.getBoundingClientRect();
    const containScale = Math.min(rect.width / canvas.width, rect.height / canvas.height);
    const renderedWidth = canvas.width * containScale;
    const renderedHeight = canvas.height * containScale;
    const offsetX = (rect.width - renderedWidth) / 2;
    const offsetY = (rect.height - renderedHeight) / 2;
    const x = Math.floor((event.clientX - rect.left - offsetX) / containScale);
    const y = Math.floor((event.clientY - rect.top - offsetY) / containScale);
    const pole = x >= 0 && y >= 0 && x < canvas.width && y < canvas.height
      ? regions[y * canvas.width + x]
      : 0;
    paintRegion(pole);
    if (!pole) {
      tooltipPole = 0;
      countAnimation += 1;
      mapTooltip.classList.remove('visible');
      return;
    }

    if (pole !== tooltipPole) {
      tooltipPole = pole;
      const factor = poleFactors[pole];
      const rows = classRows.map(([name, baseValue]) => {
        const finalValue = Math.round(baseValue * factor / 500) * 500;
        return `<tr><th>${name}</th><td data-value="${finalValue}">0,00</td></tr>`;
      }).join('');
      mapTooltip.innerHTML = `<b>Polo ${pole}</b><strong>Classes e valores da terra</strong><small>Referência abr./2026</small><div class="tooltip-table-wrap"><table><thead><tr><th>Classe</th><th>Valor</th></tr></thead><tbody>${rows}</tbody></table></div><p class="tooltip-disclaimer">Valores meramente demonstrativos. Não representam referências reais de mercado.</p>`;
      animateTooltipValues();
    }

    mapTooltip.classList.add('visible');

    if (window.innerWidth > 800) {
      const viewportMargin = 16;
      const panelWidth = Math.min(390, Math.max(180, rect.left - viewportMargin));
      mapTooltip.style.width = `${panelWidth}px`;
      mapTooltip.style.left = `${rect.left - panelWidth}px`;

      const tooltipHalfHeight = mapTooltip.offsetHeight / 2;
      const imageCenter = rect.top + rect.height / 2;
      const minimumCenter = viewportMargin + tooltipHalfHeight;
      const maximumCenter = window.innerHeight - viewportMargin - tooltipHalfHeight;
      mapTooltip.style.top = `${Math.max(minimumCenter, Math.min(maximumCenter, imageCenter))}px`;
    } else {
      mapTooltip.style.removeProperty('width');
      mapTooltip.style.removeProperty('left');
      mapTooltip.style.removeProperty('top');
    }
  });

  map.addEventListener('pointerleave', () => {
    paintRegion(0);
    tooltipPole = 0;
    countAnimation += 1;
    mapTooltip.classList.remove('visible');
  });

  window.addEventListener('resize', () => {
    paintRegion(0);
    tooltipPole = 0;
    countAnimation += 1;
    mapTooltip.classList.remove('visible');
    mapTooltip.style.removeProperty('width');
    mapTooltip.style.removeProperty('left');
    mapTooltip.style.removeProperty('top');
  }, { passive: true });
}

async function preparePixelMap() {
  if (!map || !mapImage || !mapTooltip || !mapImage.naturalWidth) return;
  if (map.classList.contains('boundaries-only')) {
    await prepareVectorBoundaries();
    return;
  }
  if (map.classList.contains('has-red-boundaries')) {
    const boundaryImage = new Image();
    const boundaryReady = new Promise((resolve, reject) => {
      boundaryImage.addEventListener('load', resolve, { once: true });
      boundaryImage.addEventListener('error', reject, { once: true });
    });
    boundaryImage.src = '/mt-boundaries.webp';
    await boundaryReady;
    prepareRedBoundaryMap(boundaryImage);
    return;
  }
  const maskImage = new Image();
  const maskReady = new Promise((resolve, reject) => {
    maskImage.addEventListener('load', resolve, { once: true });
    maskImage.addEventListener('error', reject, { once: true });
  });
  maskImage.src = '/precoterra-mask.png';
  await maskReady;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });
  canvas.width = maskImage.naturalWidth;
  canvas.height = maskImage.naturalHeight;
  context.imageSmoothingEnabled = false;
  context.drawImage(maskImage, 0, 0);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const regions = new Uint8Array(canvas.width * canvas.height);
  for (let index = 0; index < regions.length; index += 1) {
    const pixel = index * 4;
    regions[index] = pixels[pixel + 3] > 127 ? Math.round(pixels[pixel] / 20) : 0;
  }

  // A numeração impressa no mapa cria pequenos vazios na máscara. Esses
  // vazios devem continuar pertencendo ao polo ao redor, inclusive no hover.
  const visited = new Uint8Array(regions.length);
  const queue = new Int32Array(regions.length);
  const maxNumberHoleArea = 12000;
  for (let start = 0; start < regions.length; start += 1) {
    if (regions[start] || visited[start]) continue;

    let head = 0;
    let tail = 0;
    let surroundingPole = 0;
    let hasMultiplePoles = false;
    let touchesCanvasEdge = false;
    visited[start] = 1;
    queue[tail++] = start;

    while (head < tail) {
      const index = queue[head++];
      const x = index % canvas.width;
      const y = Math.floor(index / canvas.width);
      if (x === 0 || y === 0 || x === canvas.width - 1 || y === canvas.height - 1) {
        touchesCanvasEdge = true;
      }

      const neighbors = [
        x > 0 ? index - 1 : -1,
        x < canvas.width - 1 ? index + 1 : -1,
        y > 0 ? index - canvas.width : -1,
        y < canvas.height - 1 ? index + canvas.width : -1,
      ];

      for (const neighbor of neighbors) {
        if (neighbor < 0) continue;
        const pole = regions[neighbor];
        if (pole) {
          if (!surroundingPole) surroundingPole = pole;
          else if (pole !== surroundingPole) hasMultiplePoles = true;
          continue;
        }
        if (visited[neighbor]) continue;
        visited[neighbor] = 1;
        queue[tail++] = neighbor;
      }
    }

    if (touchesCanvasEdge || hasMultiplePoles || !surroundingPole || tail > maxNumberHoleArea) continue;
    for (let index = 0; index < tail; index += 1) regions[queue[index]] = surroundingPole;
  }

  // O rótulo 4 toca visualmente a faixa estreita que segue até o limite do
  // polo. Preenchemos apenas lacunas que tenham o próprio polo 4 dos dois
  // lados; assim a faixa fica contínua sem atravessar nenhuma divisa.
  const poleFourBounds = {
    left: Math.round(canvas.width * 0.6),
    right: Math.round(canvas.width * 0.69),
    top: Math.round(canvas.height * 0.54),
    bottom: Math.round(canvas.height * 0.68),
  };
  const maxPoleFourGap = Math.round(canvas.width * 0.04);
  for (let pass = 0; pass < 2; pass += 1) {
    for (let y = poleFourBounds.top; y <= poleFourBounds.bottom; y += 1) {
      let x = poleFourBounds.left;
      while (x <= poleFourBounds.right) {
        if (regions[y * canvas.width + x]) { x += 1; continue; }
        const start = x;
        while (x <= poleFourBounds.right && !regions[y * canvas.width + x]) x += 1;
        const end = x - 1;
        const leftPole = start > poleFourBounds.left ? regions[y * canvas.width + start - 1] : 0;
        const rightPole = x <= poleFourBounds.right ? regions[y * canvas.width + x] : 0;
        if (leftPole !== 4 || rightPole !== 4 || end - start + 1 > maxPoleFourGap) continue;
        for (let fillX = start; fillX <= end; fillX += 1) regions[y * canvas.width + fillX] = 4;
      }
    }

    for (let x = poleFourBounds.left; x <= poleFourBounds.right; x += 1) {
      let y = poleFourBounds.top;
      while (y <= poleFourBounds.bottom) {
        if (regions[y * canvas.width + x]) { y += 1; continue; }
        const start = y;
        while (y <= poleFourBounds.bottom && !regions[y * canvas.width + x]) y += 1;
        const end = y - 1;
        const topPole = start > poleFourBounds.top ? regions[(start - 1) * canvas.width + x] : 0;
        const bottomPole = y <= poleFourBounds.bottom ? regions[y * canvas.width + x] : 0;
        if (topPole !== 4 || bottomPole !== 4 || end - start + 1 > maxPoleFourGap) continue;
        for (let fillY = start; fillY <= end; fillY += 1) regions[fillY * canvas.width + x] = 4;
      }
    }
  }

  // Completa a faixa interna sob a numeração até a ponta inferior do polo 4.
  // O formato afunilado acompanha a geometria local sem alcançar os vizinhos.
  const poleFourPatch = {
    centerX: Math.round(canvas.width * 0.64),
    top: Math.round(canvas.height * 0.588),
    bottom: Math.round(canvas.height * 0.66),
    wideRadius: Math.round(canvas.width * 0.018),
    tipRadius: Math.round(canvas.width * 0.005),
  };
  for (let y = poleFourPatch.top; y <= poleFourPatch.bottom; y += 1) {
    const progress = (y - poleFourPatch.top) / (poleFourPatch.bottom - poleFourPatch.top);
    const taper = Math.max(0, (progress - 0.55) / 0.45);
    const radius = Math.round(poleFourPatch.wideRadius + (poleFourPatch.tipRadius - poleFourPatch.wideRadius) * taper);
    for (let x = poleFourPatch.centerX - radius; x <= poleFourPatch.centerX + radius; x += 1) {
      const index = y * canvas.width + x;
      if (!regions[index]) regions[index] = 4;
    }
  }

  const regionCanvas = document.createElement('canvas');
  const regionContext = regionCanvas.getContext('2d');
  regionCanvas.width = canvas.width;
  regionCanvas.height = canvas.height;
  regionCanvas.className = 'pixel-region-overlay';
  map.insertBefore(regionCanvas, mapTooltip);
  let paintedPole = 0;
  let tooltipPole = 0;
  let countAnimation = 0;

  const animateTooltipValues = () => {
    const animationId = ++countAnimation;
    const cells = [...mapTooltip.querySelectorAll('[data-value]')];
    const duration = 750;
    const startedAt = performance.now();
    const update = (now) => {
      if (animationId !== countAnimation) return;
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      cells.forEach((cell) => {
        const finalValue = Number(cell.dataset.value);
        cell.textContent = valueFormatter.format(Math.round(finalValue * eased));
      });
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  };

  const paintRegion = (pole) => {
    if (pole === paintedPole) return;
    paintedPole = pole;
    regionContext.clearRect(0, 0, regionCanvas.width, regionCanvas.height);
    if (!pole) return;
    const color = poleColors[pole];
    const layer = regionContext.createImageData(regionCanvas.width, regionCanvas.height);
    for (let index = 0; index < regions.length; index += 1) {
      if (regions[index] !== pole) continue;
      const pixel = index * 4;
      layer.data[pixel] = color[0];
      layer.data[pixel + 1] = color[1];
      layer.data[pixel + 2] = color[2];
      layer.data[pixel + 3] = color[3];
    }
    regionContext.putImageData(layer, 0, 0);
  };

  map.classList.add('pointer-ready');
  map.addEventListener('pointermove', (event) => {
    const rect = mapImage.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / rect.width * canvas.width);
    const y = Math.floor((event.clientY - rect.top) / rect.height * canvas.height);
    const pole = x >= 0 && y >= 0 && x < canvas.width && y < canvas.height ? regions[y * canvas.width + x] : 0;
    paintRegion(pole);
    if (!pole) { mapTooltip.classList.remove('visible'); return; }
    if (pole !== tooltipPole) {
      tooltipPole = pole;
      const factor = poleFactors[pole];
      const rows = classRows.map(([name, baseValue]) => {
        const finalValue = Math.round(baseValue * factor / 500) * 500;
        return `<tr><th>${name}</th><td>abr.-26</td><td data-value="${finalValue}">0,00</td></tr>`;
      }).join('');
      mapTooltip.innerHTML = `<b>Polo ${pole}</b><strong>Classes e valores da terra</strong><div class="tooltip-table-wrap"><table><thead><tr><th>Classe</th><th>Data</th><th>Valor</th></tr></thead><tbody>${rows}</tbody></table></div>`;
      mapTooltip.classList.remove('no-data');
      animateTooltipValues();
    }
    mapTooltip.style.left = `${event.clientX - rect.left}px`;
    mapTooltip.style.top = `${event.clientY - rect.top}px`;
    mapTooltip.classList.add('visible');
  });
  map.addEventListener('pointerleave', () => {
    paintRegion(0);
    tooltipPole = 0;
    countAnimation += 1;
    mapTooltip.classList.remove('visible');
  });
}

if (map && mapImage) {
  const initializeMap = () => {
    if (map.classList.contains('poles-disabled')) return;
    if (mapImage.complete) preparePixelMap();
    else mapImage.addEventListener('load', preparePixelMap, { once: true });
  };

  if ('IntersectionObserver' in window) {
    const mapObserver = new IntersectionObserver((entries, observer) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      initializeMap();
    }, { rootMargin: '500px 0px' });
    mapObserver.observe(map);
  } else {
    initializeMap();
  }
}
