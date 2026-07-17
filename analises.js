import { initSmoothScroll } from './smooth-scroll.js';

initSmoothScroll({ anchorOffset: -42 });

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
const activeAnalysis = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const currentLink = analysisLinks.find((link) => link.hash === `#${entry.target.id}`);
    analysisLinks.forEach((link) => link.classList.toggle('active', link === currentLink));
    currentLink?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  });
}, { rootMargin: '-35% 0px -55%', threshold: 0 });
analysisSections.forEach((section) => activeAnalysis.observe(section));

const map = document.querySelector('.land-price-map');
const mapImage = map?.querySelector('img');
const mapTooltip = map?.querySelector('[data-map-tooltip]');
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
async function preparePixelMap() {
  if (!map || !mapImage || !mapTooltip || !mapImage.naturalWidth) return;
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

if (mapImage?.complete) preparePixelMap();
else mapImage?.addEventListener('load', preparePixelMap, { once: true });
