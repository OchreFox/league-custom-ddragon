// src/index.ts
import { info } from "@actions/core";

// src/parsers/champions.ts
import { writeFileSync, existsSync as existsSync2, mkdirSync as mkdirSync2 } from "fs";
import axios3 from "axios";
import _ from "lodash";
import "dotenv/config";

// src/utils/downloadImages.ts
import sharp from "sharp";
import { existsSync, mkdirSync } from "fs";
import axios from "axios";
import { encode } from "blurhash";

// src/utils/blurhashDataURL.ts
import { decodeBlurHash } from "fast-blurhash";

// src/utils/downloadImages.ts
async function downloadImage(filename, url) {
  if (!filename || !url) {
    console.warn("No filename or url specified");
    return "";
  }
  let placeholder = "";
  if (!existsSync("data/img/champions")) {
    mkdirSync("data/img/champions", { recursive: true });
  }
  if (!existsSync("data/img/items")) {
    mkdirSync("data/img/items", { recursive: true });
  }
  let axiosResponse = await axios.get(url, {
    responseType: "arraybuffer",
    headers: {
      "Accept-Encoding": "identity"
    }
  }).catch((err) => console.error(err));
  if (axiosResponse) {
    console.log("Saving image " + filename);
    await sharp(axiosResponse.data).toFile(filename).catch((err) => {
      console.error(err);
    });
    const { data, info: info2 } = await sharp(filename).raw().ensureAlpha().toBuffer({ resolveWithObject: true });
    const clamped = new Uint8ClampedArray(data);
    const blurhash = encode(clamped, info2.width, info2.height, 4, 4);
    placeholder = blurhash;
  }
  return placeholder;
}

// src/utils/getLatestVersion.ts
import axios2 from "axios";
var getLatestVersion = async () => {
  const versionsEndpoints = [
    {
      method: "get",
      url: "https://ddragon.leagueoflegends.com/api/versions.json",
      name: "DDragon (Riot)"
    },
    {
      method: "get",
      url: "https://utils.iesdev.com/static/json/lol/riot/versions",
      name: "Blitz"
    }
  ];
  for (const endpoint of versionsEndpoints) {
    try {
      console.log(`Getting latest version from ${endpoint.name}...`);
      const config = {
        method: endpoint.method,
        url: endpoint.url,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "Accept-Encoding": "identity"
        }
      };
      const response = await axios2(config).then((response2) => {
        return response2.data[0];
      }).catch((error) => {
        throw error;
      });
      console.log(`Got latest version from ${endpoint.name}`);
      return response;
    } catch (error) {
      console.error(`Failed to get latest version from ${endpoint.name}`);
      console.error(error);
    }
  }
  throw new Error("Failed to get latest version");
};

// endpoints/champions.json
var champions_default = [
  {
    name: "MerakiAnalytics",
    baseUrl: "http://cdn.merakianalytics.com/riot/lol/resources/latest",
    resource: "/en-US/champions.json",
    needsLatest: false
  }
];

// src/utils/championQuery.ts
var queryString = {
  query: `query ChampionsInfo{
      info: queryChampionsV1Contents(top: 0){
          flatData{
              name
              slug
              antiDive
              burst
              control
              damage
              damageType
              divePotential
              engage
              gankDenial
              gankReliability
              gankTurnAround
              kite
              mobility
              pick
              poke
              preControl
              preDamage
              preMobility
              preToughness
              postControl
              postDamage
              postMobility
              postToughness
              skirmish
              split
              sustained
              tags
              toughness
              utility
              waveclear
              powerSpikes{
                  early
                  mid
                  late
                }
              key: riotId
              riotSlug
              difficultyLevel
              difficulty{
                  flatData{
                      slug
                      name
                      level
                    }
                }
            }
        }
    }`,
  variables: {}
};

