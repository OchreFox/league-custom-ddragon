import { MerakiChampionObject } from "./champions";
import { BlitzRoot, CommunityDragonItem, MerakiItemObject } from "./items";

export enum EndpointNames {
  Blitz = "Blitz",
  CommunityDragon = "CommunityDragon",
  MerakiAnalytics = "MerakiAnalytics",
}

export interface Endpoint {
  name: EndpointNames | string;
  url: string;
}

export interface EndpointItemData {
  name: EndpointNames | string;
  data: BlitzRoot | MerakiItemObject | CommunityDragonItem[];
}

export interface EndpointChampionData {
  name: EndpointNames | string;
  data: MerakiChampionObject;
}
