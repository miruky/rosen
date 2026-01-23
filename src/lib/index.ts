import { buildNetwork } from './network';
import { tokyoLines, tokyoStations, tokyoWalks } from './data';
import type { Network } from './types';

export type { LabelDir, LineDef, LineStop, Network, Station, StationDef, WalkLink } from './types';
export { buildNetwork, isInterchange, lineById } from './network';
export { findRoute } from './route';
export type {
  Leg,
  RideLeg,
  RouteOptions,
  RoutePreference,
  RouteResult,
  TransferLeg,
  WalkLeg,
} from './route';
export { matchStations, normalizeQuery, resolveStation } from './search';
export { addRecent, parseRecent, RECENT_LIMIT } from './recent';
export type { RecentEntry } from './recent';
export { describeLeg, formatMinutes, summarizeRoute } from './format';
export { escapeXml, mapViewBox, renderMap, renderRouteOverlay } from './render';
export type { ViewBox } from './render';
export { tokyoLines, tokyoStations, tokyoWalks } from './data';

/** 同梱の東京6路線データからネットワークを組む */
export function tokyoNetwork(): Network {
  return buildNetwork(tokyoStations, tokyoLines, tokyoWalks);
}
