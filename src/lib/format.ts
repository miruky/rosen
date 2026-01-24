import type { Leg, RouteResult } from './route';

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}分`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}時間` : `${h}時間${m}分`;
}

/** 「乗換1回・23分」のような経路サマリ */
export function summarizeRoute(route: RouteResult): string {
  return `乗換${route.transfers}回・${formatMinutes(route.totalMinutes)}`;
}

export function describeLeg(leg: Leg): string {
  switch (leg.kind) {
    case 'ride': {
      const from = leg.stations[0];
      const to = leg.stations[leg.stations.length - 1];
      const rides = leg.stations.length - 1;
      return `${leg.line.name} ${from}から${to}まで${rides}駅・${formatMinutes(leg.minutes)}`;
    }
    case 'transfer':
      return `${leg.at}で${leg.toLine.name}へ乗換・${formatMinutes(leg.minutes)}`;
    case 'walk':
      return `${leg.from}から${leg.to}へ徒歩連絡・${formatMinutes(leg.minutes)}`;
  }
}

/**
 * 行程をそのまま貼り付けられる複数行テキストにする。
 * 1行目に区間、2行目にサマリ、続けて各脚を箇条で並べる。
 */
export function routeToText(route: RouteResult): string {
  if (route.legs.length === 0) {
    return `${route.from} → ${route.to}(同じ駅)`;
  }
  const lines = [`${route.from} → ${route.to}`, summarizeRoute(route)];
  for (const leg of route.legs) {
    lines.push(`- ${describeLeg(leg)}`);
  }
  return lines.join('\n');
}
