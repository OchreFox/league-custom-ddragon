import axios from "axios";
import _ from "lodash";
import { getLatestVersion } from "~/src/utils/getLatestVersion.js";
import { sanitizeText, toPascalCase } from "~/src/utils/sanitizeText.js";
import {
  getCommunityDragonItemData,
  getMerakiItemData,
  writeItems,
} from "~/src/utils/itemUtils.js";
import { defaultValues } from "~/src/utils/constants.js";
import { downloadImage } from "~/src/utils/downloadImages.js";
// Load env variables from .env file
import "dotenv/config";
import { Endpoint, EndpointItemData } from "~/src/types/global.js";
import { Item, ItemObject } from "~/src/types/items.js";
import itemsConfig from "~/endpoints/items.json";
import { createDirectory, getEndpoints } from "~/src/utils/endpointUtils.js";
import { extractTags } from "../utils/extractTags";

const axiosOptions = {
  headers: {
    "Accept-Encoding": "identity",
  },
};

const fetchItems = async (endpoint: Endpoint): Promise<EndpointItemData> => {
  console.log(`Fetching ${endpoint.name} items...`);
  try {
    const response = await axios.get(endpoint.url, axiosOptions);
    console.log(`Fetched ${endpoint.name} items`);
    return { name: endpoint.name, data: response.data };
  } catch (error) {
    throw new Error(`Error fetching ${endpoint.name} items: ${error}`);
  }
};

// Main function to merge the items from the different endpoints
const mergeItems = async (
  endpoints: Endpoint[],
  latestVersion: string
): Promise<void> => {
  let fetchedItemData: EndpointItemData[] = [];
  let itemPromises: Promise<void>[] = [];

  // Fetch all the items from the different endpoints
  endpoints.forEach((endpoint) => {
    let promise = fetchItems(endpoint)
      .then((data) => {
        fetchedItemData.push(data);
      })
      .catch((error) => {
        console.error(error);
      });
    itemPromises.push(promise);
  });

  await Promise.all(itemPromises);

  // Merge the items from the different endpoints
  let mergedItems: ItemObject = {};
  let cdItems;
  let allowedTags: string[] = [];

  fetchedItemData.forEach((endpointData) => {
    switch (endpointData.name) {
      case "CommunityDragon":
        cdItems = getCommunityDragonItemData(endpointData);
        allowedTags = extractTags(cdItems);
        Object.assign(mergedItems, cdItems);
        break;

      case "MerakiAnalytics":
        mergedItems = getMerakiItemData(endpointData, mergedItems);
        break;
    }
  });

  // Merge the default values with every item in mergedItems
  mergedItems = _.mapValues(mergedItems, (item) => {
    return _.defaults(item, defaultValues);
  });
  console.log(`Merged ${Object.keys(mergedItems).length} items`);

  // Create a separate list of tags converted to PascalCase
  const pascalCaseTags = allowedTags.map((tag) => toPascalCase(tag));

  // Download item icons and placeholders
  let itemIconPromises: Promise<void>[] = [];
  Object.entries(mergedItems).forEach(([key, item]: [string, Item]) => {
    if (item.description) {
      mergedItems[key].description = sanitizeText(
        item,
        allowedTags,
        pascalCaseTags
      );
    }
    let iconName = item.icon.split("/").pop()?.split(".")[0] ?? "";
    if (iconName && iconName.length > 0) {
      let promise = downloadImage(`data/img/items/${iconName}.webp`, item.icon)
        .then((placeholder: string) => {
          mergedItems[key].icon = `data/img/items/${iconName}.webp`;
          mergedItems[key].placeholder = placeholder;
          console.log("Downloaded icon for item " + mergedItems[key].name);
        })
        .catch((error) => {
          console.error(
            `Error downloading icon for item ${item.name}: ${error}`
          );
        });
      itemIconPromises.push(promise);
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
