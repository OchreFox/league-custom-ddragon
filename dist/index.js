import {info as $bdjGp$info, setFailed as $bdjGp$setFailed} from "@actions/core";
import $bdjGp$axios from "axios";
import $bdjGp$lodash from "lodash";
import $bdjGp$fs, {existsSync as $bdjGp$existsSync, mkdirSync as $bdjGp$mkdirSync, writeFileSync as $bdjGp$writeFileSync} from "fs";
import "dotenv/config";
import {Buffer as $bdjGp$Buffer} from "buffer";
import $bdjGp$dompurify from "dompurify";
import {JSDOM as $bdjGp$JSDOM} from "jsdom";
import {XMLParser as $bdjGp$XMLParser, XMLBuilder as $bdjGp$XMLBuilder} from "fast-xml-parser";
import $bdjGp$path from "path";
import $bdjGp$sharp from "sharp";
import {getPlaiceholder as $bdjGp$getPlaiceholder} from "plaiceholder";






/**
 * Gets the latest version of DDragon from https://ddragon.leagueoflegends.com/api/versions.json
 * @returns {string} The latest version of the game.
 */ const $a072fe81d980d88c$var$getLatestVersion = async ()=>{
    const response = await (0, $bdjGp$axios).get("https://ddragon.leagueoflegends.com/api/versions.json");
    let latestVersion = response.data[0]; // Sanitize latest version, only accept numbers and dots
    latestVersion = latestVersion.replace(/[^0-9.]/g, "");
    return latestVersion;
};
const $a072fe81d980d88c$export$892e128ba377ffbb = $a072fe81d980d88c$var$getLatestVersion;






/**
 * Function to convert a string from camel case or snake case to pascal case
 * @param {string} str - The string to convert to PascalCase.
 */ const $7dc28d40dab20735$var$toPascalCase = (str)=>{
    return str.split("_").map((word)=>word.charAt(0).toUpperCase() + word.slice(1)).join("");
};
const $7dc28d40dab20735$export$ba2133a82fa5e0a1 = (item)=>{
    if (!item) return "";
    let text = item.description;
    if (!text) return;
     // Remove curly braces from API placeholders
    text = text.replaceAll("{", "");
    text = text.replaceAll("}", "");
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
        "TrueDamage"
    ]; // Sanitize text with dompurify
    const window = new (0, $bdjGp$JSDOM)("").window;
    const DOMPurify = (0, $bdjGp$dompurify)(window);
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
        FORBID_TAGS: [
            "br"
        ]
    }); // Replace all lowercase words inside the sanitizedText with the camelCaseTags version
    pascalCaseTags.forEach((tag)=>{
        const lowercaseTag = tag.toLowerCase(); // Replace lowercase tag with tag
        sanitizedText = (0, $bdjGp$lodash).replace(sanitizedText, new RegExp(lowercaseTag, "g"), tag);
    }); // Parse with fast-xml-parser
    const parser = new (0, $bdjGp$XMLParser)({
        preserveOrder: true
    });
    const xml = parser.parse(sanitizedText); // Remove stats from the xml object
    if (xml.mainText?.stats) for(let key in xml.mainText.stats)delete xml.mainText.stats[key];
     // Convert xml object to XML string
    const builder = new (0, $bdjGp$XMLBuilder)({
        preserveOrder: true
    });
    let xmlString = builder.build(xml); // Add stats between <Stats> tag and </Stats> tag
    xmlString = $7dc28d40dab20735$export$27eae5098e402097(xmlString, item);
    xmlString = $7dc28d40dab20735$export$fc7b52e25005f66c(xmlString); // Replace in xmlString:
    // Add a whitespace (' ') before a less than character ('<') if the preceding character is a letter (a-z, A-Z) or a colon (':')
    const lessThanRegex = /([a-zA-Z,:])</g;
    xmlString = xmlString.replace(lessThanRegex, "$1 <");
    return xmlString;
};
function $7dc28d40dab20735$export$27eae5098e402097(xmlString, item) {
    const statsRegex = /<Stats>(.*?)<\/Stats>/g;
    const statsMatch = xmlString.match(statsRegex);
    if (statsMatch) {
        const statsTag = statsMatch[0];
        let statsString = ""; // Create the stats string with the stats of the item
        if (item.stats) Object.entries(item.stats).forEach((_ref)=>{
            let [keyItem, value] = _ref;
            Object.entries(value).forEach((_ref2)=>{
                let [key2, value2] = _ref2;
                let statName = $7dc28d40dab20735$var$toPascalCase(key2) + $7dc28d40dab20735$var$toPascalCase(keyItem);
                statsString += `<Stat name="${statName}">${value2}${key2.includes("percent") ? "%" : ""}</Stat>`;
            });
        });
        const statText = `<Stats>${statsString}</Stats>`;
        xmlString = (0, $bdjGp$lodash).replace(xmlString, statsTag, statText);
    }
    return xmlString;
}
function $7dc28d40dab20735$export$fc7b52e25005f66c(xmlString) {
    const activeRegex = /<Active>(.*?)<\/Active>/g;
    const activeMatch = xmlString.match(activeRegex);
    let skipNext = false;
    if (activeMatch) // Loop through each match
    for (const match of activeMatch){
        // If skipNext is set to true, skip the next match
        if (skipNext === true) {
            skipNext = false; // Delete the match from the xmlString
            xmlString = (0, $bdjGp$lodash).replace(xmlString, match, "");
            continue;
        } // Get the content of the match
        const tagContent = match.replace(/<\/?Active>/g, ""); // Check if the content is "Active -"
        if (tagContent === "Active -") {
            // Replace the match with the "Active - " and the content of the next match
            const nextTagContent = activeMatch[activeMatch.indexOf(match) + 1].replace(/<\/?Active>/g, "").trim();
            xmlString = (0, $bdjGp$lodash).replace(xmlString, match, `<Active>Active - ${nextTagContent}</Active>`); // Skip the next match
            skipNext = true;
        }
    }
    return xmlString;
}





