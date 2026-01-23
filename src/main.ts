import './style.css';
import {
  describeLeg,
  escapeXml,
  findRoute,
  formatMinutes,
  mapViewBox,
  matchStations,
  renderMap,
  renderRouteOverlay,
  resolveStation,
  summarizeRoute,
  tokyoNetwork,
} from './lib';
import type { RouteResult, ViewBox } from './lib';

const net = tokyoNetwork();

const mapHost = document.getElementById('map')!;
const fromInput = document.getElementById('from-input') as HTMLInputElement;
const toInput = document.getElementById('to-input') as HTMLInputElement;
const form = document.getElementById('route-form') as HTMLFormElement;
const result = document.getElementById('result')!;
const datalist = document.getElementById('station-list')!;
const legendList = document.getElementById('legend-list')!;
const routeStatus = document.getElementById('route-status')!;
const zoomLevel = document.getElementById('map-zoom-level')!;

mapHost.innerHTML = renderMap(net);
const svg = mapHost.querySelector('svg')!;
const overlay = svg.querySelector('#route-overlay')!;

// ---- 候補リストと凡例 ----

datalist.innerHTML = [...net.stations.values()]
  .map((s) => `<option value="${escapeXml(s.name)}">${escapeXml(s.kana)}</option>`)
  .join('');

legendList.innerHTML = net.lines
  .map(
    (line) =>
      `<li><button type="button" class="legend-item" data-line="${line.id}">` +
      `<span class="legend-chip" style="background:${line.color}"></span>` +
      `${escapeXml(line.name)}</button></li>`,
  )
  .join('');

// 凡例クリックで該当路線を強調(再クリックで解除)
legendList.addEventListener('click', (e) => {
  const button = (e.target as HTMLElement).closest<HTMLElement>('[data-line]');
  if (!button) return;
  const id = button.dataset.line!;
  const active = svg.getAttribute('data-focus-line') === id;
  if (active) {
    svg.removeAttribute('data-focus-line');
    routeStatus.textContent = '全路線を表示中';
  } else {
    svg.setAttribute('data-focus-line', id);
    routeStatus.textContent = `${button.textContent?.trim() ?? '選択路線'}を強調中`;
  }
  for (const item of legendList.querySelectorAll('.legend-item')) {
    item.classList.toggle('is-active', !active && item === button);
  }
  for (const path of svg.querySelectorAll('.rosen-line')) {
    path.classList.toggle('is-dimmed', !active && path.getAttribute('data-line') !== id);
  }
});

// ---- 経路探索 ----

function showError(message: string, query?: string): void {
  let suggestion = '';
  if (query) {
    const candidates = matchStations(net, query, 3).map((s) => s.name);
    if (candidates.length > 0) {
      suggestion = `<p class="result-hint">候補: ${candidates.map(escapeXml).join(' / ')}</p>`;
    }
  }
  result.innerHTML = `<p class="result-error">${escapeXml(message)}</p>${suggestion}`;
}

function renderResult(route: RouteResult): void {
  if (route.legs.length === 0) {
    result.innerHTML = `<p class="result-error">出発と到着が同じ駅です。</p>`;
    return;
  }
  const items = route.legs
    .map((leg) => {
      if (leg.kind === 'ride') {
        const from = leg.stations[0]!;
        const to = leg.stations[leg.stations.length - 1]!;
        return (
          `<li class="leg leg-ride" style="--line-color:${leg.line.color}">` +
          `<strong>${escapeXml(leg.line.name)}</strong>` +
          `<span>${escapeXml(from)} から ${escapeXml(to)}</span>` +
          `<span class="leg-meta">${leg.stations.length - 1}駅・${formatMinutes(leg.minutes)}</span></li>`
        );
      }
      return `<li class="leg leg-${leg.kind}">${escapeXml(describeLeg(leg))}</li>`;
    })
    .join('');
  result.innerHTML =
    `<header class="route-summary"><span>Route found</span><p>${escapeXml(route.from)} から ${escapeXml(route.to)}</p>` +
    `<dl><div><dt>所要</dt><dd>${escapeXml(formatMinutes(route.totalMinutes))}</dd></div>` +
    `<div><dt>乗換</dt><dd>${route.transfers}回</dd></div></dl></header>` +
    `<ol class="route-legs">${items}</ol>`;
  routeStatus.textContent = `${route.from}から${route.to}・${summarizeRoute(route)}`;
}

