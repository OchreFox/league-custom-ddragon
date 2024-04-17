import path from "path";
import fs from "fs";
import _ from "lodash";
import { EndpointItemData } from "~/src/types/global.js";
import {
  BlitzData,
  BlitzItem,
  BlitzRoot,
  ChampionClass,
  CommunityDragonItem,
  MerakiItem,
  MerakiItemObject,
  MerakiStats,
  MerakiTag,
  Passive,
} from "~/src/types/items.js";
import camelcaseKeys from "camelcase-keys";
import { merakiItemSchema } from "../schemas/meraki-item-zod-schema";

// Function to convert a string from snake case to camel case
export function snakeToCamel(str: string) {
  return str.replace(/(_\w)/g, (m) => m[1].toUpperCase());
}

// This code writes the merged items.json file in the latestVersion folder "./data/" + latestVersion + "/items.json";
export function writeItems(latestVersion: string, mergedItems: {}) {
  let rootPath = "data/";
  let latestVersionPath = path.join(rootPath, latestVersion, "/items.json");
  latestVersionPath = path.normalize(latestVersionPath);
  fs.writeFileSync(latestVersionPath, JSON.stringify(mergedItems));
  // Also save a copy in the latest folder
  fs.writeFileSync(`data/latest/items.json`, JSON.stringify(mergedItems));
}

// Filter passive stats to remove empty values or zero values
function filterPassives(passives: Passive[]): Passive[] {
  return passives.map((passive) => {
    let filteredStats = filterStats(passive.stats);
    if (filteredStats) {
      passive.stats = filteredStats;
    }
    return passive;
  });
}

// Filter stats to remove empty values or zero values
function filterStats(stats: MerakiStats): MerakiStats {
  return _.mapValues(stats, (value) => {
    if (value) {
      // Remove empty values from the stats object
      return _.pickBy(value, (value) => {
        return value !== 0;
      });
    }
  }) as MerakiStats;
}

// Returns the champion classes of the item. (e.g. "Fighter", "Tank")
function getChampionClasses(itemValues: MerakiItem) {
  let classes = _.get(itemValues, "shop.tags");
  if (classes.length > 0) {
    // Filter class names that are defined in the ChampionClass enum
    classes = _.filter(classes, (className: MerakiTag | ChampionClass) => {
      return _.includes(Object.values(ChampionClass), className);
    });
  }
  return classes;
}

export function getCommunityDragonItemData(endpointData: EndpointItemData): {
  [x: string]: CommunityDragonItem;
} {
  let { data } = endpointData as { data: CommunityDragonItem[] };

  data.map((item) => {
    // Strip text after Icons2d/ from the icon path
    let CDragonIconPath = item.iconPath.split("Icons2D/")[1].toLowerCase();
    // Set icon path to the community dragon icon path
    item.icon =
      "https://raw.communitydragon.org/latest/game/assets/items/icons2d/" +
      CDragonIconPath;
  });

  // Convert the data object from an array to an object with the id as the key
  let mergedItems = _.keyBy(data, "id");

  // Save mergedItems to a file for debugging
  fs.writeFileSync("data/mergedItems.json", JSON.stringify(mergedItems));

  return mergedItems;
}

export function getMerakiItemData(
  endpointData: EndpointItemData,
  mergedItems: { [x: string]: any }
) {
  let { data } = endpointData as { data: MerakiItemObject };
  // Remove the mythic property from the passives
  // Object.entries(data).forEach(([key, item]) => {
  //   item.passives.forEach((passive) => {
  //     delete passive.mythic;
  //   });
  // });

  let merakiItemData: MerakiItemObject = camelcaseKeys(data, { deep: true });

  // Check schema
  Object.entries(merakiItemData).forEach(([key, item]) => {
    try {
      merakiItemSchema.parse(item);
    } catch (error) {
      throw new Error(
        `Meraki item with key ${key} does not match the schema: ${error}`
      );
    }
  });
  console.log("Meraki schema check complete");

  // Save meraki data to a file for debugging
  fs.writeFileSync("data/meraki.json", JSON.stringify(merakiItemData));

  const requiredKeysMeraki: (keyof MerakiItem)[] = [
    "iconOverlay",
    "nicknames",
    "requiredChampion",
    "simpleDescription",
    "stats",
    "passives",
    "active",
  ];
  // Loop through each item in the MerakiAnalytics endpoint
  Object.entries(merakiItemData).forEach(([itemKey, itemValues]) => {
    let filteredItem = _.pick(itemValues, requiredKeysMeraki);
    // Get an array of champion classes from nested object property
    let classes = getChampionClasses(itemValues);
    // Remove empty keys from stats to reduce the size of the json file
    let stats = _.get(itemValues, "stats");
    if (stats) {
      let newStats = filterStats(stats);
      if (newStats) {
        data[itemKey].stats = newStats;
        filteredItem.stats = newStats;
      }
    }

    // Remove empty passives and active nested values
    let passives = _.get(itemValues, "passives");
    if (passives && passives.length > 0) {
      // Filter passive stats to remove empty values
      let newPassives = filterPassives(passives);
      if (newPassives) {
        data[itemKey].passives = newPassives;
        filteredItem.passives = newPassives;
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

export function getBlitzItemData(
  endpoint: EndpointItemData,
  mergedItems: { [x: string]: any }
) {
  let { data } = endpoint.data as BlitzRoot;

  // Filter the blitz data to only get the required keys
  Object.entries(data).forEach(([key, itemData]) => {
    let maps = itemData.maps?.map(Number) ?? [];
    // Add the maps to the mergedItems in the corresponding key
    mergedItems[key] = {
      ...mergedItems[key],
      maps: maps,
    };
  });

  // Make a list of all valid item ids from the blitz data
  // That is, all items that have in maps 11 (SR) or 12 (HA)
  const validMapIds = [11, 12];
  let validItemIds: string[] = [];
  Object.entries(data).forEach(([key, itemData]) => {
    if (itemData.maps.some((mapId) => validMapIds.includes(Number(mapId)))) {
      validItemIds.push(key);
    }
  });

  // Filter the mergedItems to only include the valid item ids
  let filteredItems: { [x: string]: any } = {};
  validItemIds.forEach((itemId) => {
    filteredItems[itemId] = mergedItems[itemId];
  });

  return filteredItems;
}
