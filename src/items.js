import axios from "axios";
import { info, setFailed } from "@actions/core";
import _ from "lodash";
import { readFileSync, existsSync, mkdirSync } from "fs";
import { getLatestVersion } from "./utils/getLatestVersion.js";
import { sanitizeText } from "./utils/sanitizeText.js";
import {
  getCommunityDragonData,
  getMerakiData,
  getBlitzData,
  writeItems,
} from "./utils/itemUtils.js";
import {
  requiredKeysMeraki,
  admittedClasses,
  defaultValues,
} from "./utils/constants.js";
import downloadImage from "./utils/downloadImages.js";
// Load env variables from .env file
import "dotenv/config";

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

  let mergedItems = {};
  itemEndpoints.forEach((endpoint) => {
    switch (endpoint.name) {
      case "Blitz":
        Object.assign(mergedItems, getBlitzData(endpoint));
        break;

      case "MerakiAnalytics":
        Object.entries(endpoint.data).forEach((item) => {
          const key = item[0];
          const values = item[1];

          let { filteredItem, classes } = getMerakiData(
            values,
            requiredKeysMeraki,
            admittedClasses,
            itemEndpoints
          );

          // Append the filteredItem and the classes to the mergedItems in the corresponding key
          mergedItems[key] = {
            ...mergedItems[key],
            ...filteredItem,
            classes: classes,
          };
        });
        break;

      case "CommunityDragon":
        getCommunityDragonData(endpoint, mergedItems);
        break;
    }
  });

  // Merge the default values with every item in mergedItems
  mergedItems = _.mapValues(mergedItems, (item) => {
    return _.defaults(item, defaultValues);
  });

  console.log(`Merged ${Object.keys(mergedItems).length} items`);

  // Sanitize item description for each item in mergedItems
  Object.entries(mergedItems).forEach(([key, value]) => {
    let description = value.description;
    if (description) {
      description = sanitizeText(value);
      mergedItems[key].description = description;
    }
    if (value.icon) {
      let iconName = value.icon.split("/").pop().split(".")[0];
      downloadImage(`data/img/items/${iconName}.webp`, value.icon);
    }
  });

  writeItems(latestVersion, mergedItems);
};

// Get the items.json file from the different endpoints specified in items.json
// Return the custom merged items.json file
export const getItems = async () => {
  // Read the items.json configuration file
  const itemsConfig = JSON.parse(readFileSync("endpoints/items.json"));
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
  if (!existsSync(`data/${latestVersion}`)) {
    mkdirSync(`data/${latestVersion}`);
  }
  // Create the folder latest in /data if it doesn't exist
  if (!existsSync(`data/latest`)) {
    mkdirSync(`data/latest`);
  }
  await mergeItems(endpoints, latestVersion);
};

const main = async () => {
  try {
    await getItems();
    info("Successfully merged items.json");
  } catch (error) {
    setFailed(error.message);
    console.log("Error: " + error.message);
  }
};

// Only run main if running locally
if (process.env.GITHUB_ACTIONS !== "true") {
  main();
}
