import { writeFileSync, existsSync, mkdirSync } from "fs";
import axios from "axios";
import _ from "lodash";
// Load env variables from .env file
import "dotenv/config";
import { downloadImage } from "src/utils/downloadImages.js";
import { getLatestVersion } from "src/utils/getLatestVersion.js";
import championsConfig from "endpoints/champions.json";

import {
  Endpoint,
  EndpointChampionData,
  EndpointNames,
} from "src/types/global.js";

import { queryString } from "src/utils/championQuery.js";
import { MergedChampionDataObject } from "src/types/champions.js";
import { getEndpoints, readJsonFile } from "../utils/endpointUtils.js";

const mergeChampions = async (endpoints: Endpoint[], latestVersion: string) => {
  let mobalyticsConfig = {
    method: "post",
    url: "https://app.mobalytics.gg/api/league/gql/static/v1",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Accept-Encoding": "identity",
    },
    data: queryString,
  };
  let championEndpoints: EndpointChampionData[] = [];
  let championPromises: Promise<void>[] = [];
  let mobalyticsData: _.Dictionary<any> = [];
  let mergedChampionData: MergedChampionDataObject = {};

  // Fetch the champions.json from the endpoints
  endpoints.forEach((endpoint) => {
    let promise = axios
      .get(endpoint.url, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "Accept-Encoding": "identity",
        },
      })
      .then((response) => {
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
    if (endpoint.name === EndpointNames.MerakiAnalytics) {
      let data = endpoint.data;
      Object.assign(mergedChampionData, data);
    }
  });

  // Merge mobalytics data with mergedChampionData
  mergedChampionData = _.merge(mergedChampionData, mobalyticsData);

  for (const key of Object.keys(mergedChampionData)) {
    // Save champion images
    let icon = mergedChampionData[key].icon;
    if (icon) {
      let iconName = icon.split("/").pop()?.split(".")[0] || "";
      if (iconName && iconName.length > 0) {
        // deepcode ignore PrototypePollution: won't fix
        mergedChampionData[key].placeholder = await downloadImage(
          `data/img/champions/${iconName}.webp`,
          icon
        );
        // deepcode ignore PrototypePollution: won't fix
        mergedChampionData[key].icon = `data/img/champions/${iconName}.webp`;
      }
    }
  }

  // Create a copy of the mergedChampionData
  let lightweightChampionData = _.cloneDeep(mergedChampionData);

  Object.keys(lightweightChampionData).forEach((key) => {
    // Delete unneeded keys (abilities, skins, stats, key, slug)
    delete lightweightChampionData[key].abilities;
    delete lightweightChampionData[key].skins;
    delete lightweightChampionData[key].stats;
    delete lightweightChampionData[key].key;
    delete lightweightChampionData[key].slug;
  });

  console.info("Writing champions data to file...");

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
export async function getChampions() {
  const latestVersion = await getLatestVersion();
  // const championsConfig = readJsonFile("endpoints/champions.json");
  let endpoints: Endpoint[] = getEndpoints(championsConfig, latestVersion);
  // Create a folder in /data if it doesn't exist for the latest version
  if (!existsSync(`data/${latestVersion}`)) {
    mkdirSync(`data/${latestVersion}`);
  }
  // Create the folder latest in /data if it doesn't exist
  if (!existsSync(`data/latest`)) {
    mkdirSync(`data/latest`);
  }
  await mergeChampions(endpoints, latestVersion);
}

// const main = async () => {
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
