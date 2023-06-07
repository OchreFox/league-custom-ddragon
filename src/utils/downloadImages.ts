import sharp from "sharp";
import axios from "axios";
import { encode } from "blurhash";

import { blurHashToDataURL } from "./blurhashDataURL.js";
import { createDirectory } from "./endpointUtils.js";

/**
 * &gt;&gt;&gt; downloadImage("data/img/items/image.png", "http://www.example.com/image.png")
 * @param {string} filename - The path of the file to be downloaded. Include the subfolder for champion or items
 * @param {string} url - The URL path to the image you want to download.
 * @returns {Promise<string>} Blurhash placeholder with a 4x4 size.
 */
export async function downloadImage(
  filename: string,
  url: string
): Promise<string> {
  if (!filename || !url) {
    console.warn("No filename or url specified");
    return "";
  }
  let placeholder = "";

  // Create folders
  createDirectory("data/img/champions", true);
  createDirectory("data/img/items", true);

  let axiosResponse = await axios
    .get(url, {
      responseType: "arraybuffer",
      headers: {
        "Accept-Encoding": "identity",
      },
    })
    .catch((err) => console.error(err));

  // Save the image as a file
  if (axiosResponse) {
    console.log("Saving image " + filename);
    await sharp(axiosResponse.data)
      .toFile(filename)
      .catch((err) => {
        console.error(err);
      });
    // Create a placeholder
    const { data, info } = await sharp(filename)
      .raw()
      .ensureAlpha()
      .toBuffer({ resolveWithObject: true });

    const clamped = new Uint8ClampedArray(data);
    const blurhash = encode(clamped, info.width, info.height, 4, 4);
    placeholder = blurhash;
  }

  return placeholder;
}

// test
// eslint-disable-next-line no-unused-vars
const test = async () => {
  let placeholder = "";
  let blurhash = await downloadImage(
    "data/img/champions/Aatrox.png",
    "https://ddragon.leagueoflegends.com/cdn/12.13.1/img/champion/Aatrox.png"
  );
  console.log("Blurhash: " + blurhash);
  // Generate a 32x32 image from the blurhash
  const base64 = blurHashToDataURL(blurhash, 32, 32);
  if (base64) placeholder = base64;
  console.log("Converted (base64): " + placeholder);
};

// Run only if this file is called directly
// if (!process.env.GITHUB_ACTIONS || process.env.GITHUB_ACTIONS === "false") {
//   test();
// }
