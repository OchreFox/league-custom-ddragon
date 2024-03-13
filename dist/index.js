// src/index.ts
import { info } from "@actions/core";

// src/parsers/champions.ts
import { writeFileSync, existsSync as existsSync2, mkdirSync as mkdirSync2 } from "fs";
import axios3 from "axios";
import _ from "lodash";
import "dotenv/config";

// src/utils/downloadImages.ts
import sharp from "sharp";
import axios from "axios";
import { encode } from "blurhash";

// src/utils/blurhashDataURL.ts
import { decodeBlurHash } from "fast-blurhash";

// src/utils/endpointUtils.ts
import { existsSync, mkdirSync, readFileSync } from "fs";
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
var createDirectory = (path2, recursive = false) => {
  if (!existsSync(path2)) {
    mkdirSync(path2, { recursive });
  }
};

// src/utils/downloadImages.ts
async function downloadImage(filename, url) {
  if (!filename || !url) {
    console.warn("No filename or url specified");
    return "";
  }
  let placeholder = "";
  createDirectory("data/img/champions", true);
  createDirectory("data/img/items", true);
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

// src/parsers/champions.ts
var mergeChampions = async (endpoints, latestVersion) => {
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
      let iconName = icon.split("/").pop()?.split(".")[0] || "";
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

// src/utils/sanitizeText.ts
import _2 from "lodash";
import DOMPurify from "isomorphic-dompurify";
import { XMLParser, XMLBuilder } from "fast-xml-parser";
var toPascalCase = (str) => {
  return str.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join("");
};
function sanitizeText(item, allowedTags, pascalCaseTags) {
  if (!item)
    return "";
  let text = item.description;
  if (!text) {
    console.warn(`Item ${item.name} has no description`);
    return "";
  }
  let sanitizedText = DOMPurify.sanitize(text, {
    ALLOWED_TAGS: allowedTags,
    FORBID_TAGS: ["br", "attention", "{{", "{%", "{", "}", "%}", "}}"],
    SAFE_FOR_TEMPLATES: false,
    ALLOW_DATA_ATTR: true,
    KEEP_CONTENT: true
    // Preserve content between tags
  });
  pascalCaseTags.forEach((tag) => {
    sanitizedText = sanitizedText.replace(
      new RegExp(`<${tag.toLowerCase()}>`, "g"),
      `<${tag}>`
    );
    sanitizedText = sanitizedText.replace(
      new RegExp(`</${tag.toLowerCase()}>`, "g"),
      `</${tag}>`
    );
  });
  const parser = new XMLParser({
    preserveOrder: true
  });
  const xml = parser.parse(sanitizedText);
  if (xml.mainText?.stats) {
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

// src/schemas/meraki-item-zod-schema.ts
import { z } from "zod";
var ItemRank = /* @__PURE__ */ ((ItemRank2) => {
  ItemRank2["Basic"] = "BASIC";
  ItemRank2["Boots"] = "BOOTS";
  ItemRank2["Consumable"] = "CONSUMABLE";
  ItemRank2["Distributed"] = "DISTRIBUTED";
  ItemRank2["Epic"] = "EPIC";
  ItemRank2["Legendary"] = "LEGENDARY";
  ItemRank2["Minion"] = "MINION";
  ItemRank2["Potion"] = "POTION";
  ItemRank2["Starter"] = "STARTER";
  ItemRank2["Trinket"] = "TRINKET";
  ItemRank2["Turret"] = "TURRET";
  return ItemRank2;
})(ItemRank || {});
var ItemTag = /* @__PURE__ */ ((ItemTag2) => {
  ItemTag2["AbilityPower"] = "ABILITY_POWER";
  ItemTag2["ArmorPen"] = "ARMOR_PEN";
  ItemTag2["Assassin"] = "ASSASSIN";
  ItemTag2["AttackDamage"] = "ATTACK_DAMAGE";
  ItemTag2["AttackSpeed"] = "ATTACK_SPEED";
  ItemTag2["Fighter"] = "FIGHTER";
  ItemTag2["HealthAndReg"] = "HEALTH_AND_REG";
  ItemTag2["LifestealVamp"] = "LIFESTEAL_VAMP";
  ItemTag2["Mage"] = "MAGE";
  ItemTag2["MagicPen"] = "MAGIC_PEN";
  ItemTag2["ManaAndReg"] = "MANA_AND_REG";
  ItemTag2["Marksman"] = "MARKSMAN";
  ItemTag2["Movement"] = "MOVEMENT";
  ItemTag2["OnhitEffects"] = "ONHIT_EFFECTS";
  ItemTag2["Support"] = "SUPPORT";
  ItemTag2["Tank"] = "TANK";
  return ItemTag2;
})(ItemTag || {});
var activeSchema = z.object({
  unique: z.boolean(),
  name: z.string().nullable(),
  effects: z.string(),
  range: z.number().nullable(),
  cooldown: z.null()
});
var itemStatsSchema = z.object({
  flat: z.number(),
  percent: z.number(),
  perLevel: z.number().optional(),
  percentPerLevel: z.number().optional(),
  percentBase: z.number().optional(),
  percentBonus: z.number().optional()
});
var rankSchema = z.nativeEnum(ItemRank);
var pricesSchema = z.object({
  total: z.number(),
  combined: z.number(),
  sell: z.number()
});
var tagSchema = z.nativeEnum(ItemTag);
var merakiItemStatsSchema = z.object({
  abilityPower: itemStatsSchema.optional(),
  armor: itemStatsSchema,
  armorPenetration: itemStatsSchema.optional(),
  attackDamage: itemStatsSchema.optional(),
  attackSpeed: itemStatsSchema.optional(),
  cooldownReduction: itemStatsSchema.optional(),
  criticalStrikeChance: itemStatsSchema.optional(),
  goldPer10: itemStatsSchema.optional(),
  healAndShieldPower: itemStatsSchema.optional(),
  health: itemStatsSchema,
  healthRegen: itemStatsSchema.optional(),
  lethality: itemStatsSchema,
  lifesteal: itemStatsSchema,
  magicPenetration: itemStatsSchema.optional(),
  magicResistance: itemStatsSchema.optional(),
  mana: itemStatsSchema,
  manaRegen: itemStatsSchema.optional(),
  movespeed: itemStatsSchema,
  abilityHaste: itemStatsSchema.optional(),
  omnivamp: itemStatsSchema,
  tenacity: itemStatsSchema
});
var shopSchema = z.object({
  prices: pricesSchema,
  purchasable: z.boolean(),
  tags: z.array(tagSchema)
});
var passiveSchema = z.object({
  unique: z.boolean(),
  mythic: z.boolean().optional(),
  name: z.string().nullable(),
  effects: z.string(),
  range: z.number().nullable(),
  cooldown: z.string().nullable(),
  stats: merakiItemStatsSchema
});
var merakiItemSchema = z.object({
  name: z.string(),
  id: z.number(),
  tier: z.number(),
  rank: z.array(rankSchema),
  buildsFrom: z.array(z.number()).optional(),
  buildsInto: z.array(z.number()).optional(),
  specialRecipe: z.number().optional(),
  noEffects: z.boolean().optional(),
  removed: z.boolean(),
  requiredChampion: z.string().optional(),
  requiredAlly: z.string().optional(),
  icon: z.string(),
  simpleDescription: z.string().optional().nullable(),
  nicknames: z.array(z.string()),
  passives: z.array(passiveSchema),
  active: z.array(activeSchema),
  stats: merakiItemStatsSchema,
  shop: shopSchema,
  iconOverlay: z.boolean()
});

// src/utils/itemUtils.ts
function writeItems(latestVersion, mergedItems) {
  let rootPath = "data/";
  let latestVersionPath = path.join(rootPath, latestVersion, "/items.json");
  latestVersionPath = path.normalize(latestVersionPath);
  fs.writeFileSync(latestVersionPath, JSON.stringify(mergedItems));
  fs.writeFileSync(`data/latest/items.json`, JSON.stringify(mergedItems));
}
function filterPassives(passives) {
  return passives.map((passive) => {
    let filteredStats = filterStats(passive.stats);
    if (filteredStats) {
      passive.stats = filteredStats;
    }
    return passive;
  });
}
function filterStats(stats) {
  return _3.mapValues(stats, (value) => {
    if (value) {
      return _3.pickBy(value, (value2) => {
        return value2 !== 0;
      });
    }
  });
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
    let CDragonIconPath = item.iconPath.split("Icons2D/")[1].toLowerCase();
    if (mergedItems[key]) {
      mergedItems[key].icon = "https://raw.communitydragon.org/latest/game/assets/items/icons2d/" + CDragonIconPath;
      mergedItems[key] = { ...mergedItems[key], ...filteredItem };
    } else {
      console.log("Item " + key + " not found in mergedItems");
    }
  });
  fs.writeFileSync("data/mergedItems.json", JSON.stringify(mergedItems));
  return mergedItems;
}
function getMerakiItemData(endpointData, mergedItems) {
  let { data } = endpointData;
  Object.entries(data).forEach(([key, item]) => {
    item.passives.forEach((passive) => {
      delete passive.mythic;
    });
  });
  let merakiItemData = camelcaseKeys(data, { deep: true });
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
  fs.writeFileSync("data/meraki.json", JSON.stringify(merakiItemData));
  const requiredKeysMeraki = [
    "iconOverlay",
    "nicknames",
    "requiredChampion",
    "simpleDescription",
    "stats",
    "passives",
    "active"
  ];
  Object.entries(merakiItemData).forEach(([itemKey, itemValues]) => {
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
    mergedItems[itemKey] = {
      ...mergedItems[itemKey],
      ...filteredItem,
      classes
    };
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
      } else if (propKey === "stats") {
        delete data[key]["stats"];
      }
    });
  });
  const validMapIds = [11, 12];
  let validItemIds = [];
  Object.entries(data).forEach(([key, itemData]) => {
    if (itemData.maps.some((mapId) => validMapIds.includes(mapId))) {
      validItemIds.push(key);
    }
  });
  let blitzData = {};
  validItemIds.forEach((key) => {
    blitzData[key] = data[key];
  });
  fs.writeFileSync("data/blitz.json", JSON.stringify(blitzData));
  return blitzData;
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
  name: "",
  nicknames: [],
  placeholder: "",
  requiredChampion: "" /* Empty */,
  simpleDescription: "",
  stats: {},
  tier: 0,
  type: []
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