// src/utils/endpointUtils.ts
var getEndpointUrl = (endpoint, version) => {
  if (!version) {
    throw new Error("Version is undefined");
  }
  return `${endpoint.baseUrl}${endpoint.needsLatest ? version : ""}${endpoint.resource}`;
};
var getEndpoints = (endpoints, version) => {
  if (!version) {
    throw new Error("Version is undefined");
  }
  return endpoints.map((endpoint) => ({
    name: endpoint.name,
    url: getEndpointUrl(endpoint, version)
  }));
};

// src/parsers/champions.ts
var mergeChampions = async (endpoints, latestVersion) => {
  var _a;
  let mobalyticsConfig = {
    method: "post",
    url: "https://app.mobalytics.gg/api/league/gql/static/v1",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Accept-Encoding": "identity"
    },
    data: queryString
  };
  let championEndpoints = [];
  let championPromises = [];
  let mobalyticsData = [];
  let mergedChampionData = {};
  endpoints.forEach((endpoint) => {
    let promise = axios3.get(endpoint.url, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Encoding": "identity"
      }
    }).then((response) => {
      championEndpoints.push({ name: endpoint.name, data: response.data });
    });
    championPromises.push(promise);
  });
  await Promise.all(championPromises);
  championPromises = [];
  let mobalyticsPromise = axios3(mobalyticsConfig).then(function(response) {
    mobalyticsData = _.chain(response.data.data.info).flatMap(({ flatData }) => flatData).keyBy("riotSlug").value();
    console.log("Mobalytics data fetched");
  }).catch(function(error) {
    console.log(error);
  });
  championPromises.push(mobalyticsPromise);
  await Promise.all(championPromises);
  championEndpoints.forEach((endpoint) => {
    if (endpoint.name === "MerakiAnalytics" /* MerakiAnalytics */) {
      let data = endpoint.data;
      Object.assign(mergedChampionData, data);
    }
  });
  mergedChampionData = _.merge(mergedChampionData, mobalyticsData);
  let championIconPromises = [];
  for (const key of Object.keys(mergedChampionData)) {
    let icon = mergedChampionData[key].icon;
    if (icon) {
      let iconName = ((_a = icon.split("/").pop()) == null ? void 0 : _a.split(".")[0]) || "";
      if (iconName && iconName.length > 0) {
        let promise = downloadImage(
          `data/img/champions/${iconName}.webp`,
          icon
        ).then((placeholder) => {
          mergedChampionData[key].icon = `data/img/champions/${iconName}.webp`;
          mergedChampionData[key].placeholder = placeholder;
          console.log(
            "Downloaded icon for champion " + mergedChampionData[key].name
          );
        });
        championIconPromises.push(promise);
      }
    }
  }
  await Promise.all(championIconPromises);
  let lightweightChampionData = _.cloneDeep(mergedChampionData);
  Object.keys(lightweightChampionData).forEach((key) => {
    delete lightweightChampionData[key].abilities;
    delete lightweightChampionData[key].skins;
    delete lightweightChampionData[key].stats;
    delete lightweightChampionData[key].key;
    delete lightweightChampionData[key].slug;
  });
  console.info("Writing champions data to file...");
  writeFileSync(
    `data/${latestVersion}/champions.json`,
    JSON.stringify(mergedChampionData)
  );
  writeFileSync(
    `data/latest/champions.json`,
    JSON.stringify(mergedChampionData)
  );
  writeFileSync(
    `data/${latestVersion}/champions-summary.json`,
    JSON.stringify(lightweightChampionData)
  );
  writeFileSync(
    `data/latest/champions-summary.json`,
    JSON.stringify(lightweightChampionData)
  );
};
async function getChampions() {
  const latestVersion = await getLatestVersion();
  let endpoints = getEndpoints(champions_default, latestVersion);
  if (!existsSync2(`data/${latestVersion}`)) {
    mkdirSync2(`data/${latestVersion}`);
  }
  if (!existsSync2(`data/latest`)) {
    mkdirSync2(`data/latest`);
  }
  await mergeChampions(endpoints, latestVersion);
}

