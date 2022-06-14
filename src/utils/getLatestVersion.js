const axios = require("axios");

/**
 * Gets the latest version of DDragon from https://ddragon.leagueoflegends.com/api/versions.json
 * @returns The latest version of the game.
 */
const getLatestVersion = async () => {
  const response = await axios.get(
    "https://ddragon.leagueoflegends.com/api/versions.json"
  );
  let latestVersion = response.data[0];
  // Sanitize latest version, only accept numbers and dots
  latestVersion = latestVersion.replace(/[^0-9.]/g, "");
  return latestVersion;
};
exports.getLatestVersion = getLatestVersion;
