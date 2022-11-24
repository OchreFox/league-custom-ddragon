import { EndpointNames } from "./global.js";

export interface EndpointSpec {
  name: EndpointNames | string;
  baseUrl: string;
  resource: string;
  needsLatest: boolean;
}
