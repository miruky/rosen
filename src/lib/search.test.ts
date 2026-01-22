import { describe, expect, it } from 'vitest';
import { matchStations, normalizeQuery, resolveStation } from './search';
import { tokyoNetwork } from './index';

const net = tokyoNetwork();

describe('normalizeQuery', () => {
  it('前後の空白と大文字小文字・全角英数を吸収する', () => {
    expect(normalizeQuery('  渋谷 ')).toBe('渋谷');
    expect(normalizeQuery('ABC')).toBe('abc');
  });

  it('カタカナをひらがなへ畳む', () => {
    expect(normalizeQuery('シブヤ')).toBe('しぶや');
    expect(normalizeQuery('ゲートウェイ')).toBe('げーとうぇい');
  });
});

describe('matchStations', () => {
  it('完全一致が先頭に来る', () => {
    expect(matchStations(net, '渋谷')[0]?.name).toBe('渋谷');
    expect(matchStations(net, 'しぶや')[0]?.name).toBe('渋谷');
  });

  it('漢字の前方一致は読みの前方一致より優先される', () => {
    const names = matchStations(net, '新宿').map((s) => s.name);
    expect(names[0]).toBe('新宿');
    expect(names).toContain('新宿三丁目');
  });

  it('読みの前方一致で探せる', () => {
    const names = matchStations(net, 'たか').map((s) => s.name);
    expect(names).toContain('高田馬場');
    expect(names).toContain('高輪ゲートウェイ');
  });

  it('カタカナ入力でも一致する', () => {
    expect(matchStations(net, 'オチャノミズ')[0]?.name).toBe('御茶ノ水');
  });

  it('件数上限を守る', () => {
    expect(matchStations(net, 'し', 5)).toHaveLength(5);
  });

  it('空文字・一致なしは空配列', () => {
    expect(matchStations(net, '')).toEqual([]);
    expect(matchStations(net, '存在しない駅')).toEqual([]);
  });
});

describe('resolveStation', () => {
  it('駅名・読みの完全一致を解決する', () => {
    expect(resolveStation(net, '東京')?.name).toBe('東京');
    expect(resolveStation(net, 'おぎくぼ')?.name).toBe('荻窪');
  });

  it('候補が一意に絞れる入力は解決する', () => {
    expect(resolveStation(net, '高輪')?.name).toBe('高輪ゲートウェイ');
  });

  it('曖昧な入力は解決しない', () => {
    expect(resolveStation(net, '新')).toBeNull();
    expect(resolveStation(net, '')).toBeNull();
  });
});
