import { describe, expect, it } from 'vitest';
import { addRecent, parseRecent, RECENT_LIMIT } from './recent';

describe('addRecent', () => {
  it('新しい経路を先頭に積む', () => {
    const list = addRecent([{ from: '渋谷', to: '浅草' }], { from: '東京', to: '新宿' });
    expect(list[0]).toEqual({ from: '東京', to: '新宿' });
    expect(list).toHaveLength(2);
  });

  it('同じ経路は重複させず先頭へ繰り上げる', () => {
    const base = [
      { from: '東京', to: '新宿' },
      { from: '渋谷', to: '浅草' },
    ];
    const list = addRecent(base, { from: '渋谷', to: '浅草' });
    expect(list).toEqual([
      { from: '渋谷', to: '浅草' },
      { from: '東京', to: '新宿' },
    ]);
  });

  it('出発と到着が逆なら別経路として残す', () => {
    const list = addRecent([{ from: '渋谷', to: '浅草' }], { from: '浅草', to: '渋谷' });
    expect(list).toHaveLength(2);
  });

  it('上限を超えた古い履歴は捨てる', () => {
    let list: { from: string; to: string }[] = [];
    for (let i = 0; i < RECENT_LIMIT + 3; i++) {
      list = addRecent(list, { from: `A${i}`, to: 'Z' });
    }
    expect(list).toHaveLength(RECENT_LIMIT);
    expect(list[0]).toEqual({ from: `A${RECENT_LIMIT + 2}`, to: 'Z' });
  });

  it('入力配列を破壊しない', () => {
    const base = [{ from: '渋谷', to: '浅草' }];
    addRecent(base, { from: '東京', to: '新宿' });
    expect(base).toEqual([{ from: '渋谷', to: '浅草' }]);
  });
});

describe('parseRecent', () => {
  it('正しいJSONを読み込む', () => {
    const raw = JSON.stringify([{ from: '東京', to: '新宿' }]);
    expect(parseRecent(raw)).toEqual([{ from: '東京', to: '新宿' }]);
  });

  it('null・空文字・壊れたJSONは空配列', () => {
    expect(parseRecent(null)).toEqual([]);
    expect(parseRecent('')).toEqual([]);
    expect(parseRecent('{壊れた')).toEqual([]);
  });

  it('配列でない値や形の違う要素は捨てる', () => {
    expect(parseRecent('{"from":"東京"}')).toEqual([]);
    const raw = JSON.stringify([{ from: '東京', to: '新宿' }, { from: '渋谷' }, 42, null]);
    expect(parseRecent(raw)).toEqual([{ from: '東京', to: '新宿' }]);
  });
});
