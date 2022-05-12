const axios = require("axios");
const path = require("path");
const core = require("@actions/core");
const github = require("@actions/github");
var _ = require("lodash");
const fs = require("fs");
const { getLatestVersion } = require("./getLatestVersion");

const mergeItems = async (endpoints, latestVersion) => {
  // Create a new array to store the items.json files
  let itemEndpoints = [];
  let itemPromises = [];
  endpoints.forEach((endpoint) => {
    let promise = axios.get(endpoint.url).then((response) => {
      itemEndpoints.push({ name: endpoint.name, data: response.data });
    });
    itemPromises.push(promise);
  });
  await Promise.all(itemPromises);

  const requiredKeysMeraki = [
    "icon",
    "iconOverlay",
    "nicknames",
    "requiredChampion",
    "simpleDescription",
  ];
  const admittedClasses = [
    "MAGE",
    "SUPPORT",
    "TANK",
    "FIGHTER",
    "MARKSMAN",
    "ASSASSIN",
  ];

  let mergedItems = {};
  itemEndpoints.forEach((endpoint) => {
    switch (endpoint.name) {
      case "Blitz":
        let data = endpoint.data.data;
        // Parse numbers
        Object.entries(data).forEach((entry) => {
          const [key, value] = entry;
          Object.entries(value).forEach((item) => {
            const [key2, value2] = item;
            if (key2 === "id") {
              data[key][key2] = parseInt(value2);
            } else if (
              (key2 === "maps" || key2 === "from" || key2 === "into") &&
              value2 !== null
            ) {
              data[key][key2] = value2.map(Number);
            } else if (key2 === "depth") {
              // Rename key2 from depth to tier
              data[key]["tier"] = value2;
              delete data[key]["depth"];
            }
          });
        });

        Object.assign(mergedItems, data);
        break;
      case "MerakiAnalytics":
        Object.entries(endpoint.data).forEach((item) => {
          const key = item[0];
          const values = item[1];
          let filteredItem = _.pick(values, requiredKeysMeraki);

          // Get an array of classes from nested object property
          let classes = _.get(values, "shop.tags");
          if (classes.length > 0) {
            classes = _.filter(classes, (className) =>
              admittedClasses.includes(className)
            );
          }
          // Append the filteredItem and the classes to the mergedItems in the corresponding key
          mergedItems[key] = {
            ...mergedItems[key],
            ...filteredItem,
            classes: classes,
          };
        });
        break;
      case "CommunityDragon":
        let requiredKeysCD = ["categories", "inStore", "maxStacks"];
        endpoint.data.forEach((item) => {
          const key = item.id;
          let filteredItem = _.pick(item, requiredKeysCD);
          // Append the filteredItem to the mergedItems in the corresponding key
          mergedItems[key] = { ...mergedItems[key], ...filteredItem };
        });
        break;
    }
  });

  // Validate keys from mergedItems
  const requiredKeys = [
    "categories",
    "classes",
    "description",
    "from",
    "gold",
    "icon",
    "iconOverlay",
    "id",
    "inStore",
    "into",
    "maps",
    "maxStacks",
    "mythic",
    "name",
    "nicknames",
    "requiredChampion",
    "simpleDescription",
    "stats",
    "tier",
  ];
  var defaultValues = _(requiredKeys)
    .mapKeys()
    .mapValues(() => null)
    .value();
  // Merge the default values with every item in mergedItems
  mergedItems = _.mapValues(mergedItems, (item) => {
    return _.defaults(item, defaultValues);
  });

  // Write the merged items.json file in the latestVersion folder "./data/" + latestVersion + "/items.json";
  let rootPath = "data/";
  let latestVersionPath = path.join(rootPath, latestVersion, "/items.json");
  // Sanitize path to avoid directory traversal
  latestVersionPath = path.normalize(latestVersionPath);
  // deepcode ignore PT: Wont fix this right away
  fs.writeFileSync(latestVersionPath, JSON.stringify(mergedItems));
  // Also save a copy in the latest folder
  fs.writeFileSync(`data/latest/items.json`, JSON.stringify(mergedItems));
};

// Get the items.json file from the different endpoints specified in items.json
// Return the custom merged items.json file
const getItems = async () => {
  // Read the items.json configuration file
  const itemsConfig = JSON.parse(fs.readFileSync("endpoints/items.json"));
  // Fetch the latest version of DDragon
  const latestVersion = await getLatestVersion();
  let endpoints = [];
  // Fetch the items.json from the itemsConfig
  itemsConfig.forEach((endpoint) => {
    console.log("Fetching items.json from " + endpoint.name);
    const url = `${endpoint.baseUrl}${
      endpoint.needsLatest ? latestVersion : ""
    }${endpoint.resource}`;
    endpoints.push({ name: endpoint.name, url: url });
    console.log(endpoint.name + " items URL: " + url);
  });
  // Create a folder in /data if it doesn't exist for the latest version
  if (!fs.existsSync(`data/${latestVersion}`)) {
    fs.mkdirSync(`data/${latestVersion}`);
  }
  // Create the folder latest in /data if it doesn't exist
  if (!fs.existsSync(`data/latest`)) {
    fs.mkdirSync(`data/latest`);
  }
  await mergeItems(endpoints, latestVersion);
};

const main = async () => {
  try {
    await getItems();
    core.info("Successfully merged items.json");
  } catch (error) {
    core.setFailed(error.message);
  }
};

exports.getItems = getItems;
