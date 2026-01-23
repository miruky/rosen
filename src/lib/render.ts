import type { LabelDir, Network, Station } from './types';
import { isInterchange } from './network';
import type { RouteResult } from './route';

export function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export interface ViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 全駅の座標範囲+余白から viewBox を導く。余白はラベルのはみ出し分 */
export function mapViewBox(net: Network, padding = 70): ViewBox {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const s of net.stations.values()) {
    minX = Math.min(minX, s.x);
    minY = Math.min(minY, s.y);
    maxX = Math.max(maxX, s.x);
    maxY = Math.max(maxY, s.y);
  }
  return {
    x: minX - padding,
    y: minY - padding,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2,
  };
}

// ラベル方位ごとのオフセットとアンカー。フォント11pxを前提に
// 駅の丸と重ならない距離に置く。
const LABEL_POS: Record<LabelDir, { dx: number; dy: number; anchor: string }> = {
  n: { dx: 0, dy: -10, anchor: 'middle' },
  s: { dx: 0, dy: 18, anchor: 'middle' },
  e: { dx: 10, dy: 4, anchor: 'start' },
  w: { dx: -10, dy: 4, anchor: 'end' },
  ne: { dx: 8, dy: -8, anchor: 'start' },
  nw: { dx: -8, dy: -8, anchor: 'end' },
  se: { dx: 8, dy: 14, anchor: 'start' },
  sw: { dx: -8, dy: 14, anchor: 'end' },
};

function linePath(net: Network, lineId: string): string {
  const line = net.lines.find((l) => l.id === lineId)!;
  const points = line.stops.map((stop) => {
    const s = net.stations.get(stop.at)!;
    return `${s.x} ${s.y}`;
  });
  const d = `M ${points[0]} L ${points.slice(1).join(' L ')}`;
  return line.loop ? `${d} Z` : d;
}

function stationTitle(net: Network, station: Station): string {
  const lines = station.lines
    .map((id) => net.lines.find((l) => l.id === id)?.name ?? id)
    .join('・');
  return `${station.name}(${station.kana}) ${lines}`;
}

function renderStation(net: Network, station: Station): string {
  const hub = isInterchange(net, station.name);
  const color = hub
    ? ''
    : (net.lines.find((l) => l.id === station.lines[0])?.color ?? 'currentColor');
  const circle = hub
    ? `<circle class="rosen-dot rosen-dot-hub" cx="${station.x}" cy="${station.y}" r="6.5"/>`
    : `<circle class="rosen-dot" cx="${station.x}" cy="${station.y}" r="4" stroke="${color}"/>`;
  return (
    `<g class="rosen-station" data-station="${escapeXml(station.name)}" tabindex="0" ` +
    `role="button" aria-label="${escapeXml(stationTitle(net, station))}">` +
    `<title>${escapeXml(stationTitle(net, station))}</title>${circle}</g>`
  );
}

function renderLabel(station: Station): string {
  const pos = LABEL_POS[station.label ?? 'e'];
  return (
    `<text class="rosen-label" data-station="${escapeXml(station.name)}" ` +
    `x="${station.x + pos.dx}" y="${station.y + pos.dy}" text-anchor="${pos.anchor}">` +
    `${escapeXml(station.name)}</text>`
  );
}

/**
 * ネットワーク全体を路線図SVG文字列にする。DOM不要の純関数。
 * 経路ハイライトは #route-overlay の中身を renderRouteOverlay で
 * 差し替える前提で、空のグループを確保しておく。
 */
export function renderMap(net: Network): string {
  const vb = mapViewBox(net);
  const lines = net.lines
    .map(
      (line) =>
        `<path class="rosen-line" data-line="${line.id}" stroke="${line.color}" ` +
        `d="${linePath(net, line.id)}"/>`,
    )
    .join('');
  const walks = net.walks
    .map((walk) => {
      const a = net.stations.get(walk.between[0])!;
      const b = net.stations.get(walk.between[1])!;
      return `<line class="rosen-walk" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>`;
    })
    .join('');
  const stations = [...net.stations.values()].map((s) => renderStation(net, s)).join('');
  const labels = [...net.stations.values()].map(renderLabel).join('');
  return (
    `<svg class="rosen-map" xmlns="http://www.w3.org/2000/svg" ` +
    `viewBox="${vb.x} ${vb.y} ${vb.width} ${vb.height}" role="img" ` +
    `aria-label="東京主要6路線の路線図">` +
    `<g class="rosen-lines">${lines}</g>` +
    `<g class="rosen-walks">${walks}</g>` +
    `<g class="rosen-route" id="route-overlay"></g>` +
    `<g class="rosen-stations">${stations}</g>` +
    `<g class="rosen-labels" aria-hidden="true">${labels}</g>` +
    `</svg>`
  );
}

/**
 * 探索結果を地図に重ねるハイライト。renderMap の #route-overlay に入れる。
 * 乗車区間には data-leg(乗車区間の連番)を振り、行程リストのホバーから
 * 該当区間だけを浮かび上がらせられるようにする。
 */
export function renderRouteOverlay(net: Network, route: RouteResult): string {
  const parts: string[] = [];
  let rideIndex = 0;
  for (const leg of route.legs) {
    if (leg.kind === 'ride') {
      const points = leg.stations
        .map((name) => {
          const s = net.stations.get(name)!;
          return `${s.x},${s.y}`;
        })
        .join(' ');
      const tag = `data-leg="${rideIndex}"`;
      parts.push(
        `<polyline class="rosen-route-leg" ${tag} stroke="${leg.line.color}" points="${points}"/>`,
        `<polyline class="rosen-route-flow" ${tag} points="${points}"/>`,
      );
      rideIndex += 1;
    } else if (leg.kind === 'walk') {
      const a = net.stations.get(leg.from)!;
      const b = net.stations.get(leg.to)!;
      parts.push(
        `<line class="rosen-route-walk" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>`,
      );
    }
  }
  for (const name of [route.from, route.to]) {
    const s = net.stations.get(name)!;
    parts.push(`<circle class="rosen-route-end" cx="${s.x}" cy="${s.y}" r="9"/>`);
  }
  return parts.join('');
}
