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
  MerakiStatExtended,
  MerakiStats,
  MerakiTag,
  Passive,
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

function getCamelCaseStats(stats: MerakiStats) {
  let camelCaseStats: MerakiStats = camelcaseKeys(stats, { deep: true });
  // Loop trough each of the stats and filter out entries with value 0
  return _(camelCaseStats)
    .pickBy(_.isObject)
    .mapValues((stat) => _.pickBy(stat, _.identity))
    .omitBy(_.isEmpty)
    .value() as MerakiStats;
}

function filterStats(stats: MerakiStats | MerakiStats[]) {
  if (Array.isArray(stats)) {
    return getCamelCaseStats(stats[0]);
  } else {
    return getCamelCaseStats(stats);
  }
}

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
      // Check if in any of the passives the mythic property is set to true
      let mythic = _.some(passives, (passive) => {
        return passive.mythic;
      });
      if (mythic) {
        // Overwrite the mythic property in the item (because this data is more accurate)
        filteredItem.mythic = true;
      } else {
        filteredItem.mythic = false;
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

const test = () => {
  let passives: Passive[] = [
    {
      unique: true,
      mythic: false,
      name: null,
      effects:
        "This item gains {{as|20 '''bonus''' health}}, {{as|20 '''bonus''' mana}}, and {{as|4 ability power}} every minute, up to 10 times, for a maximum of {{as|200 '''bonus''' health}}, {{as|200 '''bonus''' mana}}, and {{as|40 ability power}}. Upon reaching maximum stacks, gain a level that preserves your current experience (cap remains at level 18) and increase all effects of ''Eternity'' by 50%.",
      range: null,
      stats: {
        abilityPower: {
          flat: 4.0,
          percent: 0.0,
          perLevel: 0.0,
          percentPerLevel: 0.0,
          percentBase: 0.0,
          percentBonus: 0.0,
        },
        armor: {
          flat: 0.0,
          percent: 0.0,
          perLevel: 0.0,
          percentPerLevel: 0.0,
          percentBase: 0.0,
          percentBonus: 0.0,
        },
        armorPenetration: {
          flat: 0.0,
          percent: 0.0,
          perLevel: 0.0,
          percentPerLevel: 0.0,
          percentBase: 0.0,
          percentBonus: 0.0,
        },
        attackDamage: [
          {
            flat: 0.0,
            percent: 0.0,
            perLevel: 0.0,
            percentPerLevel: 0.0,
            percentBase: 0.0,
            percentBonus: 0.0,
          },
        ],
        attackSpeed: {
          flat: 0.0,
          percent: 0.0,
          perLevel: 0.0,
          percentPerLevel: 0.0,
          percentBase: 0.0,
          percentBonus: 0.0,
        },
        cooldownReduction: {
          flat: 0.0,
          percent: 0.0,
          perLevel: 0.0,
          percentPerLevel: 0.0,
          percentBase: 0.0,
          percentBonus: 0.0,
        },
        criticalStrikeChance: {
          flat: 0.0,
          percent: 0.0,
          perLevel: 0.0,
          percentPerLevel: 0.0,
          percentBase: 0.0,
          percentBonus: 0.0,
        },
        goldPer_10: {
          flat: 0.0,
          percent: 0.0,
          perLevel: 0.0,
          percentPerLevel: 0.0,
          percentBase: 0.0,
          percentBonus: 0.0,
        },
        healAndShieldPower: {
          flat: 0.0,
          percent: 0.0,
          perLevel: 0.0,
          percentPerLevel: 0.0,
          percentBase: 0.0,
          percentBonus: 0.0,
        },
        health: {
          flat: 0.0,
          percent: 0.0,
          perLevel: 0.0,
          percentPerLevel: 0.0,
          percentBase: 0.0,
          percentBonus: 0.0,
        },
        healthRegen: {
          flat: 0.0,
          percent: 0.0,
          perLevel: 0.0,
          percentPerLevel: 0.0,
          percentBase: 0.0,
          percentBonus: 0.0,
        },
        lethality: {
          flat: 0.0,
          percent: 0.0,
          perLevel: 0.0,
          percentPerLevel: 0.0,
          percentBase: 0.0,
          percentBonus: 0.0,
        },
        lifesteal: {
          flat: 0.0,
          percent: 0.0,
          perLevel: 0.0,
          percentPerLevel: 0.0,
          percentBase: 0.0,
          percentBonus: 0.0,
        },
        magicPenetration: {
          flat: 0.0,
          percent: 0.0,
          perLevel: 0.0,
          percentPerLevel: 0.0,
          percentBase: 0.0,
          percentBonus: 0.0,
        },
        magicResistance: {
          flat: 0.0,
          percent: 0.0,
          perLevel: 0.0,
          percentPerLevel: 0.0,
          percentBase: 0.0,
          percentBonus: 0.0,
        },
        mana: {
          flat: 0.0,
          percent: 0.0,
          perLevel: 0.0,
          percentPerLevel: 0.0,
          percentBase: 0.0,
          percentBonus: 0.0,
        },
        manaRegen: {
          flat: 0.0,
          percent: 0.0,
          perLevel: 0.0,
          percentPerLevel: 0.0,
          percentBase: 0.0,
          percentBonus: 0.0,
        },
        movespeed: 0.0,
        abilityHaste: {
          flat: 0.0,
          percent: 0.0,
          perLevel: 0.0,
          percentPerLevel: 0.0,
          percentBase: 0.0,
          percentBonus: 0.0,
        },
        omnivamp: {
          flat: 0.0,
          percent: 0.0,
          perLevel: 0.0,
          percentPerLevel: 0.0,
          percentBase: 0.0,
          percentBonus: 0.0,
        },
        tenacity: {
          flat: 0.0,
          percent: 0.0,
          perLevel: 0.0,
          percentPerLevel: 0.0,
          percentBase: 0.0,
          percentBonus: 0.0,
        },
      },
    },
    {
      unique: true,
      mythic: false,
      name: "Eternity",
      effects:
        "Restore {{as|mana}} equal to 8% of {{tt|pre-mitigation damage|Damage calculated before modifiers}} taken from champions, and {{tip|heal}} for an amount equal to {{as|20% of mana spent}}, up to 15 per cast. Toggled abilities can only heal for up to 15 per second. For every 250 healing or {{as|mana}} restored this way, gain {{as|25% '''bonus''' movement speed}} that decays over 2 seconds.",
      range: null,
      stats: {
        abilityPower: {
          flat: 0.0,
          percent: 0.0,
          perLevel: 0.0,
          percentPerLevel: 0.0,
          percentBase: 0.0,
          percentBonus: 0.0,
        },
        armor: {
          flat: 0.0,
          percent: 0.0,
          perLevel: 0.0,
          percentPerLevel: 0.0,
          percentBase: 0.0,
          percentBonus: 0.0,
        },
        armorPenetration: {
          flat: 0.0,
          percent: 0.0,
          perLevel: 0.0,
          percentPerLevel: 0.0,
          percentBase: 0.0,
          percentBonus: 0.0,
        },
        attackDamage: [
          {
            flat: 0.0,
            percent: 0.0,
            perLevel: 0.0,
            percentPerLevel: 0.0,
            percentBase: 0.0,
            percentBonus: 0.0,
          },
        ],
        attackSpeed: {
          flat: 0.0,
          percent: 0.0,
          perLevel: 0.0,
          percentPerLevel: 0.0,
          percentBase: 0.0,
          percentBonus: 0.0,
        },
        cooldownReduction: {
          flat: 0.0,
          percent: 0.0,
          perLevel: 0.0,
          percentPerLevel: 0.0,
          percentBase: 0.0,
          percentBonus: 0.0,
        },
        criticalStrikeChance: {
          flat: 0.0,
          percent: 0.0,
          perLevel: 0.0,
          percentPerLevel: 0.0,
          percentBase: 0.0,
          percentBonus: 0.0,
        },
        goldPer_10: {
          flat: 0.0,
          percent: 0.0,
          perLevel: 0.0,
          percentPerLevel: 0.0,
          percentBase: 0.0,
          percentBonus: 0.0,
        },
        healAndShieldPower: {
          flat: 0.0,
          percent: 0.0,
          perLevel: 0.0,
          percentPerLevel: 0.0,
          percentBase: 0.0,
          percentBonus: 0.0,
        },
        health: {
          flat: 0.0,
          percent: 0.0,
          perLevel: 0.0,
          percentPerLevel: 0.0,
          percentBase: 0.0,
          percentBonus: 0.0,
        },
        healthRegen: {
          flat: 0.0,
          percent: 0.0,
          perLevel: 0.0,
          percentPerLevel: 0.0,
          percentBase: 0.0,
          percentBonus: 0.0,
        },
        lethality: {
          flat: 0.0,
          percent: 0.0,
          perLevel: 0.0,
          percentPerLevel: 0.0,
          percentBase: 0.0,
          percentBonus: 0.0,
        },
        lifesteal: {
          flat: 0.0,
          percent: 0.0,
          perLevel: 0.0,
          percentPerLevel: 0.0,
          percentBase: 0.0,
          percentBonus: 0.0,
        },
        magicPenetration: {
          flat: 0.0,
          percent: 0.0,
          perLevel: 0.0,
          percentPerLevel: 0.0,
          percentBase: 0.0,
          percentBonus: 0.0,
        },
        magicResistance: {
          flat: 0.0,
          percent: 0.0,
          perLevel: 0.0,
          percentPerLevel: 0.0,
          percentBase: 0.0,
          percentBonus: 0.0,
        },
        mana: {
          flat: 0.0,
          percent: 0.0,
          perLevel: 0.0,
          percentPerLevel: 0.0,
          percentBase: 0.0,
          percentBonus: 0.0,
        },
        manaRegen: {
          flat: 0.0,
          percent: 0.0,
          perLevel: 0.0,
          percentPerLevel: 0.0,
          percentBase: 0.0,
          percentBonus: 0.0,
        },
        movespeed: 0.0,
        abilityHaste: {
          flat: 0.0,
          percent: 0.0,
          perLevel: 0.0,
          percentPerLevel: 0.0,
          percentBase: 0.0,
          percentBonus: 0.0,
        },
        omnivamp: {
          flat: 0.0,
          percent: 0.0,
          perLevel: 0.0,
          percentPerLevel: 0.0,
          percentBase: 0.0,
          percentBonus: 0.0,
        },
        tenacity: {
          flat: 0.0,
          percent: 0.0,
          perLevel: 0.0,
          percentPerLevel: 0.0,
          percentBase: 0.0,
          percentBonus: 0.0,
        },
      },
    },
    {
      unique: true,
      mythic: true,
      name: "Mythic",
      effects: null,
      range: 0,
      stats: {
        abilityPower: {
          flat: 0.0,
          percent: 0.0,
          perLevel: 0.0,
          percentPerLevel: 0.0,
          percentBase: 0.0,
          percentBonus: 0.0,
        },
        armor: {
          flat: 0.0,
          percent: 0.0,
          perLevel: 0.0,
          percentPerLevel: 0.0,
          percentBase: 0.0,
          percentBonus: 0.0,
        },
        armorPenetration: {
          flat: 0.0,
          percent: 0.0,
          perLevel: 0.0,
          percentPerLevel: 0.0,
          percentBase: 0.0,
          percentBonus: 0.0,
        },
        attackDamage: {
          flat: 0.0,
          percent: 0.0,
          perLevel: 0.0,
          percentPerLevel: 0.0,
          percentBase: 0.0,
          percentBonus: 0.0,
        },
        attackSpeed: {
          flat: 0.0,
          percent: 0.0,
          perLevel: 0.0,
          percentPerLevel: 0.0,
          percentBase: 0.0,
          percentBonus: 0.0,
        },
        cooldownReduction: {
          flat: 0.0,
          percent: 0.0,
          perLevel: 0.0,
          percentPerLevel: 0.0,
          percentBase: 0.0,
          percentBonus: 0.0,
        },
        criticalStrikeChance: {
          flat: 0.0,
          percent: 0.0,
          perLevel: 0.0,
          percentPerLevel: 0.0,
          percentBase: 0.0,
          percentBonus: 0.0,
        },
        goldPer_10: {
          flat: 0.0,
          percent: 0.0,
          perLevel: 0.0,
          percentPerLevel: 0.0,
          percentBase: 0.0,
          percentBonus: 0.0,
        },
        healAndShieldPower: {
          flat: 0.0,
          percent: 0.0,
          perLevel: 0.0,
          percentPerLevel: 0.0,
          percentBase: 0.0,
          percentBonus: 0.0,
        },
        health: {
          flat: 0.0,
          percent: 0.0,
          perLevel: 0.0,
          percentPerLevel: 0.0,
          percentBase: 0.0,
          percentBonus: 0.0,
        },
        healthRegen: {
          flat: 0.0,
          percent: 0.0,
          perLevel: 0.0,
          percentPerLevel: 0.0,
          percentBase: 0.0,
          percentBonus: 0.0,
        },
        lethality: {
          flat: 0.0,
          percent: 0.0,
          perLevel: 0.0,
          percentPerLevel: 0.0,
          percentBase: 0.0,
          percentBonus: 0.0,
        },
        lifesteal: {
          flat: 0.0,
          percent: 0.0,
          perLevel: 0.0,
          percentPerLevel: 0.0,
          percentBase: 0.0,
          percentBonus: 0.0,
        },
        magicPenetration: {
          flat: 0.0,
          percent: 0.0,
          perLevel: 0.0,
          percentPerLevel: 0.0,
          percentBase: 0.0,
          percentBonus: 0.0,
        },
        magicResistance: {
          flat: 0.0,
          percent: 0.0,
          perLevel: 0.0,
          percentPerLevel: 0.0,
          percentBase: 0.0,
          percentBonus: 0.0,
        },
        mana: {
          flat: 0.0,
          percent: 0.0,
          perLevel: 0.0,
          percentPerLevel: 0.0,
          percentBase: 0.0,
          percentBonus: 0.0,
        },
        manaRegen: {
          flat: 0.0,
          percent: 0.0,
          perLevel: 0.0,
          percentPerLevel: 0.0,
          percentBase: 0.0,
          percentBonus: 0.0,
        },
        movespeed: {
          flat: 0.0,
          percent: 0.0,
          perLevel: 0.0,
          percentPerLevel: 0.0,
          percentBase: 0.0,
          percentBonus: 0.0,
        },
        abilityHaste: {
          flat: 5.0,
          percent: 0.0,
          perLevel: 0.0,
          percentPerLevel: 0.0,
          percentBase: 0.0,
          percentBonus: 0.0,
        },
        omnivamp: {
          flat: 0.0,
          percent: 0.0,
          perLevel: 0.0,
          percentPerLevel: 0.0,
          percentBase: 0.0,
          percentBonus: 0.0,
        },
        tenacity: {
          flat: 0.0,
          percent: 0.0,
          perLevel: 0.0,
          percentPerLevel: 0.0,
          percentBase: 0.0,
          percentBonus: 0.0,
        },
      },
    },
  ];

  let stats = {
    abilityPower: {
      flat: 0.0,
      percent: 0.0,
      perLevel: 0.0,
      percentPerLevel: 0.0,
      percentBase: 0.0,
      percentBonus: 0.0,
    },
    armor: {
      flat: 0.0,
      percent: 0.0,
      perLevel: 0.0,
      percentPerLevel: 0.0,
      percentBase: 0.0,
      percentBonus: 0.0,
    },
    armorPenetration: {
      flat: 0.0,
      percent: 0.0,
      perLevel: 0.0,
      percentPerLevel: 0.0,
      percentBase: 0.0,
      percentBonus: 0.0,
    },
    attackDamage: {
      flat: 65.0,
      percent: 0.0,
      perLevel: 0.0,
      percentPerLevel: 0.0,
      percentBase: 0.0,
      percentBonus: 0.0,
    },
    attackSpeed: {
      flat: 0.0,
      percent: 0.0,
      perLevel: 0.0,
      percentPerLevel: 0.0,
      percentBase: 0.0,
      percentBonus: 0.0,
    },
    cooldownReduction: {
      flat: 0.0,
      percent: 0.0,
      perLevel: 0.0,
      percentPerLevel: 0.0,
      percentBase: 0.0,
      percentBonus: 0.0,
    },
    criticalStrikeChance: {
      flat: 0.0,
      percent: 0.0,
      perLevel: 0.0,
      percentPerLevel: 0.0,
      percentBase: 0.0,
      percentBonus: 0.0,
    },
    goldPer_10: {
      flat: 0.0,
      percent: 0.0,
      perLevel: 0.0,
      percentPerLevel: 0.0,
      percentBase: 0.0,
      percentBonus: 0.0,
    },
    healAndShieldPower: {
      flat: 0.0,
      percent: 0.0,
      perLevel: 0.0,
      percentPerLevel: 0.0,
      percentBase: 0.0,
      percentBonus: 0.0,
    },
    health: {
      flat: 0.0,
      percent: 0.0,
      perLevel: 0.0,
      percentPerLevel: 0.0,
      percentBase: 0.0,
      percentBonus: 0.0,
    },
    healthRegen: {
      flat: 0.0,
      percent: 0.0,
      perLevel: 0.0,
      percentPerLevel: 0.0,
      percentBase: 0.0,
      percentBonus: 0.0,
    },
    lethality: {
      flat: 0.0,
      percent: 0.0,
      perLevel: 0.0,
      percentPerLevel: 0.0,
      percentBase: 0.0,
      percentBonus: 0.0,
    },
    lifesteal: {
      flat: 0.0,
      percent: 0.0,
      perLevel: 0.0,
      percentPerLevel: 0.0,
      percentBase: 0.0,
      percentBonus: 0.0,
    },
    magicPenetration: {
      flat: 0.0,
      percent: 0.0,
      perLevel: 0.0,
      percentPerLevel: 0.0,
      percentBase: 0.0,
      percentBonus: 0.0,
    },
    magicResistance: {
      flat: 0.0,
      percent: 0.0,
      perLevel: 0.0,
      percentPerLevel: 0.0,
      percentBase: 0.0,
      percentBonus: 0.0,
    },
    mana: {
      flat: 0.0,
      percent: 0.0,
      perLevel: 0.0,
      percentPerLevel: 0.0,
      percentBase: 0.0,
      percentBonus: 0.0,
    },
    manaRegen: {
      flat: 0.0,
      percent: 0.0,
      perLevel: 0.0,
      percentPerLevel: 0.0,
      percentBase: 0.0,
      percentBonus: 0.0,
    },
    movespeed: {
      flat: 0.0,
      percent: 0.0,
      perLevel: 0.0,
      percentPerLevel: 0.0,
      percentBase: 0.0,
      percentBonus: 0.0,
    },
    abilityHaste: {
      flat: 20.0,
      percent: 0.0,
      perLevel: 0.0,
      percentPerLevel: 0.0,
      percentBase: 0.0,
      percentBonus: 0.0,
    },
    omnivamp: {
      flat: 0.0,
      percent: 9.0,
      perLevel: 0.0,
      percentPerLevel: 0.0,
      percentBase: 0.0,
      percentBonus: 0.0,
    },
    tenacity: {
      flat: 0.0,
      percent: 0.0,
      perLevel: 0.0,
      percentPerLevel: 0.0,
      percentBase: 0.0,
      percentBonus: 0.0,
    },
  };

  let newPassives = filterPassives(passives);
  newPassives.forEach((passive) => {
    console.log(passive?.stats);
  });
  console.log("Stats", filterStats(stats));
};

// if (!process.env.GITHUB_ACTIONS || process.env.GITHUB_ACTIONS === "false") {
//   test();
// }
