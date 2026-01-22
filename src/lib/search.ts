import type { Network, Station } from './types';

/** 検索用の正規化。全角英数や空白の揺れを吸収し、カタカナをひらがなへ畳む */
export function normalizeQuery(input: string): string {
  return input
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60));
}

const RANK = {
  exact: 0,
  namePrefix: 1,
  kanaPrefix: 2,
  nameIncludes: 3,
  kanaIncludes: 4,
} as const;

function rankOf(station: Station, q: string): number | null {
  if (station.name === q || station.kana === q) return RANK.exact;
  if (station.name.startsWith(q)) return RANK.namePrefix;
  if (station.kana.startsWith(q)) return RANK.kanaPrefix;
  if (station.name.includes(q)) return RANK.nameIncludes;
  if (station.kana.includes(q)) return RANK.kanaIncludes;
  return null;
}

/**
 * 駅名・読みの両方で前方一致を優先しつつ候補を返す。
 * 同順位は読みの五十音順。
 */
export function matchStations(net: Network, query: string, limit = 8): Station[] {
  const q = normalizeQuery(query);
  if (q === '') return [];
  const hits: { station: Station; rank: number }[] = [];
  for (const station of net.stations.values()) {
    const rank = rankOf(station, q);
    if (rank !== null) hits.push({ station, rank });
  }
  hits.sort((a, b) => a.rank - b.rank || a.station.kana.localeCompare(b.station.kana, 'ja'));
  return hits.slice(0, limit).map((h) => h.station);
}

/** 入力文字列を一意の駅へ解決する。曖昧・不明なら null */
export function resolveStation(net: Network, input: string): Station | null {
  const q = normalizeQuery(input);
  if (q === '') return null;
  for (const station of net.stations.values()) {
    if (station.name === q || normalizeQuery(station.name) === q || station.kana === q) {
      return station;
    }
  }
  const candidates = matchStations(net, q, 2);
  return candidates.length === 1 ? (candidates[0] ?? null) : null;
}