// src/parsers/items.ts
import axios4 from "axios";
import _4 from "lodash";
import { existsSync as existsSync3, mkdirSync as mkdirSync3 } from "fs";

// src/utils/sanitizeText.ts
import _2 from "lodash";
import DOMPurify from "isomorphic-dompurify";
import { XMLParser, XMLBuilder } from "fast-xml-parser";
var pascalCaseTags = [
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
  "TrueDamage"
];
var toPascalCase = (str) => {
  return str.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join("");
};
function sanitizeText(item) {
  var _a;
  if (!item)
    return "";
  let text = item.description;
  if (!text) {
    return;
  }
  text = text.replaceAll("{", "");
  text = text.replaceAll("}", "");
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
      "trueDamage"
    ],
    FORBID_TAGS: ["br"]
  });
  pascalCaseTags.forEach((tag) => {
    const lowercaseTag = tag.toLowerCase();
    sanitizedText = _2.replace(
      sanitizedText,
      new RegExp(lowercaseTag, "g"),
      tag
    );
  });
  const parser = new XMLParser({
    preserveOrder: true
  });
  const xml = parser.parse(sanitizedText);
  if ((_a = xml.mainText) == null ? void 0 : _a.stats) {
    for (let key in xml.mainText.stats) {
      delete xml.mainText.stats[key];
    }
  }
  const builder = new XMLBuilder({
    preserveOrder: true
  });
  let xmlString = builder.build(xml);
  xmlString = parseStats(xmlString, item);
  xmlString = parseActives(xmlString);
  const lessThanRegex = /([a-zA-Z,:])</g;
  xmlString = xmlString.replace(lessThanRegex, "$1 <");
  return xmlString;
}
function parseStats(xmlString, item) {
  const statsRegex = /<Stats>(.*?)<\/Stats>/g;
  const statsMatch = xmlString.match(statsRegex);
  if (statsMatch) {
    const statsTag = statsMatch[0];
    let statsString = "";
    if (item.stats) {
      Object.entries(item.stats).forEach(([keyItem, value]) => {
        Object.entries(value).forEach(([key2, value2]) => {
          let statName = toPascalCase(key2) + toPascalCase(keyItem);
          statsString += `<Stat name="${statName}">${value2}${key2.includes("percent") ? "%" : ""}</Stat>`;
        });
      });
    }
    const statText = `<Stats>${statsString}</Stats>`;
    xmlString = _2.replace(xmlString, statsTag, statText);
  }
  return xmlString;
}
function parseActives(xmlString) {
  const activeRegex = /<Active>(.*?)<\/Active>/g;
  const activeMatch = xmlString.match(activeRegex);
  let skipNext = false;
  if (activeMatch) {
    for (const match of activeMatch) {
      if (skipNext === true) {
        skipNext = false;
        xmlString = _2.replace(xmlString, match, "");
        continue;
      }
      const tagContent = match.replace(/<\/?Active>/g, "");
      if (tagContent === "Active -") {
        const nextTagContent = activeMatch[activeMatch.indexOf(match) + 1].replace(/<\/?Active>/g, "").trim();
        xmlString = _2.replace(
          xmlString,
          match,
          `<Active>Active - ${nextTagContent}</Active>`
        );
        skipNext = true;
      }
    }
  }
  return xmlString;
}

// src/utils/itemUtils.ts
import path from "path";
import fs from "fs";
import _3 from "lodash";

// src/types/items.ts
var ChampionClass = /* @__PURE__ */ ((ChampionClass2) => {
  ChampionClass2["Assassin"] = "ASSASSIN";
  ChampionClass2["Fighter"] = "FIGHTER";
  ChampionClass2["Mage"] = "MAGE";
  ChampionClass2["Marksman"] = "MARKSMAN";
  ChampionClass2["Support"] = "SUPPORT";
  ChampionClass2["Tank"] = "TANK";
  return ChampionClass2;
})(ChampionClass || {});

