import axios from "axios";
import _ from "lodash";
import { existsSync, mkdirSync } from "fs";
import { getLatestVersion } from "~/src/utils/getLatestVersion.js";
import { sanitizeText } from "~/src/utils/sanitizeText.js";
import {
  getCommunityDragonItemData,
  getMerakiItemData,
  getBlitzItemData,
  writeItems,
  getLeagueOfLegendsWikiItemData,
} from "~/src/utils/itemUtils.js";
import { defaultValues } from "~/src/utils/constants.js";
import { downloadImage } from "~/src/utils/downloadImages.js";
// Load env variables from .env file
import "dotenv/config";
import { Endpoint, EndpointItemData } from "~/src/types/global.js";
import { Item, ItemObject } from "~/src/types/items.js";
import itemsConfig from "~/endpoints/items.json";
import {
  createDirectory,
  getEndpoints,
  getEndpointUrl,
} from "~/src/utils/endpointUtils.js";

// Main function to merge the items from the different endpoints
const mergeItems = async (
  endpoints: Endpoint[],
  latestVersion: string
): Promise<void> => {
  let fetchedItemData: EndpointItemData[] = [];
  let itemPromises: Promise<void>[] = [];

  // Fetch all the items from the different endpoints
  endpoints.forEach((endpoint) => {
    console.log(`Fetching ${endpoint.name} items...`);
    let promise = axios
      .get(endpoint.url, {
        headers: {
          "Accept-Encoding": "identity",
        },
      })
      .then((response) => {
        console.log(`Fetched ${endpoint.name} items`);
        fetchedItemData.push({ name: endpoint.name, data: response.data });
      });
    itemPromises.push(promise);
  });
  await Promise.all(itemPromises);

  // Merge the items from the different endpoints
  let mergedItems: ItemObject = {};
  fetchedItemData.forEach((endpointData) => {
    switch (endpointData.name) {
      case "Blitz":
        Object.assign(mergedItems, getBlitzItemData(endpointData));
        break;

      case "MerakiAnalytics":
        mergedItems = getMerakiItemData(
          endpointData,
          fetchedItemData,
          mergedItems
        );
        break;

      case "CommunityDragon":
        mergedItems = getCommunityDragonItemData(endpointData, mergedItems);
        break;

      case "LeagueOfLegendsWiki":
        mergedItems = getLeagueOfLegendsWikiItemData(endpointData, mergedItems);
        break;
    }
  });

  // Merge the default values with every item in mergedItems
  mergedItems = _.mapValues(mergedItems, (item) => {
    return _.defaults(item, defaultValues);
  });

  console.log(`Merged ${Object.keys(mergedItems).length} items`);

  let itemIconPromises: Promise<void>[] = [];

  // Download item icons and placeholders
  Object.entries(mergedItems).forEach(([key, item]: [string, Item]) => {
    if (item.description) {
      mergedItems[key].description = sanitizeText(item);
    }
    if (item.icon) {
      let iconName = item.icon.split("/").pop()?.split(".")[0] ?? "";
      if (iconName && iconName.length > 0) {
        let promise = downloadImage(
          `data/img/items/${iconName}.webp`,
          item.icon
        )
          .then((placeholder: string) => {
            mergedItems[key].icon = `data/img/items/${iconName}.webp`;
            mergedItems[key].placeholder = placeholder;
            console.log("Downloaded icon for item " + mergedItems[key].name);
          })
          .catch((error) => {
            console.error(
              "Error downloading icon for item " + mergedItems[key].name
            );
          });
        itemIconPromises.push(promise);
      }
    }
  });

  await Promise.all(itemIconPromises);

  console.info("Writing items data to file...");
  writeItems(latestVersion, mergedItems);
};

// Get the items.json file from the different endpoints specified in items.json
// Return the custom merged items.json file
export const getItems = async () => {
  const latestVersion = await getLatestVersion();
  let endpoints = getEndpoints(itemsConfig, latestVersion);
  console.log("Endpoints: ", endpoints);

  // Create the data directory if it doesn't exist for the current patch
  createDirectory(`data/${latestVersion}`);
  createDirectory("data/latest");
  await mergeItems(endpoints, latestVersion);
};

// const test = async () => {
//   try {
//     await getItems();
//     console.log("Successfully merged items.json");
//   } catch (error: any) {
//     console.error("Error: " + error.message);
//   }
// };

// // Only run test if running locally
// if (!process.env.GITHUB_ACTIONS || process.env.GITHUB_ACTIONS === "false") {
//   test();
// }
