import { describe, expect, it } from 'vitest';
import { describeLeg, formatMinutes, summarizeRoute } from './format';
import { findRoute } from './route';
import { tokyoNetwork } from './index';

const net = tokyoNetwork();

describe('formatMinutes', () => {
  it('60分未満は分のみ', () => {
    expect(formatMinutes(8)).toBe('8分');
    expect(formatMinutes(59)).toBe('59分');
  });

  it('ちょうどの時間は分を省く', () => {
    expect(formatMinutes(60)).toBe('1時間');
    expect(formatMinutes(120)).toBe('2時間');
  });

  it('時間と分を併記する', () => {
    expect(formatMinutes(75)).toBe('1時間15分');
  });
});

describe('summarizeRoute / describeLeg', () => {
  it('直通経路のサマリ', () => {
    const route = findRoute(net, '東京', '新宿')!;
    expect(summarizeRoute(route)).toBe('乗換0回・16分');
    expect(describeLeg(route.legs[0]!)).toBe('JR中央線快速 東京から新宿まで4駅・16分');
  });

  it('徒歩連絡のあるサマリ', () => {
    const route = findRoute(net, '有楽町', '六本木')!;
    expect(summarizeRoute(route)).toBe('乗換1回・11分');
    expect(describeLeg(route.legs[0]!)).toBe('有楽町から日比谷へ徒歩連絡・4分');
  });

  it('乗換の説明文', () => {
    const route = findRoute(net, '池袋', '西船橋')!;
    const transfer = route.legs.find((l) => l.kind === 'transfer');
    expect(transfer).toBeDefined();
    expect(describeLeg(transfer!)).toMatch(/で.+へ乗換・\d+分/);
  });
});