// src/utils/itemUtils.ts
import camelcaseKeys from "camelcase-keys";
function writeItems(latestVersion, mergedItems) {
  let rootPath = "data/";
  let latestVersionPath = path.join(rootPath, latestVersion, "/items.json");
  latestVersionPath = path.normalize(latestVersionPath);
  fs.writeFileSync(latestVersionPath, JSON.stringify(mergedItems));
  fs.writeFileSync(`data/latest/items.json`, JSON.stringify(mergedItems));
}
function filterPassives(passives) {
  return passives.map((passive) => {
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
function getCamelCaseStats(stats) {
  let camelCaseStats = camelcaseKeys(stats, { deep: true });
  return _3(camelCaseStats).pickBy(_3.isObject).mapValues((stat) => _3.pickBy(stat, _3.identity)).omitBy(_3.isEmpty).value();
}
function filterStats(stats) {
  if (Array.isArray(stats)) {
    return getCamelCaseStats(stats[0]);
  } else {
    return getCamelCaseStats(stats);
  }
}
function getChampionClasses(itemValues) {
  let classes = _3.get(itemValues, "shop.tags");
  if (classes.length > 0) {
    classes = _3.filter(classes, (className) => {
      return _3.includes(Object.values(ChampionClass), className);
    });
  }
  return classes;
}
function getCommunityDragonItemData(endpointData, mergedItems) {
  let { data } = endpointData;
  const requiredKeysCD = [
    "categories",
    "inStore",
    "maxStacks"
  ];
  data.forEach((item) => {
    const key = item.id;
    let filteredItem = _3.pick(item, requiredKeysCD);
    mergedItems[key] = { ...mergedItems[key], ...filteredItem };
  });
  return mergedItems;
}
function getMerakiItemData(endpointData, itemEndpointsData, mergedItems) {
  let { data } = endpointData;
  const requiredKeysMeraki = [
    "icon",
    "iconOverlay",
    "nicknames",
    "requiredChampion",
    "simpleDescription",
    "tier",
    "stats",
    "passives",
    "active"
  ];
  Object.entries(data).forEach(([itemKey, itemValues]) => {
    var _a, _b;
    let filteredItem = _3.pick(itemValues, requiredKeysMeraki);
    let classes = getChampionClasses(itemValues);
    let stats = _3.get(itemValues, "stats");
    if (stats) {
      let newStats = filterStats(stats);
      if (newStats) {
        data[itemKey].stats = newStats;
        filteredItem.stats = newStats;
      }
    }
    let passives = _3.get(itemValues, "passives");
    if (passives && passives.length > 0) {
      let newPassives = filterPassives(passives);
      if (newPassives) {
        data[itemKey].passives = newPassives;
        filteredItem.passives = newPassives;
      }
    }
    if (!filteredItem.icon || filteredItem.icon && !filteredItem.icon.startsWith("http")) {
      const CDragonData = (_a = itemEndpointsData.find(
        (endpoint) => endpoint.name === "CommunityDragon" /* CommunityDragon */
      )) == null ? void 0 : _a.data;
      let CDragonIconPath = (_b = CDragonData.find(
        (item) => item.id === itemValues.id
      )) == null ? void 0 : _b.iconPath;
      if (CDragonIconPath) {
        CDragonIconPath = CDragonIconPath.split("Icons2D/")[1].toLowerCase();
        filteredItem.icon = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/items/icons2d/" + CDragonIconPath;
        console.warn(
          `Item ${itemValues.name}-${itemValues.id} has an invalid icon URL, using fallback icon`
        );
      }
    }
    mergedItems[itemKey] = {
      ...mergedItems[itemKey],
      ...filteredItem,
      classes
    };
  });
  return mergedItems;
}
function hasDescriptionMythic(description) {
  return description.includes("RarityMythic");
}
function getBlitzItemData(endpoint) {
  let { data } = endpoint.data;
  Object.entries(data).forEach(([key, itemData]) => {
    Object.entries(itemData).forEach(([propKey, itemValue]) => {
      if (propKey === "id") {
        data[key][propKey] = parseInt(itemValue, 10);
      } else if ((propKey === "maps" || propKey === "from" || propKey === "into") && itemValue !== null) {
        data[key][propKey] = itemValue.map(Number);
      } else if (propKey === "depth") {
        delete data[key]["depth"];
      } else if (propKey === "stats") {
        delete data[key]["stats"];
      } else if (propKey === "description") {
        if (hasDescriptionMythic(itemValue)) {
          data[key]["mythic"] = true;
        }
      }
    });
  });
  return data;
}

// src/utils/constants.ts
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
  placeholder: "",
  requiredChampion: "",
  simpleDescription: "",
  stats: {},
  tier: 0
};

// src/parsers/items.ts
import "dotenv/config";

// endpoints/items.json
var items_default = [
  {
    name: "Blitz",
    baseUrl: "https://blitz-cdn-plain.blitz.gg/blitz/ddragon/",
    resource: "/data/en_US/items.json",
    needsLatest: true
  },
  {
    name: "MerakiAnalytics",
    baseUrl: "https://cdn.merakianalytics.com/riot/lol/resources/latest",
    resource: "/en-US/items.json",
    needsLatest: false
  },
  {
    name: "CommunityDragon",
    baseUrl: "https://raw.communitydragon.org/latest",
    resource: "/plugins/rcp-be-lol-game-data/global/default/v1/items.json",
    needsLatest: false
  }
];

// src/parsers/items.ts
var mergeItems = async (endpoints, latestVersion) => {
  let itemEndpointsData = [];
  let itemPromises = [];
  endpoints.forEach((endpoint) => {
    console.log(`Fetching ${endpoint.name} items...`);
    let promise = axios4.get(endpoint.url, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Encoding": "identity"
      }
    }).then((response) => {
      console.log(`Fetched ${endpoint.name} items`);
      itemEndpointsData.push({ name: endpoint.name, data: response.data });
    });
    itemPromises.push(promise);
  });
  await Promise.all(itemPromises);
  let mergedItems = {};
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
  mergedItems = _4.mapValues(mergedItems, (item) => {
    return _4.defaults(item, defaultValues);
  });
  console.log(`Merged ${Object.keys(mergedItems).length} items`);
  let itemIconPromises = [];
  Object.entries(mergedItems).forEach(async ([key, item]) => {
    var _a;
    if (item.description) {
      mergedItems[key].description = sanitizeText(item);
    }
    if (item.icon) {
      let iconName = ((_a = item.icon.split("/").pop()) == null ? void 0 : _a.split(".")[0]) || "";
      if (iconName && iconName.length > 0) {
        let promise = downloadImage(
          `data/img/items/${iconName}.webp`,
          item.icon
        ).then((placeholder) => {
          mergedItems[key].icon = `data/img/items/${iconName}.webp`;
          mergedItems[key].placeholder = placeholder;
          console.log("Downloaded icon for item " + mergedItems[key].name);
        });
        itemIconPromises.push(promise);
      }
    }
  });
  await Promise.all(itemIconPromises);
  console.info("Writing items data to file...");
  writeItems(latestVersion, mergedItems);
};
var getItems = async () => {
  const latestVersion = await getLatestVersion();
  let endpoints = getEndpoints(items_default, latestVersion);
  console.log("Endpoints: ", endpoints);
  if (!existsSync3(`data/${latestVersion}`)) {
    mkdirSync3(`data/${latestVersion}`);
  }
  if (!existsSync3(`data/latest`)) {
    mkdirSync3(`data/latest`);
  }
  await mergeItems(endpoints, latestVersion);
};

// src/index.ts
var main = async () => {
  await getItems();
  info("Successfully merged items.json\n");
  await getChampions();
  info("Successfully merged champions.json\n");
  info("Successfully generated custom files.");
};
main();
//# sourceMappingURL=index.js.map