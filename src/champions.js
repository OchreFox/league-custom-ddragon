import { info, setFailed } from "@actions/core";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import axios from "axios";
import _ from "lodash";
import { getLatestVersion } from "./utils/getLatestVersion.js";
// Load env variables from .env file
import "dotenv/config";
import downloadImage from "./utils/downloadImages.js";

const mergeChampions = async (endpoints, latestVersion) => {
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
    variables: {},
  });
  let mobalyticsConfig = {
    method: "post",
    url: "https://app.mobalytics.gg/api/league/gql/static/v1",
    headers: {
      "Content-Type": "application/json",
    },
    data: queryString,
  };
  let championEndpoints = [];
  let championPromises = [];
  let mobalyticsData = [];
  let mergedChampionData = {};

  // Fetch the champions.json from the endpoints
  endpoints.forEach((endpoint) => {
    let promise = axios.get(endpoint.url).then((response) => {
      championEndpoints.push({ name: endpoint.name, data: response.data });
    });
    championPromises.push(promise);
  });

  await Promise.all(championPromises);
  championPromises = [];

  // Get data from Mobalytics GraphQL API
  let mobalyticsPromise = axios(mobalyticsConfig)
    .then(function (response) {
      mobalyticsData = _.chain(response.data.data.info)
        .flatMap(({ flatData }) => flatData)
        .keyBy("riotSlug")
        .value();

      console.log("Mobalytics data fetched");
    })
    .catch(function (error) {
      console.log(error);
    });

  championPromises.push(mobalyticsPromise);
  await Promise.all(championPromises);

  // Get data from endpoints
  championEndpoints.forEach((endpoint) => {
    if (endpoint.name === "MerakiAnalytics") {
      let data = endpoint.data;
      Object.assign(mergedChampionData, data);
    }
  });

  // Merge mobalytics data with mergedChampionData
  mergedChampionData = _.merge(mergedChampionData, mobalyticsData);

  // Create a copy of the mergedChampionData
  let lightweightChampionData = _.cloneDeep(mergedChampionData);

  Object.keys(lightweightChampionData).forEach((key) => {
    // Delete unneeded keys (abilities, skins, stats, key, slug)
    delete lightweightChampionData[key].abilities;
    delete lightweightChampionData[key].skins;
    delete lightweightChampionData[key].stats;
    delete lightweightChampionData[key].key;
    delete lightweightChampionData[key].slug;

    // Save champion images
    let icon = lightweightChampionData[key].icon;
    let iconName = icon.split("/").pop().split(".")[0];
    if (iconName && iconName.length > 0) {
      downloadImage(`data/img/champions/${iconName}.webp`, icon);
    }
  });

  // Write the merged champions.json file
  // deepcode ignore PT: Wont fix this right away
  writeFileSync(
    `data/${latestVersion}/champions.json`,
    JSON.stringify(mergedChampionData)
  );
  writeFileSync(
    `data/latest/champions.json`,
    JSON.stringify(mergedChampionData)
  );
  // deepcode ignore PT: Wont fix this right away
  writeFileSync(
    `data/${latestVersion}/champions-summary.json`,
    JSON.stringify(lightweightChampionData)
  );
  writeFileSync(
    `data/latest/champions-summary.json`,
    JSON.stringify(lightweightChampionData)
  );
};

// Get the champions.json file from the different endpoints specified in champions.json
// Return the custom merged champions.json file
export const getChampions = async () => {
  // Read the champions.json configuration file
  const championsConfig = JSON.parse(readFileSync("endpoints/champions.json"));
  const latestVersion = await getLatestVersion();
  let endpoints = [];
  // Create an endpoints array from the configuration file
  championsConfig.forEach((endpoint) => {
    console.log("Fetching champions.json from " + endpoint.name);
    const url = `${endpoint.baseUrl}${
      endpoint.needsLatest ? latestVersion : ""
    }${endpoint.resource}`;
    endpoints.push({ name: endpoint.name, url: url });
    console.log(endpoint.name + " champions URL: " + url);
  });
  // Create a folder in /data if it doesn't exist for the latest version
  if (!existsSync(`data/${latestVersion}`)) {
    mkdirSync(`data/${latestVersion}`);
  }
  // Create the folder latest in /data if it doesn't exist
  if (!existsSync(`data/latest`)) {
    mkdirSync(`data/latest`);
  }
  await mergeChampions(endpoints, latestVersion);
};

const main = async () => {
  try {
    await getChampions();
    info("Successfully merged champions.json");
  } catch (error) {
    setFailed(error.message);
  }
};

// Only run main if running locally
if (process.env.GITHUB_ACTIONS !== "true") {
  main();
}
