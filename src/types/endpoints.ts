import { EndpointNames } from "./global";

export interface EndpointSpec {
  name: EndpointNames | string;
  baseUrl: string;
  resource: string;
  needsLatest: boolean;
}
