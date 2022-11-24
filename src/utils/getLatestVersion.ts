import axios from "axios";

/**
 * Gets the latest version of DDragon from https://ddragon.leagueoflegends.com/api/versions.json
 * @returns {string} The latest version of the game.
 */
export const getLatestVersion = async () => {
  const config = {
    method: "get",
    url: "https://ddragon.leagueoflegends.com/api/versions.json",
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
      console.log(error);
    });
  return response;
};
