import sharp from "sharp";
import { existsSync, mkdirSync } from "fs";
import axios from "axios";
import { getPlaiceholder } from "plaiceholder";

/**
 * &gt;&gt;&gt; downloadImage("data/img/items/image.png", "http://www.example.com/image.png")
 * @param {string} filename - The path of the file to be downloaded. Include the subfolder for champion or items
 * @param {string} url - The URL path to the image you want to download.
 * @returns {Promise<string>} Base64 placeholder string.
 */
async function downloadImage(filename, url) {
  if (!filename || !url) {
    console.warn("No filename or url specified");
    return;
  }
  let placeholder = "";

  // Create folders
  if (!existsSync("data/img/champions")) {
    mkdirSync("data/img/champions", { recursive: true });
  }
  if (!existsSync("data/img/items")) {
    mkdirSync("data/img/items", { recursive: true });
  }
  await axios
    .get(url, { responseType: "arraybuffer" })
    .then(async (axiosResponse) => {
      console.log("Saving image " + filename);
      await sharp(axiosResponse.data)
        .toFile(filename)
        .then(async () => {
          await getPlaiceholder(axiosResponse.data)
            .then(({ base64 }) => (placeholder = base64))
            .catch((error) => console.error(error));
        })
        .catch((err) => {
          console.error(err);
        });
    })
    .catch((err) => console.error(err));

  return placeholder;
}

export default downloadImage;

// test
// eslint-disable-next-line no-unused-vars
// const test = async () => {
//   let res = await downloadImage(
//     "data/img/champions/Aatrox.png",
//     "https://ddragon.leagueoflegends.com/cdn/12.13.1/img/champion/Aatrox.png"
//   );
//   console.log("Base64: " + res);
// };
