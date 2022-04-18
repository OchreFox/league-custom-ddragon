const axios = require("axios");
const core = require("@actions/core");
const github = require("@actions/github");
var _ = require("lodash");
const fs = require("fs");

// Function to get the latest version of DDragon from https://ddragon.leagueoflegends.com/api/versions.json
// Get the first element from the array of the versions.json file
// Return the latest version number
const getLatestVersion = async () => {
  const response = await axios.get(
    "https://ddragon.leagueoflegends.com/api/versions.json"
  );
  return response.data[0];
};

// Function to merge json data into a single one
// Accepts an array of endpoint strings to fetch the items.json files
// Returns a merged items.json file
const mergeItems = async (endpoints, latestVersion) => {
  // Create a new array to store the items.json files
  let itemEndpoints = [];
  itemPromises = [];
  endpoints.forEach((endpoint) => {
    let promise = axios.get(endpoint.url).then((response) => {
      itemEndpoints.push({ name: endpoint.name, data: response.data });
    });
    itemPromises.push(promise);
  });
  // Wait for all the items.json files to be fetched
  await Promise.all(itemPromises);
  // Merge the items.json files into a single one
  let mergedItems = {};
  itemEndpoints.forEach((endpoint) => {
    // Switch for each name
    switch (endpoint.name) {
      case "Blitz":
        // Copy the data into the merged items
        Object.assign(mergedItems, endpoint.data.data);
        break;
      case "MerakiAnalytics":
        // Only copy the tier, nicknames, icon, requiredChampion, and iconOverlay from the original item to a new object
        const requiredKeysMeraki = [
          "tier",
          "nicknames",
          "icon",
          "requiredChampion",
          "iconOverlay",
        ];
        Object.entries(endpoint.data).map((item) => {
          const key = item[0];
          const values = item[1];
          let filteredItem = _.pick(values, requiredKeysMeraki);
          // Append the filteredItem to the mergedItems in the corresponding key
          mergedItems[key] = { ...mergedItems[key], ...filteredItem };
        });
        break;
      case "CommunityDragon":
        // The required keys are: categories, inStore
        let requiredKeysCD = ["categories", "inStore"];
        endpoint.data.map((item) => {
          const key = item.id;
          let filteredItem = _.pick(item, requiredKeysCD);
          // Append the filteredItem to the mergedItems in the corresponding key
          mergedItems[key] = { ...mergedItems[key], ...filteredItem };
        });
        break;
    }
  });

  // Write the merged items.json file in the latestVersion folder
  fs.writeFileSync(
    `./data/${latestVersion}/items.json`,
    JSON.stringify(mergedItems)
  );
  // Also save a copy in the latest folder
  fs.writeFileSync(`./data/latest/items.json`, JSON.stringify(mergedItems));
};

// Get the items.json file from the different endpoints specified in items.json
// Return the custom merged items.json file
const getItems = async () => {
  // Read the items.json configuration file
  const itemsConfig = JSON.parse(fs.readFileSync("./endpoints/items.json"));
  // Fetch the latest version of DDragon
  const latestVersion = await getLatestVersion();
  let endpoints = [];
  // Fetch the items.json from the itemsConfig
  itemsConfig.forEach((endpoint) => {
    console.log(endpoint.name);
    const url = `${endpoint.baseUrl}${
      endpoint.needsLatest ? latestVersion : ""
    }${endpoint.resource}`;
    endpoints.push({ name: endpoint.name, url: url });
    console.log(url);
  });
  // Create a folder in /data if it doesn't exist for the latest version
  if (!fs.existsSync(`./data/${latestVersion}`)) {
    fs.mkdirSync(`./data/${latestVersion}`);
  }
  // Create the folder latest in /data if it doesn't exist
  if (!fs.existsSync(`./data/latest`)) {
    fs.mkdirSync(`./data/latest`);
  }
  await mergeItems(endpoints, latestVersion);
};

const main = async () => {
  try {
    await getItems();
    core.info("Successfully fetched items.json");
  } catch (error) {
    core.setFailed(error.message);
  }
};

main();

module.exports = getLatestVersion;