function runSearch(updateHash = true): void {
  const from = resolveStation(net, fromInput.value);
  const to = resolveStation(net, toInput.value);
  if (!from) {
    showError(`出発駅を特定できません: ${fromInput.value}`, fromInput.value);
    return;
  }
  if (!to) {
    showError(`到着駅を特定できません: ${toInput.value}`, toInput.value);
    return;
  }
  fromInput.value = from.name;
  toInput.value = to.name;
  const route = findRoute(net, from.name, to.name);
  if (!route) {
    showError('経路が見つかりませんでした。');
    return;
  }
  renderResult(route);
  overlay.innerHTML = route.legs.length > 0 ? renderRouteOverlay(net, route) : '';
  svg.classList.toggle('has-route', route.legs.length > 0);
  if (updateHash) {
    const hash = `#r=${encodeURIComponent(from.name)}/${encodeURIComponent(to.name)}`;
    history.replaceState(null, '', hash);
  }
}

function clearRoute(): void {
  fromInput.value = '';
  toInput.value = '';
  overlay.innerHTML = '';
  svg.classList.remove('has-route');
  svg.removeAttribute('data-focus-line');
  for (const item of legendList.querySelectorAll('.legend-item')) {
    item.classList.remove('is-active');
  }
  for (const path of svg.querySelectorAll('.rosen-line')) {
    path.classList.remove('is-dimmed');
  }
  result.innerHTML =
    '<div class="result-empty"><span>Route not selected</span><p>駅を2つ選択すると、ここに行程を表示します。</p></div>';
  routeStatus.textContent = '全路線を表示中';
  history.replaceState(null, '', location.pathname + location.search);
  fromInput.focus();
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  runSearch();
});

document.getElementById('swap-button')!.addEventListener('click', () => {
  [fromInput.value, toInput.value] = [toInput.value, fromInput.value];
  if (fromInput.value && toInput.value) runSearch();
});

document.querySelectorAll<HTMLButtonElement>('.quick-routes [data-from]').forEach((button) => {
  button.addEventListener('click', () => {
    fromInput.value = button.dataset.from ?? '';
    toInput.value = button.dataset.to ?? '';
    runSearch();
  });
});

document.getElementById('clear-route')!.addEventListener('click', clearRoute);

// 地図上の駅選択: 1回目=出発、2回目=到着(続けて選ぶと出発から取り直し)
function pickStation(name: string): void {
  if (!fromInput.value || (fromInput.value && toInput.value)) {
    fromInput.value = name;
    toInput.value = '';
    overlay.innerHTML = '';
    svg.classList.remove('has-route');
    result.innerHTML = `<p class="result-hint">出発: ${escapeXml(name)}。到着駅を選んでください。</p>`;
  } else {
    toInput.value = name;
    runSearch();
  }
}

// ドラッグ直後のclickを駅選択と区別するためのフラグ(パン処理が立てる)
let dragMoved = false;

svg.addEventListener('click', (e) => {
  if (dragMoved) return;
  const g = (e.target as Element).closest<SVGElement>('.rosen-station');
  if (g?.dataset.station) pickStation(g.dataset.station);
});

svg.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const g = (e.target as Element).closest<SVGElement>('.rosen-station');
  if (g?.dataset.station) {
    e.preventDefault();
    pickStation(g.dataset.station);
  }
});

// ---- パンとズーム(viewBox操作) ----

const baseView: ViewBox = mapViewBox(net);
let view: ViewBox = { ...baseView };

