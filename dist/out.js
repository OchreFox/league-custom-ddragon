var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b ||= {})
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// src/index.ts
import { info } from "../node_modules/@actions/core/lib/core.js";

// src/parsers/champions.ts
import { writeFileSync, existsSync as existsSync2, mkdirSync as mkdirSync2 } from "fs";
import axios3 from "../node_modules/axios/index.js";
import _ from "../node_modules/lodash/lodash.js";
import "../node_modules/dotenv/config.js";

// src/utils/downloadImages.ts
import sharp from "../node_modules/sharp/lib/index.js";
import { existsSync, mkdirSync } from "fs";
import axios from "../node_modules/axios/index.js";
import { encode } from "../node_modules/blurhash/dist/index.mjs";
function downloadImage(filename, url) {
  return __async(this, null, function* () {
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
    yield axios.get(url, { responseType: "arraybuffer" }).then((axiosResponse) => __async(this, null, function* () {
      console.log("Saving image " + filename);
      yield sharp(axiosResponse.data).toFile(filename).catch((err) => {
        console.error(err);
      });
      const { data, info: info2 } = yield sharp(filename).raw().ensureAlpha().toBuffer({ resolveWithObject: true });
      const clamped = new Uint8ClampedArray(data);
      const blurhash = encode(clamped, info2.width, info2.height, 4, 4);
      placeholder = blurhash;
    })).catch((err) => console.error(err));
    return placeholder;
  });
}

// src/utils/getLatestVersion.ts
import axios2 from "../node_modules/axios/index.js";
var getLatestVersion = () => __async(void 0, null, function* () {
  const response = yield axios2.get(
    "https://ddragon.leagueoflegends.com/api/versions.json"
  );
  let latestVersion = response.data[0];
  latestVersion = latestVersion.replace(/[^0-9.]/g, "");
  return latestVersion;
});

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
  return `${endpoint.baseUrl}${endpoint.needsLatest ? version : ""}${endpoint.resource}`;
};
var getEndpoints = (endpoints, version) => {
  return endpoints.map((endpoint) => ({
    name: endpoint.name,
    url: getEndpointUrl(endpoint, version)
  }));
};

// src/parsers/champions.ts
var mergeChampions = (endpoints, latestVersion) => __async(void 0, null, function* () {
  var _a;
  let mobalyticsConfig = {
    method: "post",
    url: "https://app.mobalytics.gg/api/league/gql/static/v1",
    headers: {
      "Content-Type": "application/json"
    },
    data: queryString
  };
  let championEndpoints = [];
  let championPromises = [];
  let mobalyticsData = [];
  let mergedChampionData = {};
  endpoints.forEach((endpoint) => {
    let promise = axios3.get(endpoint.url).then((response) => {
      championEndpoints.push({ name: endpoint.name, data: response.data });
    });
    championPromises.push(promise);
  });
  yield Promise.all(championPromises);
  championPromises = [];
  let mobalyticsPromise = axios3(mobalyticsConfig).then(function(response) {
    mobalyticsData = _.chain(response.data.data.info).flatMap(({ flatData }) => flatData).keyBy("riotSlug").value();
    console.log("Mobalytics data fetched");
  }).catch(function(error) {
    console.log(error);
  });
  championPromises.push(mobalyticsPromise);
  yield Promise.all(championPromises);
  championEndpoints.forEach((endpoint) => {
    if (endpoint.name === "MerakiAnalytics" /* MerakiAnalytics */) {
      let data = endpoint.data;
      Object.assign(mergedChampionData, data);
    }
  });
  mergedChampionData = _.merge(mergedChampionData, mobalyticsData);
  for (const key of Object.keys(mergedChampionData)) {
    let icon = mergedChampionData[key].icon;
    if (icon) {
      let iconName = ((_a = icon.split("/").pop()) == null ? void 0 : _a.split(".")[0]) || "";
      if (iconName && iconName.length > 0) {
        mergedChampionData[key].placeholder = yield downloadImage(
          `data/img/champions/${iconName}.webp`,
          icon
        );
        mergedChampionData[key].icon = `data/img/champions/${iconName}.webp`;
      }
    }
  }
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
});
function getChampions() {
  return __async(this, null, function* () {
    const latestVersion = yield getLatestVersion();
    let endpoints = getEndpoints(champions_default, latestVersion);
    if (!existsSync2(`data/${latestVersion}`)) {
      mkdirSync2(`data/${latestVersion}`);
    }
    if (!existsSync2(`data/latest`)) {
      mkdirSync2(`data/latest`);
    }
    yield mergeChampions(endpoints, latestVersion);
  });
}