// src/utils/extractTags.ts
import { writeFileSync as writeFileSync2 } from "fs";
var extractTags = (blitzItemData) => {
  let tags = [];
  Object.entries(blitzItemData).forEach(([key, value]) => {
    if (value.description) {
      const description = value.description;
      const regex = /<([a-zA-Z]+)>/g;
      let match;
      while ((match = regex.exec(description)) !== null) {
        tags.push(match[1]);
      }
    }
  });
  tags = [...new Set(tags)];
  const forbiddenTags = ["br", "attention"];
  tags = tags.filter((tag) => !forbiddenTags.includes(tag));
  tags.sort((a, b) => a.localeCompare(b));
  writeFileSync2("data/tags.json", JSON.stringify(tags));
  console.log("Tags extracted and saved to data/tags.json");
  return tags;
};

// src/parsers/items.ts
var mergeItems = async (endpoints, latestVersion) => {
  let fetchedItemData = [];
  let itemPromises = [];
  endpoints.forEach((endpoint) => {
    console.log(`Fetching ${endpoint.name} items...`);
    let promise = axios4.get(endpoint.url, {
      headers: {
        "Accept-Encoding": "identity"
      }
    }).then((response) => {
      console.log(`Fetched ${endpoint.name} items`);
      fetchedItemData.push({ name: endpoint.name, data: response.data });
    });
    itemPromises.push(promise);
  });
  await Promise.all(itemPromises);
  let mergedItems = {};
  let blitzItems;
  let allowedTags = [];
  fetchedItemData.forEach((endpointData) => {
    switch (endpointData.name) {
      case "Blitz":
        blitzItems = getBlitzItemData(endpointData);
        allowedTags = extractTags(blitzItems);
        Object.assign(mergedItems, blitzItems);
        break;
      case "MerakiAnalytics":
        mergedItems = getMerakiItemData(endpointData, mergedItems);
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
  const pascalCaseTags = allowedTags.map((tag) => toPascalCase(tag));
  let itemIconPromises = [];
  Object.entries(mergedItems).forEach(([key, item]) => {
    if (item.description) {
      mergedItems[key].description = sanitizeText(
        item,
        allowedTags,
        pascalCaseTags
      );
    }
    let iconName = item.icon.split("/").pop()?.split(".")[0] ?? "";
    if (iconName && iconName.length > 0) {
      let promise = downloadImage(`data/img/items/${iconName}.webp`, item.icon).then((placeholder) => {
        mergedItems[key].icon = `data/img/items/${iconName}.webp`;
        mergedItems[key].placeholder = placeholder;
        console.log("Downloaded icon for item " + mergedItems[key].name);
      }).catch((error) => {
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
var getItems = async () => {
  const latestVersion = await getLatestVersion();
  let endpoints = getEndpoints(items_default, latestVersion);
  console.log("Endpoints: ", endpoints);
  createDirectory(`data/${latestVersion}`);
  createDirectory("data/latest");
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