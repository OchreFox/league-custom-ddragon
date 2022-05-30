const axios = require("axios");
const path = require("path");
const core = require("@actions/core");
const github = require("@actions/github");
var _ = require("lodash");
const fs = require("fs");
const createDOMPurify = require("dompurify");
const { JSDOM } = require("jsdom");
const { getLatestVersion } = require("./getLatestVersion");
const { XMLParser, XMLBuilder, XMLValidator } = require("fast-xml-parser");

// Function to convert a string from camel case or snake case to pascal case
const toPascalCase = (str) => {
  return str
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
};

// Function to convert a string from snake case to camel case
const snakeToCamel = (str) => {
  return str.replace(/(\_\w)/g, (m) => m[1].toUpperCase());
};

const sanitizeText = (item) => {
  if (!item) return "";
  const text = item.description;
  if (!text) {
    return;
  }
  const pascalCaseTags = [
    "Active",
    "Attention",
    "FlavorText",
    "Healing",
    "KeywordStealth",
    "MagicDamage",
    "MainText",
    "Passive",
    "PhysicalDamage",
    "RarityGeneric",
    "RarityLegendary",
    "RarityMythic",
    "Rules",
    "ScaleLevel",
    "ScaleMana",
    "Stats",
    "Status",
    "TrueDamage",
  ];
  // Sanitize text with dompurify
  const window = new JSDOM("").window;
  const DOMPurify = createDOMPurify(window);
  let sanitizedText = DOMPurify.sanitize(text, {
    ADD_TAGS: [
      "active",
      "attention",
      "flavorText",
      "healing",
      "keywordStealth",
      "magicDamage",
      "mainText",
      "passive",
      "physicalDamage",
      "rarityGeneric",
      "rarityLegendary",
      "rarityMythic",
      "rules",
      "scaleLevel",
      "scaleMana",
      "stats",
      "status",
      "trueDamage",
    ],
    FORBID_TAGS: ["br"],
  });

  // Replace all lowercase words inside the sanitizedText with the camelCaseTags version
  pascalCaseTags.forEach((tag) => {
    const lowercaseTag = tag.toLowerCase();
    // Replace lowercase tag with tag
    sanitizedText = _.replace(
      sanitizedText,
      new RegExp(lowercaseTag, "g"),
      tag
    );
  });

  // Parse with fast-xml-parser
  const parser = new XMLParser({
    preserveOrder: true,
  });
  const xml = parser.parse(sanitizedText);
  // Remove stats from the xml object
  if (xml.mainText?.stats) {
    for (var key in xml.mainText.stats) {
      delete xml.mainText.stats[key];
    }
  }
  // Convert xml object to XML string
  const builder = new XMLBuilder({
    preserveOrder: true,
  });
  var xmlString = builder.build(xml);

  // Add stats between <Stats> tag and </Stats> tag
  const statsRegex = /<Stats>(.*?)<\/Stats>/g;
  const statsMatch = xmlString.match(statsRegex);
  if (statsMatch) {
    const statsTag = statsMatch[0];
    var statsString = "";

    // Create the stats string with the stats of the item
    if (item.stats) {
      Object.entries(item.stats).forEach(([keyItem, value]) => {
        Object.entries(value).forEach(([key2, value2]) => {
          let statName = toPascalCase(key2) + toPascalCase(keyItem);
          statsString += `<Stat name="${statName}">${value2}${
            key2.includes("percent") ? "%" : ""
          }</Stat>`;
        });
      });
    }

    const statText = `<Stats>${statsString}</Stats>`;
    xmlString = _.replace(xmlString, statsTag, statText);
  }

  // Combine all two adjacent Active tags when the first one is "Active -"
  // Example: <Active>Active -</Active><Active>Lorem ipsum</Active>
  // Result:  <Active>Active - Lorem ipsum</Active>

  const activeRegex = /<Active>(.*?)<\/Active>/g;
  const activeMatch = xmlString.match(activeRegex);
  var skipNext = false;
  if (activeMatch) {
    // Loop through each match
    for (const match of activeMatch) {
      // If skipNext is set to true, skip the next match
      if (skipNext === true) {
        skipNext = false;
        // Delete the match from the xmlString
        xmlString = _.replace(xmlString, match, "");
        continue;
      }
      // Get the content of the match
      const tagContent = match.replace(/<\/?Active>/g, "");
      // Check if the content is "Active -"
      if (tagContent === "Active -") {
        // Replace the match with the "Active - " and the content of the next match
        const nextTagContent = activeMatch[activeMatch.indexOf(match) + 1]
          .replace(/<\/?Active>/g, "")
          .trim();

        xmlString = _.replace(
          xmlString,
          match,
          `<Active>Active - ${nextTagContent}</Active>`
        );
        // Skip the next match
        skipNext = true;
      }
    }
  }

  // Replace in xmlString:
  // Add a whitespace (' ') before a less than character ('<') if the preceding character is a letter (a-z, A-Z) or a colon (':')

  const lessThanRegex = /([a-zA-Z,:])</g;
  xmlString = xmlString.replace(lessThanRegex, "$1 <");

  return xmlString;
};

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
    "tier",
    "stats",
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
              // Delete the depth key
              delete data[key]["depth"];
            } else if (key2 === "stats") {
              // Delete stats from blitzEndpoint
              delete data[key]["stats"];
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

  // Set default values for required keys
  var defaultValues = {
    categories: [],
    classes: [],
    description: null,
    from: [],
    gold: { base: 0, purchasable: false, total: 0, sell: 0 },
    icon: "",
    iconOverlay: false,
    id: -1,
    inStore: false,
    into: [],
    maps: [],
    maxStacks: 0,
    mythic: false,
    name: "",
    nicknames: [],
    requiredChampion: "",
    simpleDescription: "",
    stats: {},
    tier: 0,
  };
  // Merge the default values with every item in mergedItems
  mergedItems = _.mapValues(mergedItems, (item) => {
    return _.defaults(item, defaultValues);
  });

  // Sanitize item description for each item in mergedItems
  Object.entries(mergedItems).forEach(([key, value]) => {
    let description = value.description;
    if (description) {
      description = sanitizeText(value);
      mergedItems[key].description = description;
    }
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

main();
exports.getItems = getItems;
