const fs = require("fs");
const axios = require("axios");
const getLatestVersion = require("./index");

// Test to check that the latest version exists in Blitz API
test("Latest version exists in Blitz API", async () => {
  const latestVersion = await getLatestVersion();
  // Create endpoints array
  let endpoints = [];
  // Read the items.json configuration file
  const itemsConfig = JSON.parse(fs.readFileSync("./endpoints/items.json"));
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
  const itemEndpoints = await axios
    .get(blitzEndpoint.url)
    // Check that the response is 200
    .then((response) => {
      expect(response.status).toBe(200);
      return response.data;
    })
    // Check that the response has a key "version"
    .then((data) => {
      expect(data).toHaveProperty("version", latestVersion);
      return data;
    });
});

// Test to expect a creation of a latest version directory and a items.json file in it
test("Verifying items.json file creation", async () => {
  const latestVersion = await getLatestVersion();
  expect(fs.existsSync(`./data/${latestVersion}/items.json`)).toBe(true);
  expect(fs.existsSync(`./data/latest/items.json`)).toBe(true);
});
