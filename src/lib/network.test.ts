import { describe, expect, it } from 'vitest';
import { buildNetwork, isInterchange, lineById } from './network';
import type { LineDef, StationDef, WalkLink } from './types';

const registry: StationDef[] = [
  { name: '甲', kana: 'こう', x: 0, y: 0 },
  { name: '乙', kana: 'おつ', x: 100, y: 0 },
  { name: '丙', kana: 'へい', x: 200, y: 0 },
  { name: '丁', kana: 'てい', x: 100, y: 100 },
];

const lineA: LineDef = {
  id: 'a',
  name: 'A線',
  color: '#336699',
  stops: [{ at: '甲', toNext: 3 }, { at: '乙', toNext: 4 }, { at: '丙' }],
};

const lineB: LineDef = {
  id: 'b',
  name: 'B線',
  color: '#996633',
  stops: [{ at: '乙', toNext: 5 }, { at: '丁' }],
};

describe('buildNetwork', () => {
  it('路線の乗り入れを駅へ集約する', () => {
    const net = buildNetwork(registry, [lineA, lineB]);
    expect(net.stations.get('乙')?.lines).toEqual(['a', 'b']);
    expect(net.stations.get('丁')?.lines).toEqual(['b']);
    expect(net.transferMinutes).toBe(4);
  });

  it('乗換分数を上書きできる', () => {
    const net = buildNetwork(registry, [lineA], [], { transferMinutes: 7 });
    expect(net.transferMinutes).toBe(7);
  });

  it('未登録駅を参照する路線は例外', () => {
    const broken: LineDef = { ...lineA, stops: [{ at: '甲', toNext: 1 }, { at: '戊' }] };
    expect(() => buildNetwork(registry, [broken])).toThrow('未登録の駅');
  });

  it('途中駅の所要分が欠けていたら例外', () => {
    const broken: LineDef = { ...lineA, stops: [{ at: '甲' }, { at: '乙' }] };
    expect(() => buildNetwork(registry, [broken])).toThrow('所要分がない');
  });

  it('環状線は最終駅にも所要分が必要', () => {
    const loop: LineDef = {
      id: 'loop',
      name: '環状',
      color: '#222222',
      loop: true,
      stops: [{ at: '甲', toNext: 2 }, { at: '乙', toNext: 2 }, { at: '丙' }],
    };
    expect(() => buildNetwork(registry, [loop])).toThrow('所要分がない');
  });

  it('駅レジストリの重複は例外', () => {
    expect(() => buildNetwork([...registry, registry[0]!], [lineA])).toThrow('重複');
  });

  it('未知の駅への徒歩連絡は例外', () => {
    const walks: WalkLink[] = [{ between: ['甲', '戊'], minutes: 3 }];
    expect(() => buildNetwork(registry, [lineA], walks)).toThrow('徒歩連絡');
  });

  it('isInterchange は複数路線か徒歩連絡のある駅だけ真', () => {
    const walks: WalkLink[] = [{ between: ['丙', '丁'], minutes: 5 }];
    const net = buildNetwork(registry, [lineA, lineB], walks);
    expect(isInterchange(net, '乙')).toBe(true);
    expect(isInterchange(net, '丙')).toBe(true);
    expect(isInterchange(net, '甲')).toBe(false);
  });

  it('lineById は未知のidで例外', () => {
    const net = buildNetwork(registry, [lineA]);
    expect(lineById(net, 'a').name).toBe('A線');
    expect(() => lineById(net, 'zzz')).toThrow('未知の路線id');
  });
});