const $af5ed0ae26f181df$export$b70dcce1c70696bf = (str)=>{
    return str.replace(/(_\w)/g, (m)=>m[1].toUpperCase());
};
function $af5ed0ae26f181df$export$f72109ef0e0decb6(latestVersion, mergedItems) {
    // Write the merged items.json file in the latestVersion folder "./data/" + latestVersion + "/items.json";
    let rootPath = "data/";
    let latestVersionPath = (0, $bdjGp$path).join(rootPath, latestVersion, "/items.json"); // Sanitize path to avoid directory traversal
    latestVersionPath = (0, $bdjGp$path).normalize(latestVersionPath); // deepcode ignore PT: Wont fix this right away
    (0, $bdjGp$fs).writeFileSync(latestVersionPath, JSON.stringify(mergedItems)); // Also save a copy in the latest folder
    (0, $bdjGp$fs).writeFileSync(`data/latest/items.json`, JSON.stringify(mergedItems));
}
function $af5ed0ae26f181df$export$729599aafc1e0529(endpoint, mergedItems) {
    let requiredKeysCD = [
        "categories",
        "inStore",
        "maxStacks"
    ];
    endpoint.data.forEach((item)=>{
        const key = item.id;
        let filteredItem = (0, $bdjGp$lodash).pick(item, requiredKeysCD); // Append the filteredItem to the mergedItems in the corresponding key
        mergedItems[key] = {
            ...mergedItems[key],
            ...filteredItem
        };
    });
}
function $af5ed0ae26f181df$export$565bf946232721c0(values, requiredKeysMeraki, admittedClasses, itemEndpoints) {
    let filteredItem = (0, $bdjGp$lodash).pick(values, requiredKeysMeraki); // Get an array of champion classes from nested object property
    let classes = (0, $bdjGp$lodash).get(values, "shop.tags");
    if (classes.length > 0) classes = (0, $bdjGp$lodash).filter(classes, (className)=>admittedClasses.includes(className));
     // Remove empty keys from stats to reduce the size of the json file
    let stats = (0, $bdjGp$lodash).get(values, "stats");
    if (stats) Object.entries(stats).forEach((stat)=>{
        const [key2, value2] = stat; // Convert key2 from snake case to camel case
        const camelCaseKey2 = $af5ed0ae26f181df$export$b70dcce1c70696bf(key2); // Replace key2
        if (key2 !== camelCaseKey2) {
            Object.defineProperty(stats, camelCaseKey2, Object.getOwnPropertyDescriptor(stats, key2));
            delete stats[key2];
        }
        Object.entries(value2).forEach((stat2)=>{
            const [key3, value3] = stat2;
            if (value3 === 0) delete values["stats"][camelCaseKey2][key3];
        });
    });
     // Validate that the icon is a valid URL
    if (!filteredItem.icon || filteredItem.icon && !filteredItem.icon.startsWith("http")) {
        // Get item from CommunityDragon endpoint data
        let CDragonIconPath = (0, $bdjGp$lodash).chain(itemEndpoints).find({
            name: "CommunityDragon"
        }).get("data").find({
            id: values.id
        }).get("iconPath").value();
        if (CDragonIconPath) {
            // Strip text after Icons2d/ from the icon path
            CDragonIconPath = CDragonIconPath.split("Icons2D/")[1].toLowerCase(); // Set fallback icon if the icon is not a valid URL
            filteredItem.icon = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/items/icons2d/" + CDragonIconPath;
            console.warn(`Item ${values.name}-${values.id} has an invalid icon URL, using fallback icon`);
        }
    }
    return {
        filteredItem: filteredItem,
        classes: classes
    };
}
function $af5ed0ae26f181df$export$da5df5ff3aa425bd(endpoint) {
    let data = endpoint.data.data; // Parse numbers
    Object.entries(data).forEach((entry)=>{
        const [key, value] = entry;
        Object.entries(value).forEach((item)=>{
            const [key2, value2] = item;
            if (key2 === "id") data[key][key2] = parseInt(value2);
            else if ((key2 === "maps" || key2 === "from" || key2 === "into") && value2 !== null) data[key][key2] = value2.map(Number);
            else if (key2 === "depth") // Delete the depth key
            delete data[key]["depth"];
            else if (key2 === "stats") // Delete stats from blitzEndpoint
            delete data[key]["stats"];
        });
    });
    return data;
}


