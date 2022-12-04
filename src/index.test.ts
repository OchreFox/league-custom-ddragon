import axios from "axios";
import { existsSync } from "fs";
import { expect, test } from "@jest/globals";
import { matchers } from "jest-json-schema";

import { getLatestVersion } from "./utils/getLatestVersion";
import { EndpointNames, Endpoint } from "./types/global";
import { getEndpoints, readJsonFile } from "./utils/endpointUtils";
import { ItemObject } from "./types/items";

expect.extend(matchers);
// Test to check that the latest version exists in Blitz API
test("Latest version exists in Blitz API", async () => {
  const latestVersion = await getLatestVersion();
  const itemsEndpoints = readJsonFile("endpoints/items.json");
  let endpoints: Endpoint[] = getEndpoints(itemsEndpoints, latestVersion);

  // Get Blitz endpoint
  const blitzEndpoint = endpoints.find(
    (endpoint) => endpoint.name === EndpointNames.Blitz
  );
  if (blitzEndpoint) {
    await axios
      .get(blitzEndpoint.url, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "Accept-Encoding": "identity",
        },
      })
      .then((response) => {
        expect(response.status).toBe(200);
        return response.data;
      })
      // Check that the response has a key "version"
      .then((data) => {
        expect(data).toHaveProperty("version", latestVersion);
        return data;
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

// Test to expect a creation of a latest version directory and a items.json file in it
test("Latest items.json file is created in folders", async () => {
  const latestVersion = await getLatestVersion();
  expect(existsSync(`./data/${latestVersion}/items.json`)).toBe(true);
  expect(existsSync(`./data/latest/items.json`)).toBe(true);
});

// Test to validate the items.json file schema
test("Latest items.json file has valid schema", () => {
  const items: ItemObject = readJsonFile("data/latest/items.json");
  const itemsSchema = readJsonFile("schemas/items.json");
  // @ts-ignore
  expect(items).toMatchSchema(itemsSchema);
});

// Test to expect a creation of a latest champions.json file in the latest version directory
test("Latest champions.json file is created in folders", async () => {
  const latestVersion = await getLatestVersion();
  expect(existsSync(`./data/${latestVersion}/champions.json`)).toBe(true);
  expect(existsSync(`./data/latest/champions.json`)).toBe(true);
});

// Test to validate that there are any classes in the latest items.json file (there should be at least one item with a class)
test("Latest items.json file has at least one class", () => {
  const items: ItemObject = readJsonFile("data/latest/items.json");
  const itemsWithClass = Object.values(items).filter(
    (item) => item.classes.length > 0
  );
  expect(itemsWithClass.length).toBeGreaterThan(0);
});
