import type { LineDef, Network, Station, StationDef, WalkLink } from './types';

export interface BuildOptions {
  /** 同一駅で路線を乗り換えるときの所要分。既定は4分 */
  transferMinutes?: number;
}

/**
 * 駅レジストリと路線定義を突き合わせてネットワークを構築する。
 * データの不整合(未登録駅の参照、駅間時分の欠落、重複登録)は
 * 実行時に黙って壊れる前にここで例外にする。
 */
export function buildNetwork(
  stationDefs: StationDef[],
  lines: LineDef[],
  walks: WalkLink[] = [],
  options: BuildOptions = {},
): Network {
  const stations = new Map<string, Station>();
  for (const def of stationDefs) {
    if (stations.has(def.name)) {
      throw new Error(`駅レジストリに重複がある: ${def.name}`);
    }
    stations.set(def.name, { ...def, lines: [] });
  }

  for (const line of lines) {
    if (line.stops.length < 2) {
      throw new Error(`路線 ${line.name} の停車駅が2駅未満`);
    }
    line.stops.forEach((stop, i) => {
      const station = stations.get(stop.at);
      if (!station) {
        throw new Error(`路線 ${line.name} が未登録の駅を参照している: ${stop.at}`);
      }
      const isLast = i === line.stops.length - 1;
      const needsTime = line.loop || !isLast;
      if (needsTime && !(typeof stop.toNext === 'number' && stop.toNext > 0)) {
        throw new Error(`路線 ${line.name} の ${stop.at} に次駅までの所要分がない`);
      }
      if (station.lines.includes(line.id)) {
        throw new Error(`路線 ${line.name} に ${stop.at} が重複している`);
      }
      station.lines.push(line.id);
    });
  }

  for (const walk of walks) {
    const [a, b] = walk.between;
    if (a === b) {
      throw new Error(`徒歩連絡の両端が同じ駅: ${a}`);
    }
    for (const name of walk.between) {
      const station = stations.get(name);
      if (!station) {
        throw new Error(`徒歩連絡が未登録の駅を参照している: ${name}`);
      }
      if (station.lines.length === 0) {
        throw new Error(`徒歩連絡の駅 ${name} がどの路線にも属していない`);
      }
    }
    if (!(walk.minutes > 0)) {
      throw new Error(`徒歩連絡 ${a}-${b} の所要分が不正`);
    }
  }

  return {
    stations,
    lines,
    walks,
    transferMinutes: options.transferMinutes ?? 4,
  };
}

/** 2路線以上が乗り入れる、または徒歩連絡を持つ駅か */
export function isInterchange(net: Network, name: string): boolean {
  const station = net.stations.get(name);
  if (!station) return false;
  if (station.lines.length >= 2) return true;
  return net.walks.some((w) => w.between.includes(name));
}

export function lineById(net: Network, id: string): LineDef {
  const line = net.lines.find((l) => l.id === id);
  if (!line) throw new Error(`未知の路線id: ${id}`);
  return line;
}