// src/parsers/items.ts
import axios4 from "../node_modules/axios/index.js";
import _4 from "../node_modules/lodash/lodash.js";
import { existsSync as existsSync3, mkdirSync as mkdirSync3 } from "fs";

// src/utils/sanitizeText.ts
import _2 from "../node_modules/lodash/lodash.js";
import DOMPurify from "../node_modules/isomorphic-dompurify/index.js";
import { XMLParser, XMLBuilder } from "../node_modules/fast-xml-parser/src/fxp.js";
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
import _3 from "../node_modules/lodash/lodash.js";

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
import camelcaseKeys from "../node_modules/camelcase-keys/index.js";
function writeItems(latestVersion, mergedItems) {
  let rootPath = "data/";
  let latestVersionPath = path.join(rootPath, latestVersion, "/items.json");
  latestVersionPath = path.normalize(latestVersionPath);
  fs.writeFileSync(latestVersionPath, JSON.stringify(mergedItems));
  fs.writeFileSync(`data/latest/items.json`, JSON.stringify(mergedItems));
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
    mergedItems[key] = __spreadValues(__spreadValues({}, mergedItems[key]), filteredItem);
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
    "stats"
  ];
  Object.entries(data).forEach(([itemKey, itemValues]) => {
    var _a, _b;
    let filteredItem = _3.pick(itemValues, requiredKeysMeraki);
    let classes = _3.get(itemValues, "shop.tags");
    if (classes.length > 0) {
      classes = _3.filter(classes, (className) => className in ChampionClass);
    }
    let stats = _3.get(itemValues, "stats");
    if (stats) {
      let newStats = camelcaseKeys(stats, { deep: true });
      data[itemKey].stats = newStats;
      filteredItem.stats = newStats;
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
    mergedItems[itemKey] = __spreadProps(__spreadValues(__spreadValues({}, mergedItems[itemKey]), filteredItem), {
      classes
    });
  });
  return mergedItems;
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
import "../node_modules/dotenv/config.js";

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
var mergeItems = (endpoints, latestVersion) => __async(void 0, null, function* () {
  let itemEndpointsData = [];
  let itemPromises = [];
  endpoints.forEach((endpoint) => {
    let promise = axios4.get(endpoint.url).then((response) => {
      itemEndpointsData.push({ name: endpoint.name, data: response.data });
    });
    itemPromises.push(promise);
  });
  yield Promise.all(itemPromises);
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
  Object.entries(mergedItems).forEach((_0) => __async(void 0, [_0], function* ([key, item]) {
    var _a;
    if (item.description) {
      mergedItems[key].description = sanitizeText(item);
    }
    if (item.icon) {
      let iconName = ((_a = item.icon.split("/").pop()) == null ? void 0 : _a.split(".")[0]) || "";
      if (iconName && iconName.length > 0) {
        let base64 = yield downloadImage(
          `data/img/items/${iconName}.webp`,
          item.icon
        );
        mergedItems[key].placeholder = base64;
        mergedItems[key].icon = `data/img/items/${iconName}.webp`;
      }
    }
  }));
  console.info("Writing items data to file...");
  writeItems(latestVersion, mergedItems);
});
var getItems = () => __async(void 0, null, function* () {
  const latestVersion = yield getLatestVersion();
  let endpoints = getEndpoints(items_default, latestVersion);
  if (!existsSync3(`data/${latestVersion}`)) {
    mkdirSync3(`data/${latestVersion}`);
  }
  if (!existsSync3(`data/latest`)) {
    mkdirSync3(`data/latest`);
  }
  yield mergeItems(endpoints, latestVersion);
});

// src/index.ts
var main = () => __async(void 0, null, function* () {
  yield getItems();
  info("Successfully merged items.json\n");
  yield getChampions();
  info("Successfully merged champions.json\n");
  info("Successfully generated custom files.");
});
main();