function applyView(): void {
  svg.setAttribute('viewBox', `${view.x} ${view.y} ${view.width} ${view.height}`);
  zoomLevel.textContent = `${Math.round((baseView.width / view.width) * 100)}%`;
}

/** クライアント座標を地図座標へ。letterbox(meet)のオフセットを補正する */
function clientToMap(clientX: number, clientY: number): { x: number; y: number } {
  const rect = svg.getBoundingClientRect();
  const scale = Math.min(rect.width / view.width, rect.height / view.height);
  const offsetX = (rect.width - view.width * scale) / 2;
  const offsetY = (rect.height - view.height * scale) / 2;
  return {
    x: view.x + (clientX - rect.left - offsetX) / scale,
    y: view.y + (clientY - rect.top - offsetY) / scale,
  };
}

function zoomAt(factor: number, clientX?: number, clientY?: number): void {
  const rect = svg.getBoundingClientRect();
  const cx = clientX ?? rect.left + rect.width / 2;
  const cy = clientY ?? rect.top + rect.height / 2;
  const pivot = clientToMap(cx, cy);
  const width = Math.min(Math.max(view.width / factor, baseView.width / 8), baseView.width * 1.5);
  const actual = view.width / width;
  view = {
    x: pivot.x - (pivot.x - view.x) / actual,
    y: pivot.y - (pivot.y - view.y) / actual,
    width,
    height: view.height / actual,
  };
  applyView();
}

document.getElementById('zoom-in')!.addEventListener('click', () => zoomAt(1.4));
document.getElementById('zoom-out')!.addEventListener('click', () => zoomAt(1 / 1.4));
document.getElementById('zoom-reset')!.addEventListener('click', () => {
  view = { ...baseView };
  applyView();
});

svg.addEventListener(
  'wheel',
  (e) => {
    e.preventDefault();
    zoomAt(e.deltaY < 0 ? 1.2 : 1 / 1.2, e.clientX, e.clientY);
  },
  { passive: false },
);

let dragging = false;
let lastClient = { x: 0, y: 0 };

svg.addEventListener('pointerdown', (e) => {
  dragging = true;
  dragMoved = false;
  lastClient = { x: e.clientX, y: e.clientY };
  svg.setPointerCapture(e.pointerId);
});

svg.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const dx = e.clientX - lastClient.x;
  const dy = e.clientY - lastClient.y;
  if (!dragMoved && Math.hypot(dx, dy) < 5) return;
  dragMoved = true;
  const rect = svg.getBoundingClientRect();
  const scale = Math.min(rect.width / view.width, rect.height / view.height);
  view = { ...view, x: view.x - dx / scale, y: view.y - dy / scale };
  lastClient = { x: e.clientX, y: e.clientY };
  applyView();
});

svg.addEventListener('pointerup', () => {
  dragging = false;
});

svg.addEventListener('pointercancel', () => {
  dragging = false;
});

// ---- 配色テーマ ----

const THEME_KEY = 'rosen-theme';
const themeToggle = document.getElementById('theme-toggle')!;

function applyTheme(theme: string | null): void {
  if (theme === 'light' || theme === 'dark') {
    document.documentElement.setAttribute('data-theme', theme);
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}

themeToggle.addEventListener('click', () => {
  const current =
    document.documentElement.getAttribute('data-theme') ??
    (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const next = current === 'dark' ? 'light' : 'dark';
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
});

applyTheme(localStorage.getItem(THEME_KEY));

// ---- URLハッシュからの復元(#r=出発/到着) ----

function restoreFromHash(): void {
  const match = location.hash.match(/^#r=([^/]+)\/(.+)$/);
  if (!match) return;
  const from = decodeURIComponent(match[1]!);
  const to = decodeURIComponent(match[2]!);
  if (net.stations.has(from) && net.stations.has(to)) {
    fromInput.value = from;
    toInput.value = to;
    runSearch(false);
  }
}

restoreFromHash();
