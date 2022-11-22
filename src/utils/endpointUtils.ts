import { EndpointSpec } from "../types/endpoints";
import { Endpoint } from "../types/global";
import { readFileSync } from "fs";
export const getEndpointUrl = (endpoint: EndpointSpec, version: string) => {
  return `${endpoint.baseUrl}${endpoint.needsLatest ? version : ""}${
    endpoint.resource
  }`;
};

export const getEndpoints = (
  endpoints: EndpointSpec[],
  version: string
): Endpoint[] => {
  return endpoints.map((endpoint) => ({
    name: endpoint.name,
    url: getEndpointUrl(endpoint, version),
  }));
};

export const readJsonFile = (path: string) => {
  return JSON.parse(readFileSync(path, "utf8"));
};
