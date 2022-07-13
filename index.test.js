import { readFileSync, existsSync } from "fs";
import { get } from "axios";
import { getLatestVersion } from "./src/utils/getLatestVersion";
import { matchersWithOptions } from "jest-json-schema";
import schemaItems from "./endpoints/items.schema.json";
import items from "./data/latest/items.json";

expect.extend(matchersWithOptions());

// Test to check that the latest version exists in Blitz API
test("Latest version exists in Blitz API", async () => {
  const latestVersion = await getLatestVersion();
  // Create endpoints array
  let endpoints = [];
  // Read the items.json configuration file
  const itemsConfig = JSON.parse(readFileSync("./endpoints/items.json"));
  // Fetch the items.json from the itemsConfig
  itemsConfig.forEach((endpoint) => {
    const url = `${endpoint.baseUrl}${
      endpoint.needsLatest ? latestVersion : ""
    }${endpoint.resource}`;
    endpoints.push({ name: endpoint.name, url: url });
  });
  // Get endpoint where endpoint.name === "Blitz"
  const blitzEndpoint = endpoints.find((endpoint) => endpoint.name === "Blitz");
  // Fetch item.json from Blitz API
  await get(blitzEndpoint.url)
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
});

// Test to expect a creation of a latest version directory and a items.json file in it
test("Latest items.json file is created in folders", async () => {
  const latestVersion = await getLatestVersion();
  expect(existsSync(`./data/${latestVersion}/items.json`)).toBe(true);
  expect(existsSync(`./data/latest/items.json`)).toBe(true);
});

// Test to validate the final schema of the items.json file
test("Latest items.json file has valid schema", () => {
  expect(items).toMatchSchema(schemaItems);
});

// Test to expect a creation of a latest champions.json file in the latest version directory
test("Latest champions.json file is created in folders", async () => {
  const latestVersion = await getLatestVersion();
  expect(existsSync(`./data/${latestVersion}/champions.json`)).toBe(true);
  expect(existsSync(`./data/latest/champions.json`)).toBe(true);
});
