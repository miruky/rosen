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
