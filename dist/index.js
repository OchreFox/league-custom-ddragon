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

// src/utils/downloadImages.ts
async function downloadImage(filename, url) {
  if (!filename || !url) {
    console.warn("No filename or url specified");
    return "";
  }
  let placeholder = "";
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
function getCommunityDragonItemData(endpointData) {
  let { data } = endpointData;
  data.map((item) => {
    let CDragonIconPath = item.iconPath.split("Icons2D/")[1].toLowerCase();
    item.icon = "https://raw.communitydragon.org/latest/game/assets/items/icons2d/" + CDragonIconPath;
  });
  let mergedItems = _3.keyBy(data, "id");
  fs.writeFileSync("data/mergedItems.json", JSON.stringify(mergedItems));
  return mergedItems;
}
function getMerakiItemData(endpointData, mergedItems) {
  let { data } = endpointData;
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
    "active",
    "rank"
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
function getBlitzItemData(endpoint, mergedItems) {
  let { data } = endpoint.data;
  Object.entries(data).forEach(([key, itemData]) => {
    let maps = itemData.maps?.map(Number) ?? [];
    mergedItems[key] = {
      ...mergedItems[key],
      maps
    };
  });
  const validMapIds = [11, 12];
  let validItemIds = [];
  Object.entries(data).forEach(([key, itemData]) => {
    if (itemData.maps.some((mapId) => validMapIds.includes(Number(mapId)))) {
      validItemIds.push(key);
    }
  });
  let filteredItems = {};
  validItemIds.forEach((itemId) => {
    filteredItems[itemId] = mergedItems[itemId];
  });
  return filteredItems;
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
  to: [],
  maps: [],
  maxStacks: 0,
  name: "",
  nicknames: [],
  placeholder: "",
  requiredChampion: "" /* Empty */,
  simpleDescription: "",
  stats: {},
  type: [],
  active: false,
  rank: []
};

// src/parsers/items.ts
import "dotenv/config";

// endpoints/items.json
var items_default = [
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
  },
  {
    name: "Blitz",
    baseUrl: "https://blitz-cdn-plain.blitz.gg/blitz/ddragon/",
    resource: "/data/en_US/items.json",
    needsLatest: true
  }
];

// src/utils/extractTags.ts
import { writeFileSync as writeFileSync2 } from "fs";
var extractTags = (itemData) => {
  let tags = [];
  Object.entries(itemData).forEach(([key, value]) => {
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

// src/utils/wikiTemplateHelpers.ts
import { writeFileSync as writeFileSync3 } from "fs";

// src/utils/wikiTemplates.ts
var tooltipData = [
  {
    name: "Acquisition radius",
    type: "General",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/1/1e/Acquisition_range.png"
  },
  {
    name: "Adaptive damage",
    type: "General",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/0/07/Attack_damage.png"
  },
  {
    name: "Adaptive force",
    type: "General",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/b/bd/Adaptive_Force_icon.png"
  },
  {
    name: "Attached",
    type: "General",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/b/b2/Yuumi_You_and_Me%21.png"
  },
  {
    name: "Bandit",
    type: "General",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/7/70/Bandit_mastery_2016.png"
  },
  {
    name: "Basic attack",
    type: "General"
  },
  {
    name: "Basic attack reset",
    type: "General",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/f/f4/Fiora_Bladework.png"
  },
  {
    name: "Blink",
    type: "General",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/7/74/Flash.png"
  },
  {
    name: "Block",
    type: "General",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/0/0a/Shen_Spirit%27s_Refuge.png"
  },
  {
    name: "Brittle",
    type: "General",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/c/c3/Brittle_icon.png"
  },
  {
    name: "Cc-immune",
    type: "General",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/b/b1/Cc-immune_icon.png"
  },
  {
    name: "Centered range",
    alias: "cr",
    type: "General",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/c/cf/Range_center.png"
  },
  {
    name: "Champion",
    type: "General",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/2/25/Champion_icon.png"
  },
  {
    name: "Channel",
    type: "General",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/b/bb/Channeling_icon.png"
  },
  {
    name: "Cleanse",
    type: "General",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/3/3e/Gangplank_Remove_Scurvy.png"
  },
  {
    name: "Complete crowd control",
    type: "General",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/5/5f/Suppression_icon.png"
  },
  {
    name: "Critical strike",
    type: "General",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/4/41/Critical_strike_icon.png"
  },
  {
    name: "Crowd control",
    type: "General",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/9/9d/Stun_icon.png"
  },
  {
    name: "Dash",
    type: "General",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/5/55/Dash.png"
  },
  {
    name: "Death",
    type: "General",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/c/c3/Death.png"
  },
  {
    name: "Disarming crowd control",
    type: "General",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/e/ed/Disarm_icon.png"
  },
  {
    name: "Dispel",
    type: "General",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/7/79/Anivia_Rebirth.png"
  },
  {
    name: "Dodge",
    type: "General",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/6/62/Jax_Counter_Strike_old.png"
  },
  {
    name: "Drain",
    type: "General",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/2/24/Ravenous_Hunter_rune.png"
  },
  {
    name: "Edge range",
    alias: "er",
    type: "General",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/7/71/Range_model.png"
  },
  {
    name: "Energized",
    type: "General",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/d/d1/Kircheis_Shard_item.png"
  },
  {
    name: "Energy",
    type: "General",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/e/ea/Energy_resource.png"
  },
  {
    name: "Execute",
    type: "General",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/1/19/Pyke_Death_from_Below.png"
  },
  {
    name: "Forced action",
    type: "General",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/e/ea/Forced_action_icons.png"
  },
  {
    name: "Fury",
    type: "General",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/d/d7/Fury_resource.png"
  },
  {
    name: "Gameplay radius",
    type: "General",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/4/48/Gameplay_radius.png"
  },
  {
    name: "Ghosted",
    type: "General",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/a/ab/Ghost.png"
  },
  {
    name: "Grievous wounds",
    type: "General",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/b/bf/Grievous_Wounds_icon.png"
  },
  {
    name: "Health resource",
    type: "General",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/1/15/Health_resource.png"
  },
  {
    name: "Immobilize",
    alias: "Impaired",
    type: "General",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/9/9d/Stun_icon.png"
  },
  {
    name: "Interrupt",
    type: "General",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/4/49/Silence_icon.png"
  },
  {
    name: "Invulnerability",
    type: "General",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/4/49/Taric_Cosmic_Radiance.png"
  },
  {
    name: "Lockout",
    type: "General",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/7/72/Lockout_icon_2.png"
  },
  {
    name: "Lunge",
    type: "General",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/e/ec/Udyr_Bear_Stance.png"
  },
  {
    name: "Manaless",
    type: "General",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/c/cd/Manaless_resource.png"
  },
  {
    name: "Mutilator",
    type: "General",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/2/26/Mutilator.png"
  },
  {
    name: "Omnivamp",
    type: "General",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/a/a7/Omnivamp_colored_icon.png"
  },
  {
    name: "Pathing radius",
    type: "General",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/7/7b/Pathing_radius.png"
  },
  {
    name: "Poison",
    type: "General",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/8/84/Poison_icon.png"
  },
  {
    name: "Projectile",
    type: "General",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/6/6b/Projectile.png"
  },
  {
    name: "Resurrection",
    type: "General",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/7/7c/Revival_icon.png"
  },
  {
    name: "Selection radius",
    type: "General",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/4/4a/Selection_radius.png"
  },
  {
    name: "Spell shield",
    type: "General",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/a/a0/Sivir_Spell_Shield.png"
  },
  {
    name: "Stasis",
    type: "General",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/e/e2/Stasis_icon.png"
  },
  {
    name: "Takedown",
    type: "General",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/0/07/Damage_rating.png"
  },
  {
    name: "Tenacity",
    type: "General",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/3/33/Tenacity_icon.png"
  },
  {
    name: "Displacement immunity",
    type: "General",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/4/42/Unstoppable_icon.png"
  },
  {
    name: "Uncancellable windup",
    type: "General",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/5/5b/Vi_Relentless_Force_2.png"
  },
  {
    name: "Untargetable",
    type: "General",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/4/41/Untargetable_icon.png"
  },
  {
    name: "Vanish",
    type: "General",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/6/65/Shaco_Hallucinate.png"
  },
  {
    name: "Dragon locked",
    type: "General",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/0/06/Locked_Dragon_buff.png"
  },
  {
    name: "Zombie state",
    type: "General",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/b/b9/Zombie_icon.png"
  },
  {
    name: "Brush",
    alias: "Bush",
    type: "Vision and Wards",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/e/ef/Ivern_Brushmaker.png"
  },
  {
    name: "Sight",
    type: "Vision and Wards",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/0/0e/Sight_icon.png"
  },
  {
    name: "Unobstructed vision",
    type: "Vision and Wards",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/b/b5/Stealth_Ward_icon.png"
  },
  {
    name: "True sight",
    type: "Vision and Wards",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/1/18/True_Sight_icon.png"
  },
  {
    name: "Exposed",
    alias: "Expose",
    type: "Vision and Wards",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/2/2b/Exposed_icon.png"
  },
  {
    name: "Disabled ward",
    type: "Vision and Wards",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/c/c3/Disabled_Ward_icon.png"
  },
  {
    name: "Control ward",
    type: "Vision and Wards",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/9/95/Control_Ward_icon.png"
  },
  {
    name: "Farsight ward",
    type: "Vision and Wards",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/2/29/Farsight_Ward_icon.png"
  },
  {
    name: "Siege ward",
    type: "Vision and Wards",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/4/46/Totem_Ward_icon.png"
  },
  {
    name: "Stealth ward",
    type: "Vision and Wards",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/b/b5/Stealth_Ward_icon.png"
  },
  {
    name: "Sweeper drone",
    type: "Vision and Wards",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/d/db/Sweeper_Drone_icon.png"
  },
  {
    name: "Totem ward",
    type: "Vision and Wards",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/4/46/Totem_Ward_icon.png"
  },
  {
    name: "Zombie ward",
    type: "Vision and Wards",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/2/29/Farsight_Ward_icon.png"
  },
  {
    name: "Ghost poro",
    type: "Vision and Wards",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/4/46/Totem_Ward_icon.png"
  },
  {
    name: "Ward rubble",
    type: "Vision and Wards",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/6/69/Ward_Rubble_icon.png"
  },
  {
    name: "Stealth",
    type: "Vision and Wards",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/3/3a/Teemo_Guerrilla_Warfare.png"
  },
  {
    name: "Camouflage",
    type: "Vision and Wards",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/3/32/Twitch_Ambush_2.png"
  },
  {
    name: "Invisibility",
    type: "Vision and Wards",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/3/34/Akali_Twilight_Shroud_old2.png"
  },
  {
    name: "Obscured vision",
    type: "Vision and Wards",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/d/db/Sweeper_Drone_icon.png"
  },
  {
    name: "Stealthed trap",
    type: "Vision and Wards",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/5/5e/Teemo_Noxious_Trap.png"
  },
  {
    name: "Unit-targeted",
    type: "Targeting paradigms",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/c/ca/Jax_Leap_Strike.png"
  },
  {
    name: "Direction-targeted",
    type: "Targeting paradigms",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/4/43/Brand_Sear.png"
  },
  {
    name: "Ground-targeted",
    type: "Targeting paradigms",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/c/c3/Xerath_Eye_of_Destruction.png"
  },
  {
    name: "Auto-targeted",
    type: "Targeting paradigms",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/2/20/Kennen_Electrical_Surge.png"
  },
  {
    name: "Aura",
    type: "Targeting paradigms",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/8/8d/Sona_Aria_of_Perseverance.png"
  },
  {
    name: "Krugs",
    type: "Jungle & Minions",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/f/fe/Ancient_KrugSquare.png"
  },
  {
    name: "Murk wolves",
    type: "Jungle & Minions",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/d/d6/Greater_Murk_WolfSquare.png"
  },
  {
    name: "Raptors",
    alias: "chickens",
    type: "Jungle & Minions",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/9/94/Crimson_RaptorSquare.png"
  },
  {
    name: "Golems",
    type: "Jungle & Minions",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/f/fb/Ancient_Golem_Icon_profileicon.jpg/revision/latest/scale-to-width-down/20?cb=20221125202548png"
  },
  {
    name: "Wraiths",
    type: "Jungle & Minions",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/4/44/Wraith_Icon_profileicon.jpg/revision/latest/scale-to-width-down/20?cb=20221125215430png"
  },
  {
    name: "Wolves",
    type: "Jungle & Minions",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/c/c6/Level_Two_Critter_Icon_profileicon.jpg/revision/latest/scale-to-width-down/20?cb=20221125215315png"
  },
  {
    name: "Impatience",
    type: "Jungle & Minions",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/d/de/Frenzy_mastery_2013.png"
  },
  {
    name: "Minion",
    type: "Jungle & Minions",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/3/30/Minion_icon.png"
  },
  {
    name: "Monster",
    type: "Jungle & Minions",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/d/d1/Monster_icon.png"
  },
  {
    name: "Pet",
    type: "Pets and other unit types",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/9/92/Annie_Summon-_Tibbers.png"
  },
  {
    name: "Clone",
    type: "Pets and other unit types",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/d/d7/Shaco_Command-_Hallucinate.png"
  },
  {
    name: "Effigy",
    type: "Pets and other unit types",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/4/46/Totem_Ward_icon.png"
  },
  {
    name: "Turret",
    type: "Turret",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/8/82/Turret_icon.png"
  },
  {
    name: "Nexus obelisk",
    type: "Turret",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/d/d2/Nexus_Obelisk.png"
  },
  {
    name: "Penetrating bullets",
    type: "Turret",
    icon: "https://static.wikia.nocookie.net/leagueoflegends/images/7/7c/Penetrating_Bullets.png"
  }
];

// src/utils/wikiTemplateHelpers.ts
var extractWikiTemplates = (text) => {
  const templateRegex = /{{(.*?)}}/g;
  let templates = [];
  let match;
  while ((match = templateRegex.exec(text)) !== null) {
    let template = match[1];
    template = template.split("|")[0];
    templates.push(template);
  }
  return templates;
};
var extractAllTemplates = (itemData) => {
  let allTemplates = [];
  Object.values(itemData).forEach((item) => {
    if (item.passives && item.passives.length > 0) {
      item.passives.forEach((passive) => {
        if (passive.effects) {
          allTemplates.push(...extractWikiTemplates(passive.effects));
        }
      });
    }
    if (item.active && Array.isArray(item.active) && item.active.length > 0) {
      item.active.forEach((actv) => {
        if (actv.effects) {
          allTemplates.push(...extractWikiTemplates(actv.effects));
        }
      });
    }
  });
  return Array.from(new Set(allTemplates));
};
var downloadTooltipImages = async (tooltips) => {
  createDirectory("data/img/tooltips");
  let tooltipIconPromises = [];
  tooltips.forEach((tooltip) => {
    if (tooltip.icon) {
      const snakeCaseName = tooltip.name.replace(/ /g, "_").toLowerCase();
      let promise = downloadImage(
        `data/img/tooltips/${snakeCaseName}.png`,
        tooltip.icon
      ).then(() => {
        console.log("Downloaded icon for tooltip " + tooltip.name);
      }).catch((error) => {
        console.error(
          `Error downloading icon for tooltip ${tooltip.name}: ${error}`
        );
      });
      tooltipIconPromises.push(promise);
    } else {
      console.log(`No icon for tooltip ${tooltip.name}, skipping...`);
    }
  });
  await Promise.all(tooltipIconPromises);
};
var saveTooltipData = (tooltips) => {
  let tooltipData2 = JSON.stringify(tooltips, null, 2);
  const path2 = "data/tooltips.json";
  writeFileSync3(path2, tooltipData2);
  console.log(`Tooltip data saved to ${path2}`);
};
var saveTooltips = () => {
  downloadTooltipImages(tooltipData);
  let newTooltipData = tooltipData.map((tooltip) => {
    const snakeCaseName = tooltip.name.replace(/ /g, "_").toLowerCase();
    if (tooltip.icon) {
      return {
        ...tooltip,
        icon: `data/img/tooltips/${snakeCaseName}.png`
      };
    }
    return tooltip;
  });
  saveTooltipData(newTooltipData);
  console.log("Successfully downloaded and saved tooltip images.");
};

// src/parsers/items.ts
import { writeFileSync as writeFileSync4 } from "fs";
var axiosOptions = {
  headers: {
    "Accept-Encoding": "identity"
  }
};
var fetchItems = async (endpoint) => {
  console.log(`Fetching ${endpoint.name} items...`);
  try {
    const response = await axios4.get(endpoint.url, axiosOptions);
    console.log(`Fetched ${endpoint.name} items`);
    return { name: endpoint.name, data: response.data };
  } catch (error) {
    throw new Error(`Error fetching ${endpoint.name} items: ${error}`);
  }
};
var batchDownloadItemIcons = async (items, allowedTags, pascalCaseTags) => {
  let itemIconPromises = [];
  Object.entries(items).forEach(([key, item]) => {
    if (item.description) {
      items[key].description = sanitizeText(item, allowedTags, pascalCaseTags);
    }
    if (item.icon) {
      let iconName = item.icon.split("/").pop()?.split(".")[0] ?? "";
      if (iconName && iconName.length > 0) {
        let promise = downloadImage(
          `data/img/items/${iconName}.webp`,
          item.icon
        ).then((placeholder) => {
          items[key].icon = `data/img/items/${iconName}.webp`;
          items[key].placeholder = placeholder;
          console.log("Downloaded icon for item " + items[key].name);
        }).catch((error) => {
          console.error(
            `Error downloading icon for item ${item.name}: ${error}`
          );
        });
        itemIconPromises.push(promise);
      }
    }
  });
  await Promise.all(itemIconPromises);
};
var mergeItems = async (endpoints, latestVersion) => {
  let fetchedItemData = [];
  let itemPromises = [];
  endpoints.forEach((endpoint) => {
    let promise = fetchItems(endpoint).then((data) => {
      fetchedItemData.push(data);
    }).catch((error) => {
      console.error(error);
    });
    itemPromises.push(promise);
  });
  await Promise.all(itemPromises);
  let mergedItems = {};
  let cdItems;
  let allowedTags = [];
  cdItems = getCommunityDragonItemData(
    fetchedItemData.find(
      (data) => data.name === "CommunityDragon"
    )
  );
  allowedTags = extractTags(cdItems);
  Object.assign(mergedItems, cdItems);
  mergedItems = getBlitzItemData(
    fetchedItemData.find((data) => data.name === "Blitz"),
    mergedItems
  );
  mergedItems = getMerakiItemData(
    fetchedItemData.find(
      (data) => data.name === "MerakiAnalytics"
    ),
    mergedItems
  );
  mergedItems = _4.mapValues(mergedItems, (item) => {
    return _4.defaults(item, defaultValues);
  });
  console.log(`Merged ${Object.keys(mergedItems).length} items`);
  const wikiTemplates = extractAllTemplates(mergedItems);
  console.log(`Extracted ${wikiTemplates.length} wiki templates`);
  writeFileSync4("data/wikiTemplates.json", JSON.stringify(wikiTemplates));
  const pascalCaseTags = allowedTags.map((tag) => toPascalCase(tag));
  createDirectory("data/img/champions", true);
  createDirectory("data/img/items", true);
  let batchSize = 50;
  let batchedItemIcons = _4.chunk(Object.entries(mergedItems), batchSize);
  for (let batch of batchedItemIcons) {
    console.info("Downloading item icons batch...");
    await batchDownloadItemIcons(
      _4.fromPairs(batch),
      allowedTags,
      pascalCaseTags
    );
  }
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
  saveTooltips();
  info("Successfully downloaded tooltip data.\n");
  await getItems();
  info("Successfully merged items.json\n");
  await getChampions();
  info("Successfully merged champions.json\n");
  info("Successfully generated custom files.");
};
main();
//# sourceMappingURL=index.js.map