import type { LineDef } from '../types';

export const ginza: LineDef = {
  id: 'ginza',
  name: '東京メトロ銀座線',
  color: '#ff9500',
  stops: [
    { at: '渋谷', toNext: 2 },
    { at: '表参道', toNext: 2 },
    { at: '外苑前', toNext: 1 },
    { at: '青山一丁目', toNext: 2 },
    { at: '赤坂見附', toNext: 2 },
    { at: '溜池山王', toNext: 2 },
    { at: '虎ノ門', toNext: 2 },
    { at: '新橋', toNext: 2 },
    { at: '銀座', toNext: 2 },
    { at: '京橋', toNext: 1 },
    { at: '日本橋', toNext: 2 },
    { at: '三越前', toNext: 1 },
    { at: '神田', toNext: 2 },
    { at: '末広町', toNext: 1 },
    { at: '上野広小路', toNext: 2 },
    { at: '上野', toNext: 2 },
    { at: '稲荷町', toNext: 1 },
    { at: '田原町', toNext: 2 },
    { at: '浅草' },
  ],
};
