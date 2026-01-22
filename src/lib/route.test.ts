import { describe, expect, it } from 'vitest';
import { findRoute } from './route';
import { tokyoNetwork } from './index';

const net = tokyoNetwork();

describe('findRoute(東京ネットワーク)', () => {
  it('同一駅は0分・乗換なし', () => {
    const route = findRoute(net, '渋谷', '渋谷');
    expect(route).toEqual({
      from: '渋谷',
      to: '渋谷',
      legs: [],
      totalMinutes: 0,
      transfers: 0,
    });
  });

  it('未知の駅は例外', () => {
    expect(() => findRoute(net, '存在しない駅', '渋谷')).toThrow('未知の駅');
  });

  it('東京-新宿は中央線快速直通16分', () => {
    const route = findRoute(net, '東京', '新宿');
    expect(route).not.toBeNull();
    expect(route!.totalMinutes).toBe(16);
    expect(route!.transfers).toBe(0);
    expect(route!.legs).toHaveLength(1);
    const leg = route!.legs[0]!;
    expect(leg.kind).toBe('ride');
    if (leg.kind === 'ride') {
      expect(leg.line.id).toBe('chuo');
      expect(leg.stations).toEqual(['東京', '神田', '御茶ノ水', '四ツ谷', '新宿']);
    }
  });

  it('渋谷-浅草は銀座線で乗換なし', () => {
    const route = findRoute(net, '渋谷', '浅草')!;
    expect(route.transfers).toBe(0);
    expect(route.legs).toHaveLength(1);
    const leg = route.legs[0]!;
    if (leg.kind === 'ride') {
      expect(leg.line.id).toBe('ginza');
      expect(leg.stations).toHaveLength(19);
    }
  });

  it('環状線は終点をまたいで最短側を回る(東京-有楽町)', () => {
    const route = findRoute(net, '東京', '有楽町')!;
    expect(route.totalMinutes).toBe(2);
    const leg = route.legs[0]!;
    if (leg.kind === 'ride') {
      expect(leg.stations).toEqual(['東京', '有楽町']);
    }
  });

  it('有楽町-六本木は日比谷への徒歩連絡が最短', () => {
    const route = findRoute(net, '有楽町', '六本木')!;
    expect(route.totalMinutes).toBe(11);
    expect(route.legs[0]!.kind).toBe('walk');
    const ride = route.legs[1]!;
    if (ride.kind === 'ride') {
      expect(ride.line.id).toBe('hibiya');
      expect(ride.stations).toEqual(['日比谷', '霞ケ関', '虎ノ門ヒルズ', '神谷町', '六本木']);
    }
  });

  it('中目黒-中野は日比谷線から始まり中野で終わる', () => {
    const route = findRoute(net, '中目黒', '中野')!;
    expect(route.transfers).toBeGreaterThanOrEqual(1);
    const first = route.legs[0]!;
    expect(first.kind).toBe('ride');
    if (first.kind === 'ride') {
      expect(first.line.id).toBe('hibiya');
    }
    const last = route.legs[route.legs.length - 1]!;
    if (last.kind === 'ride') {
      expect(last.stations[last.stations.length - 1]).toBe('中野');
    }
  });

  it('乗換の区間は別の乗車区間として分かれる', () => {
    const route = findRoute(net, '池袋', '浅草')!;
    const rides = route.legs.filter((l) => l.kind === 'ride');
    expect(rides.length).toBeGreaterThanOrEqual(2);
    expect(route.transfers).toBe(route.legs.length - rides.length);
  });

  it('所要時間は向きによらず同じ', () => {
    const ab = findRoute(net, '荻窪', '西船橋')!;
    const ba = findRoute(net, '西船橋', '荻窪')!;
    expect(ab.totalMinutes).toBe(ba.totalMinutes);
  });

  it('全駅対が到達可能', () => {
    const names = [...net.stations.keys()];
    const origin = '東京';
    for (const name of names) {
      expect(findRoute(net, origin, name), `${origin}→${name}`).not.toBeNull();
    }
  });
});
