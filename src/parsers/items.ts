import axios from "axios";
import _ from "lodash";
import { existsSync, mkdirSync } from "fs";
import { getLatestVersion } from "~/src/utils/getLatestVersion";
import { sanitizeText } from "~/src/utils/sanitizeText";
import {
  getCommunityDragonItemData,
  getMerakiItemData,
  getBlitzItemData,
  writeItems,
} from "~/src/utils/itemUtils";
import { defaultValues } from "~/src/utils/constants";
import { downloadImage } from "~/src/utils/downloadImages";
// Load env variables from .env file
import "dotenv/config";
import { Endpoint, EndpointItemData } from "~/src/types/global";
import { ItemObject } from "~/src/types/items";
import itemsConfig from "~/endpoints/items.json";
import { getEndpoints, getEndpointUrl } from "../utils/endpointUtils";

const mergeItems = async (
  endpoints: Endpoint[],
  latestVersion: string
): Promise<void> => {
  let itemEndpointsData: EndpointItemData[] = [];
  let itemPromises: Promise<void>[] = [];

  endpoints.forEach((endpoint) => {
    let promise = axios.get(endpoint.url).then((response) => {
      itemEndpointsData.push({ name: endpoint.name, data: response.data });
    });
    itemPromises.push(promise);
  });
  await Promise.all(itemPromises);

  let mergedItems: ItemObject = {};
  itemEndpointsData.forEach((endpointData) => {
    switch (endpointData.name) {
      case "Blitz":
        Object.assign(mergedItems, getBlitzItemData(endpointData));
        break;

      case "MerakiAnalytics":
        mergedItems = getMerakiItemData(
          endpointData,
          itemEndpointsData,
          mergedItems
        );
        break;

      case "CommunityDragon":
        mergedItems = getCommunityDragonItemData(endpointData, mergedItems);
        break;
    }
  });

  // Merge the default values with every item in mergedItems
  mergedItems = _.mapValues(mergedItems, (item) => {
    return _.defaults(item, defaultValues);
  });

  console.log(`Merged ${Object.keys(mergedItems).length} items`);

  // Sanitize item description for each item in mergedItems
  Object.entries(mergedItems).forEach(async ([key, item]) => {
    if (item.description) {
      mergedItems[key].description = sanitizeText(item);
    }
    if (item.icon) {
      let iconName = item.icon.split("/").pop()?.split(".")[0] || "";
      if (iconName && iconName.length > 0) {
        let base64 = await downloadImage(
          `data/img/items/${iconName}.webp`,
          item.icon
        );
        mergedItems[key].placeholder = base64;
        mergedItems[key].icon = `data/img/items/${iconName}.webp`;
      }
    }
  });

  console.info("Writing items data to file...");
  writeItems(latestVersion, mergedItems);
};

// Get the items.json file from the different endpoints specified in items.json
// Return the custom merged items.json file
export const getItems = async () => {
  const latestVersion = await getLatestVersion();
  let endpoints = getEndpoints(itemsConfig, latestVersion);
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

// const main = async () => {
//   try {
//     await getItems();
//     info("Successfully merged items.json");
//   } catch (error) {
//     setFailed(error.message);
//     console.log("Error: " + error.message);
//   }
// };

// // Only run main if running locally
// if (process.env.GITHUB_ACTIONS !== "true") {
//   main();
// }
