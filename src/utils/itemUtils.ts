import path from "path";
import fs from "fs";
import _ from "lodash";
import { EndpointItemData, EndpointNames } from "~/src/types/global.js";
import {
  BlitzRoot,
  ChampionClass,
  CommunityDragonItem,
  MerakiItem,
  MerakiItemObject,
  MerakiStats,
} from "~/src/types/items.js";
import camelcaseKeys from "camelcase-keys";

// Function to convert a string from snake case to camel case
export function snakeToCamel(str: string) {
  return str.replace(/(_\w)/g, (m) => m[1].toUpperCase());
}

export function writeItems(latestVersion: string, mergedItems: {}) {
  // Write the merged items.json file in the latestVersion folder "./data/" + latestVersion + "/items.json";
  let rootPath = "data/";
  let latestVersionPath = path.join(rootPath, latestVersion, "/items.json");
  latestVersionPath = path.normalize(latestVersionPath);
  fs.writeFileSync(latestVersionPath, JSON.stringify(mergedItems));
  // Also save a copy in the latest folder
  fs.writeFileSync(`data/latest/items.json`, JSON.stringify(mergedItems));
}

export function getCommunityDragonItemData(
  endpointData: EndpointItemData,
  mergedItems: { [x: string]: any }
) {
  let { data } = endpointData as { data: CommunityDragonItem[] };
  const requiredKeysCD: (keyof CommunityDragonItem)[] = [
    "categories",
    "inStore",
    "maxStacks",
  ];
  data.forEach((item) => {
    const key = item.id;
    let filteredItem = _.pick(item, requiredKeysCD);
    // Append the filteredItem to the mergedItems in the corresponding key
    mergedItems[key] = { ...mergedItems[key], ...filteredItem };
  });

  return mergedItems;
}

export function getMerakiItemData(
  endpointData: EndpointItemData,
  itemEndpointsData: EndpointItemData[],
  mergedItems: { [x: string]: any }
) {
  let { data } = endpointData as { data: MerakiItemObject };
  const requiredKeysMeraki: (keyof MerakiItem)[] = [
    "icon",
    "iconOverlay",
    "nicknames",
    "requiredChampion",
    "simpleDescription",
    "tier",
    "stats",
  ];
  // Loop through each item in the MerakiAnalytics endpoint
  Object.entries(data).forEach(([itemKey, itemValues]) => {
    let filteredItem = _.pick(itemValues, requiredKeysMeraki);
    // Get an array of champion classes from nested object property
    let classes = _.get(itemValues, "shop.tags");
    if (classes.length > 0) {
      classes = _.filter(classes, (className) => className in ChampionClass);
    }
    // Remove empty keys from stats to reduce the size of the json file
    let stats = _.get(itemValues, "stats");
    if (stats) {
      let camelCaseStats: MerakiStats = camelcaseKeys(stats, { deep: true });
      // Loop trough each of the stats and filter out entries with value 0
      let newStats = _(camelCaseStats)
        .pickBy(_.isObject)
        .mapValues((stat) => _.pickBy(stat, _.identity))
        .omitBy(_.isEmpty)
        .value() as MerakiStats;

      if (newStats) {
        data[itemKey].stats = newStats;
        filteredItem.stats = newStats;
      }
    }
    // Validate that the icon is a valid URL
    if (
      !filteredItem.icon ||
      (filteredItem.icon && !filteredItem.icon.startsWith("http"))
    ) {
      const CDragonData = itemEndpointsData.find(
        (endpoint) => endpoint.name === EndpointNames.CommunityDragon
      )?.data as CommunityDragonItem[];
      let CDragonIconPath = CDragonData.find(
        (item) => item.id === itemValues.id
      )?.iconPath;

      if (CDragonIconPath) {
        // Strip text after Icons2d/ from the icon path
        CDragonIconPath = CDragonIconPath.split("Icons2D/")[1].toLowerCase();
        // Set fallback icon if the icon is not a valid URL
        filteredItem.icon =
          "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/items/icons2d/" +
          CDragonIconPath;

        console.warn(
          `Item ${itemValues.name}-${itemValues.id} has an invalid icon URL, using fallback icon`
        );
      }
    }
    // Append the filteredItem and the classes to the mergedItems in the corresponding key
    mergedItems[itemKey] = {
      ...mergedItems[itemKey],
      ...filteredItem,
      classes: classes,
    };
  });

  return mergedItems;
}

export function getBlitzItemData(endpoint: EndpointItemData) {
  let { data } = endpoint.data as BlitzRoot;
  // Parse numbers
  Object.entries(data).forEach(([key, itemData]) => {
    Object.entries(itemData).forEach(([propKey, itemValue]) => {
      if (propKey === "id") {
        // Convert id to number
        data[key][propKey] = parseInt(itemValue, 10);
      } else if (
        (propKey === "maps" || propKey === "from" || propKey === "into") &&
        itemValue !== null
      ) {
        data[key][propKey] = itemValue.map(Number);
      } else if (propKey === "depth") {
        // Delete the depth key
        delete data[key]["depth"];
      } else if (propKey === "stats") {
        // Delete stats from blitzEndpoint
        delete data[key]["stats"];
      }
    });
  });
  return data;
}
