import { EndpointSpec } from "../types/endpoints.js";
import { Endpoint } from "../types/global.js";
import { readFileSync } from "fs";
export const getEndpointUrl = (endpoint: EndpointSpec, version: string) => {
  if (!version) {
    throw new Error("Version is undefined");
  }
  return `${endpoint.baseUrl}${endpoint.needsLatest ? version : ""}${
    endpoint.resource
  }`;
};

export const getEndpoints = (
  endpoints: EndpointSpec[],
  version: string
): Endpoint[] => {
  if (!version) {
    throw new Error("Version is undefined");
  }
  return endpoints.map((endpoint) => ({
    name: endpoint.name,
    url: getEndpointUrl(endpoint, version),
  }));
};

export const readJsonFile = (path: string) => {
  return JSON.parse(readFileSync(path, "utf8"));
};
