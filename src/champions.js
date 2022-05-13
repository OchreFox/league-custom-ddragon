const core = require("@actions/core");
const fs = require("fs");
const axios = require("axios");
var _ = require("lodash");
const { getLatestVersion } = require("./getLatestVersion");

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
  var mobalyticsConfig = {
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

  // Create a lightweight champions.json version
  let lightweightChampionData = {};
  Object.assign(lightweightChampionData, mergedChampionData);
  Object.keys(lightweightChampionData).map((key) => {
    let champion = mergedChampionData[key];
    // Delete unneeded keys
    delete champion.abilities;
    delete champion.skins;
    delete champion.stats;
    delete champion.key;
    delete champion.riotSlug;
  });

  // Write the merged champions.json file
  // deepcode ignore PT: Wont fix this right away
  fs.writeFileSync(
    `data/${latestVersion}/champions.json`,
    JSON.stringify(mergedChampionData)
  );
  fs.writeFileSync(
    `data/latest/champions.json`,
    JSON.stringify(mergedChampionData)
  );
  // deepcode ignore PT: Wont fix this right away
  fs.writeFileSync(
    `data/${latestVersion}/champions-summary.json`,
    JSON.stringify(lightweightChampionData)
  );
  fs.writeFileSync(
    `data/latest/champions-summary.json`,
    JSON.stringify(lightweightChampionData)
  );
};

// Get the champions.json file from the different endpoints specified in champions.json
// Return the custom merged champions.json file
const getChampions = async () => {
  // Read the champions.json configuration file
  const championsConfig = JSON.parse(
    fs.readFileSync("endpoints/champions.json")
  );
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
  if (!fs.existsSync(`data/${latestVersion}`)) {
    fs.mkdirSync(`data/${latestVersion}`);
  }
  // Create the folder latest in /data if it doesn't exist
  if (!fs.existsSync(`data/latest`)) {
    fs.mkdirSync(`data/latest`);
  }
  await mergeChampions(endpoints, latestVersion);
};

const main = async () => {
  try {
    await getChampions();
    core.info("Successfully merged champions.json");
  } catch (error) {
    core.setFailed(error.message);
  }
};

exports.getChampions = getChampions;
