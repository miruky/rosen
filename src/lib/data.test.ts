import { describe, expect, it } from 'vitest';
import { tokyoLines, tokyoStations, tokyoWalks } from './data';
import { buildNetwork } from './network';

describe('東京データセット', () => {
  it('駅レジストリは101駅で重複がない', () => {
    expect(tokyoStations).toHaveLength(101);
    const names = new Set(tokyoStations.map((s) => s.name));
    expect(names.size).toBe(101);
  });

  it('読みはひらがな(長音含む)のみ', () => {
    for (const s of tokyoStations) {
      expect(s.kana, s.name).toMatch(/^[ぁ-んー]+$/);
    }
  });

  it('各路線の駅数が実路線と一致する', () => {
    const counts = Object.fromEntries(tokyoLines.map((l) => [l.id, l.stops.length]));
    expect(counts).toEqual({
      yamanote: 30,
      chuo: 6,
      ginza: 19,
      marunouchi: 25,
      hibiya: 22,
      tozai: 23,
    });
  });

  it('環状は山手線のみ', () => {
    expect(tokyoLines.filter((l) => l.loop).map((l) => l.id)).toEqual(['yamanote']);
  });

  it('系統色は16進カラーコード', () => {
    for (const line of tokyoLines) {
      expect(line.color).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it('駅間時分は1分以上10分以下に収まる', () => {
    for (const line of tokyoLines) {
      for (const stop of line.stops) {
        if (stop.toNext !== undefined) {
          expect(stop.toNext, `${line.id} ${stop.at}`).toBeGreaterThanOrEqual(1);
          expect(stop.toNext, `${line.id} ${stop.at}`).toBeLessThanOrEqual(10);
        }
      }
    }
  });

  it('ネットワークとして矛盾なく構築できる', () => {
    const net = buildNetwork(tokyoStations, tokyoLines, tokyoWalks);
    expect(net.stations.size).toBe(101);
    expect(net.lines).toHaveLength(6);
  });

  it('全駅がいずれかの路線に属する', () => {
    const net = buildNetwork(tokyoStations, tokyoLines, tokyoWalks);
    for (const station of net.stations.values()) {
      expect(station.lines.length, station.name).toBeGreaterThanOrEqual(1);
    }
  });

  it('主要ターミナルの乗り入れ路線が正しい', () => {
    const net = buildNetwork(tokyoStations, tokyoLines, tokyoWalks);
    expect(net.stations.get('東京')?.lines).toEqual(['yamanote', 'chuo', 'marunouchi']);
    expect(net.stations.get('銀座')?.lines).toEqual(['ginza', 'marunouchi', 'hibiya']);
    expect(net.stations.get('上野')?.lines).toEqual(['yamanote', 'ginza', 'hibiya']);
    expect(net.stations.get('高田馬場')?.lines).toEqual(['yamanote', 'tozai']);
  });
});
