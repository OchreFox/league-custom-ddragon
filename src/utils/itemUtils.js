const path = require("path");
const fs = require("fs");
var _ = require("lodash");

// Function to convert a string from snake case to camel case
const snakeToCamel = (str) => {
  return str.replace(/(_\w)/g, (m) => m[1].toUpperCase());
};

function writeItems(latestVersion, mergedItems) {
  // Write the merged items.json file in the latestVersion folder "./data/" + latestVersion + "/items.json";
  let rootPath = "data/";
  let latestVersionPath = path.join(rootPath, latestVersion, "/items.json");
  // Sanitize path to avoid directory traversal
  latestVersionPath = path.normalize(latestVersionPath);
  // deepcode ignore PT: Wont fix this right away
  fs.writeFileSync(latestVersionPath, JSON.stringify(mergedItems));
  // Also save a copy in the latest folder
  fs.writeFileSync(`data/latest/items.json`, JSON.stringify(mergedItems));
}

function getCommunityDragonData(endpoint, mergedItems) {
  let requiredKeysCD = ["categories", "inStore", "maxStacks"];
  endpoint.data.forEach((item) => {
    const key = item.id;
    let filteredItem = _.pick(item, requiredKeysCD);
    // Append the filteredItem to the mergedItems in the corresponding key
    mergedItems[key] = { ...mergedItems[key], ...filteredItem };
  });
}

function getMerakiData(
  values,
  requiredKeysMeraki,
  admittedClasses,
  itemEndpoints
) {
  let filteredItem = _.pick(values, requiredKeysMeraki);

  // Get an array of champion classes from nested object property
  let classes = _.get(values, "shop.tags");
  if (classes.length > 0) {
    classes = _.filter(classes, (className) =>
      admittedClasses.includes(className)
    );
  }
  // Remove empty keys from stats to reduce the size of the json file
  let stats = _.get(values, "stats");
  if (stats) {
    Object.entries(stats).forEach((stat) => {
      const [key2, value2] = stat;
      // Convert key2 from snake case to camel case
      const camelCaseKey2 = snakeToCamel(key2);
      // Replace key2
      if (key2 !== camelCaseKey2) {
        Object.defineProperty(
          stats,
          camelCaseKey2,
          Object.getOwnPropertyDescriptor(stats, key2)
        );
        delete stats[key2];
      }

      Object.entries(value2).forEach((stat2) => {
        const [key3, value3] = stat2;
        if (value3 === 0) {
          delete values["stats"][camelCaseKey2][key3];
        }
      });
    });
  }
  // Validate that the icon is a valid URL
  if (
    !filteredItem.icon ||
    (filteredItem.icon && !filteredItem.icon.startsWith("http"))
  ) {
    // Get item from CommunityDragon endpoint data
    let CDragonIconPath = _.chain(itemEndpoints)
      .find({ name: "CommunityDragon" })
      .get("data")
      .find({ id: values.id })
      .get("iconPath")
      .value();

    if (CDragonIconPath) {
      // Strip text after Icons2d/ from the icon path
      CDragonIconPath = CDragonIconPath.split("Icons2D/")[1].toLowerCase();
      // Set fallback icon if the icon is not a valid URL
      filteredItem.icon =
        "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/items/icons2d/" +
        CDragonIconPath;

      console.warn(
        `Item ${values.name}-${values.id} has an invalid icon URL, using fallback icon`
      );
    }
  }
  return { filteredItem, classes };
}

function getBlitzData(endpoint) {
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
        // Delete the depth key
        delete data[key]["depth"];
      } else if (key2 === "stats") {
        // Delete stats from blitzEndpoint
        delete data[key]["stats"];
      }
    });
  });
  return data;
}

module.exports = {
  getCommunityDragonData,
  getMerakiData,
  getBlitzData,
  writeItems,
};
