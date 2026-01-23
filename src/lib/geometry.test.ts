import { describe, expect, it } from 'vitest';
import { tokyoNetwork } from './index';

// スキーマティック座標の品質をテストで担保する。
// 手置きの座標は編集でいつでも壊れうるため、駅どうし・駅と他路線の
// 最小間隔を機械的に検査し、図として破綻した配置の混入を防ぐ。

const net = tokyoNetwork();
const stations = [...net.stations.values()];

function segmentDistance(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSq = dx * dx + dy * dy;
  const t = lengthSq === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / lengthSq;
  const clamped = Math.max(0, Math.min(1, t));
  const cx = ax + clamped * dx;
  const cy = ay + clamped * dy;
  return Math.hypot(px - cx, py - cy);
}

describe('路線図の幾何', () => {
  it('駅どうしは16px以上離れている', () => {
    for (let i = 0; i < stations.length; i++) {
      for (let j = i + 1; j < stations.length; j++) {
        const a = stations[i]!;
        const b = stations[j]!;
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        expect(d, `${a.name} と ${b.name} が近すぎる (${d.toFixed(1)}px)`).toBeGreaterThanOrEqual(
          16,
        );
      }
    }
  });

  it('駅は自分が属さない路線の線分から8px以上離れている', () => {
    for (const line of net.lines) {
      const n = line.stops.length;
      const segmentCount = line.loop ? n : n - 1;
      for (let i = 0; i < segmentCount; i++) {
        const a = net.stations.get(line.stops[i]!.at)!;
        const b = net.stations.get(line.stops[(i + 1) % n]!.at)!;
        for (const s of stations) {
          if (s.lines.includes(line.id)) continue;
          const d = segmentDistance(s.x, s.y, a.x, a.y, b.x, b.y);
          expect(
            d,
            `${s.name} が ${line.name} の ${a.name}-${b.name} に近すぎる (${d.toFixed(1)}px)`,
          ).toBeGreaterThanOrEqual(8);
        }
      }
    }
  });

  it('隣接駅の線分が長すぎない(図の間延び防止)', () => {
    for (const line of net.lines) {
      const n = line.stops.length;
      const segmentCount = line.loop ? n : n - 1;
      for (let i = 0; i < segmentCount; i++) {
        const a = net.stations.get(line.stops[i]!.at)!;
        const b = net.stations.get(line.stops[(i + 1) % n]!.at)!;
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        // 中央線快速は通過駅をまたぐため最長230pxまで許す
        expect(d, `${line.id} ${a.name}-${b.name}`).toBeLessThanOrEqual(230);
      }
    }
  });

  it('徒歩連絡の両駅は徒歩らしい距離(60px以内)にある', () => {
    for (const walk of net.walks) {
      const a = net.stations.get(walk.between[0])!;
      const b = net.stations.get(walk.between[1])!;
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      expect(d, walk.between.join('-')).toBeLessThanOrEqual(60);
    }
  });
});
