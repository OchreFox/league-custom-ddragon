import path from "path";
import fs from "fs";
import _ from "lodash";
import { EndpointItemData } from "~/src/types/global.js";
import {
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
import DOMPurify from "isomorphic-dompurify";
import { JSDOM } from "jsdom";
import LuaJSON from "lua-json";

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

// Filter passive stats to remove empty values and flatten the stats object
function filterPassives(passives: Passive[]) {
  return passives.map((passive: Passive) => {
    // Flatten the stats object to prevent arrays of one object
    let stats = Object.entries(passive.stats).map(([name, stat]) => {
      if (Array.isArray(stat)) {
        return { [name]: stat[0] };
      } else {
        return { [name]: stat };
      }
    });
    passive.stats = filterStats(stats);
    return passive;
  });
}

// This function camelCases the keys of the stats object
// while removing all the empty stats.
function getCamelCaseStats(stats: MerakiStats) {
  let camelCaseStats: MerakiStats = camelcaseKeys(stats, { deep: true });
  // Loop trough each of the stats and filter out entries with value 0
  return _(camelCaseStats)
    .pickBy(_.isObject)
    .mapValues((stat) => _.pickBy(stat, _.identity))
    .omitBy(_.isEmpty)
    .value() as MerakiStats;
}

// This code takes the stats returned by the Meraki API and returns a CamelCase version of the stats in an object.
function filterStats(stats: MerakiStats | MerakiStats[]) {
  if (Array.isArray(stats)) {
    return getCamelCaseStats(stats[0]);
  } else {
    return getCamelCaseStats(stats);
  }
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

    // Strip text after Icons2d/ from the icon path
    let CDragonIconPath = item.iconPath.split("Icons2D/")[1].toLowerCase();
    if (mergedItems[key]) {
      // Set icon
      mergedItems[key].icon =
        "https://raw.communitydragon.org/latest/game/assets/items/icons2d/" +
        CDragonIconPath;

      // Append the filteredItem to the mergedItems in the corresponding key
      mergedItems[key] = { ...mergedItems[key], ...filteredItem };
    } else {
      console.log("Item " + key + " not found in mergedItems");
    }
  });

  return mergedItems;
}

export function getMerakiItemData(
  endpointData: EndpointItemData,
  mergedItems: { [x: string]: any }
) {
  let { data } = endpointData as { data: MerakiItemObject };
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
  Object.entries(data).forEach(([itemKey, itemValues]) => {
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
        data[key]["tier"] = parseInt(itemValue, 10);
      } else if (propKey === "stats") {
        // Delete stats from blitzEndpoint
        delete data[key]["stats"];
      }
      // Handle description to check if it's a mythic item
      else if (propKey === "mythic") {
        data[key]["mythic"] = itemValue;
      }
    });
  });
  return data;
}

export function getLeagueOfLegendsWikiItemData(
  endpointData: EndpointItemData,
  mergedItems: { [x: string]: any }
) {
  // Endpoint data is an HTML string, sanitize it with DOMPurify
  const cleanHTML = DOMPurify.sanitize(endpointData.data as string);

  // Parse the HTML string using JSDOM
  const dom = new JSDOM(cleanHTML);
  const document = dom.window.document;

  // Get the element with the item data
  const itemDataSelector = "#mw-content-text > div.mw-parser-output > pre";
  const itemDataElement = document.querySelector(itemDataSelector);
  const itemDataString = itemDataElement?.textContent;

  // Convert the Lua table to JSON
  const itemDataJSON = LuaJSON.parse(itemDataString ?? "");

  // Convert the JSON to an array of items
  const itemDataArray = Object.entries(itemDataJSON).map(([key, value]) => {
    return {
      name: key,
      ...value,
    };
  });

  // Loop through each item in the LeagueOfLegendsWiki endpoint and merge the following keys with the existing item:
  // - type: Array of strings

  itemDataArray.forEach((item) => {
    // Set key as the item id
    const key = item.id;

    // Append the filteredItem to the mergedItems in the corresponding key
    if (mergedItems[key]) {
      mergedItems[key] = { ...mergedItems[key], type: item.type };
    }
  });

  return mergedItems;
}
