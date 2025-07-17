import type { LineDef, WalkLink } from '../types';
import { yamanote } from './yamanote';
import { chuo } from './chuo';
import { ginza } from './ginza';
import { marunouchi } from './marunouchi';
import { hibiya } from './hibiya';
import { tozai } from './tozai';

export { tokyoStations } from './stations';

/** 凡例・描画は配列順。JRを下層、メトロを上層に重ねる */
export const tokyoLines: LineDef[] = [yamanote, chuo, ginza, marunouchi, hibiya, tozai];

/** 改札を出て連絡する別名駅どうしの徒歩乗換 */
export const tokyoWalks: WalkLink[] = [
  { between: ['御徒町', '上野広小路'], minutes: 3 },
  { between: ['御徒町', '仲御徒町'], minutes: 3 },
  { between: ['上野広小路', '仲御徒町'], minutes: 4 },
  { between: ['有楽町', '日比谷'], minutes: 4 },
  { between: ['溜池山王', '国会議事堂前'], minutes: 3 },
  { between: ['虎ノ門', '虎ノ門ヒルズ'], minutes: 4 },
  { between: ['東京', '大手町'], minutes: 6 },
];
