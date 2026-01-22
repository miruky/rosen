/** 路線図上のラベル描画方位。スキーマティック座標系で駅名の置き場所を示す。 */
export type LabelDir = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

/** 駅レジストリの1件。座標はスキーマティック(地理座標ではない)。 */
export interface StationDef {
  name: string;
  /** 読み(ひらがな)。駅名検索に使う */
  kana: string;
  x: number;
  y: number;
  /** 駅名ラベルの方位。省略時は 'e'(右) */
  label?: LabelDir;
}

/** 路線上の停車駅。toNext は次駅までの所要分(終点のみ省略可) */
export interface LineStop {
  at: string;
  toNext?: number;
}

export interface LineDef {
  id: string;
  name: string;
  /** 路線記号などに使う公式系統色 */
  color: string;
  /** 環状線。最終駅の toNext が先頭駅へ戻る */
  loop?: boolean;
  stops: LineStop[];
}

/** 別駅名どうしの徒歩連絡(改札外乗換) */
export interface WalkLink {
  between: [string, string];
  minutes: number;
}

/** レジストリと路線定義を突き合わせて構築した探索・描画用ネットワーク */
export interface Station extends StationDef {
  /** この駅に乗り入れる路線id(定義順) */
  lines: string[];
}

export interface Network {
  stations: Map<string, Station>;
  lines: LineDef[];
  walks: WalkLink[];
  /** 同一駅での乗換に要する分数 */
  transferMinutes: number;
}
