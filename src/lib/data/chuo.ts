import type { LineDef } from '../types';

// 快速運転の停車駅のみ(図の範囲は東京-中野)。
export const chuo: LineDef = {
  id: 'chuo',
  name: 'JR中央線快速',
  color: '#f15a22',
  stops: [
    { at: '東京', toNext: 2 },
    { at: '神田', toNext: 2 },
    { at: '御茶ノ水', toNext: 6 },
    { at: '四ツ谷', toNext: 6 },
    { at: '新宿', toNext: 5 },
    { at: '中野' },
  ],
};
