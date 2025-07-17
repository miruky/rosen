import { describe, expect, it } from 'vitest';
import { renderMap, renderRouteOverlay, escapeXml } from './render';
import { findRoute } from './route';
import { tokyoNetwork, tokyoWalks } from './index';

const net = tokyoNetwork();
const svg = renderMap(net);

describe('renderMap', () => {
  it('スケーラブルなSVG(viewBox指定・幅高さ非固定)を返す', () => {
    expect(svg).toMatch(/^<svg [^>]*viewBox="/);
    expect(svg).not.toMatch(/<svg [^>]*width=/);
    expect(svg).toContain('role="img"');
    expect(svg).toContain('aria-label=');
  });

  it('路線ごとに1本のpathを描く', () => {
    const paths = svg.match(/class="rosen-line"/g) ?? [];
    expect(paths).toHaveLength(6);
    for (const line of net.lines) {
      expect(svg).toContain(`data-line="${line.id}"`);
      expect(svg).toContain(`stroke="${line.color}"`);
    }
  });

  it('環状の山手線は閉じたパスになる', () => {
    const yamanote = svg.match(/<path[^>]*data-line="yamanote"[^>]*d="([^"]+)"/);
    expect(yamanote?.[1]).toMatch(/Z$/);
  });

  it('全駅の丸とラベルを描く', () => {
    expect(svg.match(/class="rosen-station"/g)).toHaveLength(101);
    expect(svg.match(/class="rosen-label"/g)).toHaveLength(101);
  });

  it('乗換駅は強調表示になる', () => {
    const hub = svg.match(
      /<g class="rosen-station" data-station="銀座"[^>]*>.*?<circle class="([^"]+)"/,
    );
    expect(hub?.[1]).toContain('rosen-dot-hub');
  });

  it('駅にtitleとaria-labelが付く', () => {
    expect(svg).toContain(
      '<title>東京(とうきょう) JR山手線・JR中央線快速・東京メトロ丸ノ内線</title>',
    );
    const tokyo = svg.match(
      /<g class="rosen-station" data-station="東京" [^>]*aria-label="([^"]+)"/,
    );
    expect(tokyo?.[1]).toContain('JR山手線');
  });

  it('徒歩連絡を破線で描く', () => {
    expect(svg.match(/class="rosen-walk"/g)).toHaveLength(tokyoWalks.length);
  });

  it('経路ハイライト用の空グループを持つ', () => {
    expect(svg).toContain('id="route-overlay"');
  });
});

describe('renderRouteOverlay', () => {
  it('乗車区間を路線色のpolylineで重ねる', () => {
    const route = findRoute(net, '東京', '新宿')!;
    const overlay = renderRouteOverlay(net, route);
    expect(overlay.match(/class="rosen-route-leg"/g)).toHaveLength(1);
    expect(overlay).toContain('stroke="#f15a22"');
    expect(overlay.match(/class="rosen-route-end"/g)).toHaveLength(2);
  });

  it('徒歩連絡の区間も含める', () => {
    const route = findRoute(net, '有楽町', '六本木')!;
    const overlay = renderRouteOverlay(net, route);
    expect(overlay.match(/class="rosen-route-walk"/g)).toHaveLength(1);
  });
});

describe('escapeXml', () => {
  it('XML特殊文字を実体参照にする', () => {
    expect(escapeXml('<a href="x">&')).toBe('&lt;a href=&quot;x&quot;&gt;&amp;');
  });
});