const $88da1d261a291d79$export$95b538874120021a = [
    "icon",
    "iconOverlay",
    "nicknames",
    "requiredChampion",
    "simpleDescription",
    "tier",
    "stats"
];
const $88da1d261a291d79$export$3297c962ec624a01 = [
    "MAGE",
    "SUPPORT",
    "TANK",
    "FIGHTER",
    "MARKSMAN",
    "ASSASSIN"
]; // Set default values for required keys
const $88da1d261a291d79$export$7e292eecf5a8f340 = {
    categories: [],
    classes: [],
    description: null,
    from: [],
    gold: {
        base: 0,
        purchasable: false,
        total: 0,
        sell: 0
    },
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






/**
 * &gt;&gt;&gt; downloadImage("data/img/items/image.png", "http://www.example.com/image.png")
 * @param {string} filename - The path of the file to be downloaded. Include the subfolder for champion or items
 * @param {string} url - The URL path to the image you want to download.
 * @returns {Promise<string>} Base64 placeholder string.
 */ async function $d6326052a6c66b69$var$downloadImage(filename, url) {
    if (!filename || !url) {
        console.warn("No filename or url specified");
        return;
    }
    let placeholder = ""; // Create folders
    if (!(0, $bdjGp$existsSync)("data/img/champions")) (0, $bdjGp$mkdirSync)("data/img/champions", {
        recursive: true
    });
    if (!(0, $bdjGp$existsSync)("data/img/items")) (0, $bdjGp$mkdirSync)("data/img/items", {
        recursive: true
    });
    await (0, $bdjGp$axios).get(url, {
        responseType: "arraybuffer"
    }).then(async (axiosResponse)=>{
        console.log("Saving image " + filename);
        await (0, $bdjGp$sharp)(axiosResponse.data).toFile(filename).then(async ()=>{
            await (0, $bdjGp$getPlaiceholder)(axiosResponse.data).then((_ref)=>{
                let { base64: base64  } = _ref;
                return placeholder = base64;
            }).catch((error)=>console.error(error));
        }).catch((err)=>{
            console.error(err);
        });
    }).catch((err)=>console.error(err));
    return placeholder;
}
var $d6326052a6c66b69$export$2e2bcd8739ae039 // test
 // eslint-disable-next-line no-unused-vars
 // const test = async () => {
 //   let res = await downloadImage(
 //     "data/img/champions/Aatrox.png",
 //     "https://ddragon.leagueoflegends.com/cdn/12.13.1/img/champion/Aatrox.png"
 //   );
 //   console.log("Base64: " + res);
 // };
 = $d6326052a6c66b69$var$downloadImage;




var $76373db6f8f9b572$require$Buffer = $bdjGp$Buffer;
const $76373db6f8f9b572$var$mergeItems = async (endpoints, latestVersion)=>{
    // Create a new array to store the items.json files
    let itemEndpoints = [];
    let itemPromises = [];
    endpoints.forEach((endpoint)=>{
        let promise = (0, $bdjGp$axios).get(endpoint.url).then((response)=>{
            itemEndpoints.push({
                name: endpoint.name,
                data: response.data
            });
        });
        itemPromises.push(promise);
    });
    await Promise.all(itemPromises);
    let mergedItems = {};
    itemEndpoints.forEach((endpoint)=>{
        switch(endpoint.name){
            case "Blitz":
                Object.assign(mergedItems, (0, $af5ed0ae26f181df$export$da5df5ff3aa425bd)(endpoint));
                break;
            case "MerakiAnalytics":
                Object.entries(endpoint.data).forEach((item)=>{
                    const key = item[0];
                    const values = item[1];
                    let { filteredItem: filteredItem , classes: classes  } = (0, $af5ed0ae26f181df$export$565bf946232721c0)(values, (0, $88da1d261a291d79$export$95b538874120021a), (0, $88da1d261a291d79$export$3297c962ec624a01), itemEndpoints); // Append the filteredItem and the classes to the mergedItems in the corresponding key
                    mergedItems[key] = {
                        ...mergedItems[key],
                        ...filteredItem,
                        classes: classes
                    };
                });
                break;
            case "CommunityDragon":
                (0, $af5ed0ae26f181df$export$729599aafc1e0529)(endpoint, mergedItems);
                break;
        }
    }); // Merge the default values with every item in mergedItems
    mergedItems = (0, $bdjGp$lodash).mapValues(mergedItems, (item)=>{
        return (0, $bdjGp$lodash).defaults(item, (0, $88da1d261a291d79$export$7e292eecf5a8f340));
    });
    console.log(`Merged ${Object.keys(mergedItems).length} items`); // Sanitize item description for each item in mergedItems
    for (const [key1, value] of Object.entries(mergedItems)){
        let description = value.description;
        if (description) {
            console.log("Sanitizing text for item description");
            description = (0, $7dc28d40dab20735$export$ba2133a82fa5e0a1)(value);
            mergedItems[key1].description = description;
        }
        if (value.icon) {
            let iconName = value.icon.split("/").pop().split(".")[0] || "";
            if (iconName && iconName.length > 0) {
                let base64 = await (0, $d6326052a6c66b69$export$2e2bcd8739ae039)(`data/img/items/${iconName}.webp`, value.icon);
                mergedItems[key1].placeholder = base64;
                mergedItems[key1].icon = `data/img/items/${iconName}.webp`;
            }
        }
    }
    console.info("Writing items data to file...");
    (0, $af5ed0ae26f181df$export$f72109ef0e0decb6)(latestVersion, mergedItems);
}; // Get the items.json file from the different endpoints specified in items.json
const $76373db6f8f9b572$export$d2f92acf417bbf5d = async ()=>{
    // Read the items.json configuration file
    const itemsConfig = JSON.parse($76373db6f8f9b572$require$Buffer.from("WwogIHsKICAgICJuYW1lIjogIkJsaXR6IiwKICAgICJiYXNlVXJsIjogImh0dHBzOi8vYmxpdHotY2RuLXBsYWluLmJsaXR6LmdnL2JsaXR6L2RkcmFnb24vIiwKICAgICJyZXNvdXJjZSI6ICIvZGF0YS9lbl9VUy9pdGVtcy5qc29uIiwKICAgICJuZWVkc0xhdGVzdCI6IHRydWUKICB9LAogIHsKICAgICJuYW1lIjogIk1lcmFraUFuYWx5dGljcyIsCiAgICAiYmFzZVVybCI6ICJodHRwczovL2Nkbi5tZXJha2lhbmFseXRpY3MuY29tL3Jpb3QvbG9sL3Jlc291cmNlcy9sYXRlc3QiLAogICAgInJlc291cmNlIjogIi9lbi1VUy9pdGVtcy5qc29uIiwKICAgICJuZWVkc0xhdGVzdCI6IGZhbHNlCiAgfSwKICB7CiAgICAibmFtZSI6ICJDb21tdW5pdHlEcmFnb24iLAogICAgImJhc2VVcmwiOiAiaHR0cHM6Ly9yYXcuY29tbXVuaXR5ZHJhZ29uLm9yZy9sYXRlc3QiLAogICAgInJlc291cmNlIjogIi9wbHVnaW5zL3JjcC1iZS1sb2wtZ2FtZS1kYXRhL2dsb2JhbC9kZWZhdWx0L3YxL2l0ZW1zLmpzb24iLAogICAgIm5lZWRzTGF0ZXN0IjogZmFsc2UKICB9Cl0K", "base64")); // Fetch the latest version of DDragon
    const latestVersion = await (0, $a072fe81d980d88c$export$892e128ba377ffbb)();
    let endpoints = []; // Fetch the items.json from the itemsConfig
    itemsConfig.forEach((endpoint)=>{
        console.log("Fetching items.json from " + endpoint.name);
        const url = `${endpoint.baseUrl}${endpoint.needsLatest ? latestVersion : ""}${endpoint.resource}`;
        endpoints.push({
            name: endpoint.name,
            url: url
        });
        console.log(endpoint.name + " items URL: " + url);
    }); // Create a folder in /data if it doesn't exist for the latest version
    if (!(0, $bdjGp$existsSync)(`data/${latestVersion}`)) (0, $bdjGp$mkdirSync)(`data/${latestVersion}`);
     // Create the folder latest in /data if it doesn't exist
    if (!(0, $bdjGp$existsSync)(`data/latest`)) (0, $bdjGp$mkdirSync)(`data/latest`);
    await $76373db6f8f9b572$var$mergeItems(endpoints, latestVersion);
}; // const main = async () => {
 //   try {
 //     await getItems();
 //     info("Successfully merged items.json");
 //   } catch (error) {
 //     setFailed(error.message);
 //     console.log("Error: " + error.message);
 //   }
 // };
 // // Only run main if running locally
 // if (process.env.GITHUB_ACTIONS !== "true") {
 //   main();
 // }










var $81027238ae25e8be$require$Buffer = $bdjGp$Buffer;
const $81027238ae25e8be$var$mergeChampions = async (endpoints, latestVersion)=>{
    const queryString = JSON.stringify({
        query: `query ChampionsInfo{
      info: queryChampionsV1Contents(top:0){
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
    });
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
    let mergedChampionData = {}; // Fetch the champions.json from the endpoints
    endpoints.forEach((endpoint)=>{
        let promise = (0, $bdjGp$axios).get(endpoint.url).then((response)=>{
            championEndpoints.push({
                name: endpoint.name,
                data: response.data
            });
        });
        championPromises.push(promise);
    });
    await Promise.all(championPromises);
    championPromises = []; // Get data from Mobalytics GraphQL API
    let mobalyticsPromise = (0, $bdjGp$axios)(mobalyticsConfig).then(function(response) {
        mobalyticsData = (0, $bdjGp$lodash).chain(response.data.data.info).flatMap((_ref)=>{
            let { flatData: flatData  } = _ref;
            return flatData;
        }).keyBy("riotSlug").value();
        console.log("Mobalytics data fetched");
    }).catch(function(error) {
        console.log(error);
    });
    championPromises.push(mobalyticsPromise);
    await Promise.all(championPromises); // Get data from endpoints
    championEndpoints.forEach((endpoint)=>{
        if (endpoint.name === "MerakiAnalytics") {
            let data = endpoint.data;
            Object.assign(mergedChampionData, data);
        }
    }); // Merge mobalytics data with mergedChampionData
    mergedChampionData = (0, $bdjGp$lodash).merge(mergedChampionData, mobalyticsData);
    for (const key1 of Object.keys(mergedChampionData)){
        // Save champion images
        let icon = mergedChampionData[key1].icon;
        if (icon) {
            let iconName = icon.split("/").pop().split(".")[0] || "";
            if (iconName && iconName.length > 0) {
                // deepcode ignore PrototypePollution: won't fix
                mergedChampionData[key1].placeholder = await (0, $d6326052a6c66b69$export$2e2bcd8739ae039)(`data/img/champions/${iconName}.webp`, icon); // deepcode ignore PrototypePollution: won't fix
                mergedChampionData[key1].icon = `data/img/champions/${iconName}.webp`;
            }
        }
    } // Create a copy of the mergedChampionData
    let lightweightChampionData = (0, $bdjGp$lodash).cloneDeep(mergedChampionData);
    Object.keys(lightweightChampionData).forEach((key)=>{
        // Delete unneeded keys (abilities, skins, stats, key, slug)
        delete lightweightChampionData[key].abilities;
        delete lightweightChampionData[key].skins;
        delete lightweightChampionData[key].stats;
        delete lightweightChampionData[key].key;
        delete lightweightChampionData[key].slug;
    });
    console.info("Writing champions data to file..."); // Write the merged champions.json file
    // deepcode ignore PT: Wont fix this right away
    (0, $bdjGp$writeFileSync)(`data/${latestVersion}/champions.json`, JSON.stringify(mergedChampionData));
    (0, $bdjGp$writeFileSync)(`data/latest/champions.json`, JSON.stringify(mergedChampionData)); // deepcode ignore PT: Wont fix this right away
    (0, $bdjGp$writeFileSync)(`data/${latestVersion}/champions-summary.json`, JSON.stringify(lightweightChampionData));
    (0, $bdjGp$writeFileSync)(`data/latest/champions-summary.json`, JSON.stringify(lightweightChampionData));
}; // Get the champions.json file from the different endpoints specified in champions.json
const $81027238ae25e8be$export$35cb4d67758a4ff5 = async ()=>{
    // Read the champions.json configuration file
    const championsConfig = JSON.parse($81027238ae25e8be$require$Buffer.from("WwogIHsKICAgICJuYW1lIjogIk1lcmFraUFuYWx5dGljcyIsCiAgICAiYmFzZVVybCI6ICJodHRwOi8vY2RuLm1lcmFraWFuYWx5dGljcy5jb20vcmlvdC9sb2wvcmVzb3VyY2VzL2xhdGVzdCIsCiAgICAicmVzb3VyY2UiOiAiL2VuLVVTL2NoYW1waW9ucy5qc29uIiwKICAgICJuZWVkc0xhdGVzdCI6IGZhbHNlCiAgfQpdCg==", "base64"));
    const latestVersion = await (0, $a072fe81d980d88c$export$892e128ba377ffbb)();
    let endpoints = []; // Create an endpoints array from the configuration file
    championsConfig.forEach((endpoint)=>{
        console.log("Fetching champions.json from " + endpoint.name);
        const url = `${endpoint.baseUrl}${endpoint.needsLatest ? latestVersion : ""}${endpoint.resource}`;
        endpoints.push({
            name: endpoint.name,
            url: url
        });
        console.log(endpoint.name + " champions URL: " + url);
    }); // Create a folder in /data if it doesn't exist for the latest version
    if (!(0, $bdjGp$existsSync)(`data/${latestVersion}`)) (0, $bdjGp$mkdirSync)(`data/${latestVersion}`);
     // Create the folder latest in /data if it doesn't exist
    if (!(0, $bdjGp$existsSync)(`data/latest`)) (0, $bdjGp$mkdirSync)(`data/latest`);
    await $81027238ae25e8be$var$mergeChampions(endpoints, latestVersion);
}; // const main = async () => {
 //   try {
 //     await getChampions();
 //     info("Successfully merged champions.json");
 //   } catch (error) {
 //     setFailed(error.message);
 //   }
 // };
 // // Only run main if running locally
 // if (process.env.GITHUB_ACTIONS !== "true") {
 //   main();
 // }


const $747425b437e121da$var$main = async ()=>{
    try {
        await (0, $76373db6f8f9b572$export$d2f92acf417bbf5d)();
        (0, $bdjGp$info)("Successfully merged items.json\n");
        await (0, $81027238ae25e8be$export$35cb4d67758a4ff5)();
        (0, $bdjGp$info)("Successfully merged champions.json\n");
        (0, $bdjGp$info)("Successfully generated custom files.");
    } catch (error) {
        (0, $bdjGp$setFailed)(error.message);
    }
};
$747425b437e121da$var$main();


//# sourceMappingURL=index.js.map
