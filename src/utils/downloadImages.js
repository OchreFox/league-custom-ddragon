import sharp from "sharp";
import { existsSync, mkdirSync } from "fs";
import axios from "axios";

/**
 * &gt;&gt;&gt; downloadImage("data/img/items/image.png", "http://www.example.com/image.png")
 * @param {string} filename - The path of the file to be downloaded. Include the subfolder for champion or items
 * @param {string} url - The URL path to the image you want to download.
 */
async function downloadImage(filename, url) {
  if (!filename || !url) return;

  // Create folders
  if (!existsSync("data/img/champions")) {
    mkdirSync("data/img/champions", { recursive: true });
  }
  if (!existsSync("data/img/items")) {
    mkdirSync("data/img/items", { recursive: true });
  }

  await axios
    .get(url, { responseType: "arraybuffer" })
    .then((res) => {
      sharp(res.data).toFile(filename, (err) => err && console.error(err));
      console.log("Saving image " + filename);
    })
    .catch((err) => console.error(err));
}

export default downloadImage;
