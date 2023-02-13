import axios, { AxiosRequestConfig } from "axios";

/**
 * Gets the latest version of DDragon from https://ddragon.leagueoflegends.com/api/versions.json
 * @returns {string} The latest version of the game.
 */
export const getLatestVersion = async () => {
  const versionsEndpoints = [
    {
      method: "get",
      url: "https://ddragon.leagueoflegends.com/api/versions.json",
      name: "DDragon (Riot)",
    },
    {
      method: "get",
      url: "https://utils.iesdev.com/static/json/lol/riot/versions",
      name: "Blitz",
    },
  ];
  // Try to get the latest version from the first endpoint, if it fails, try the second endpoint
  for (const endpoint of versionsEndpoints) {
    try {
      console.log(`Getting latest version from ${endpoint.name}...`);
      const config: AxiosRequestConfig = {
        method: endpoint.method,
        url: endpoint.url,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "Accept-Encoding": "identity",
        },
      };
      const response = await axios(config)
        .then((response) => {
          return response.data[0];
        })
        .catch((error) => {
          throw error;
        });
      console.log(`Got latest version from ${endpoint.name}`);
      return response;
    } catch (error) {
      console.error(`Failed to get latest version from ${endpoint.name}`);
      console.error(error);
    }
  }
  // If both endpoints fail, throw an error
  throw new Error("Failed to get latest version");
};
