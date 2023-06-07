import { info } from "@actions/core";
import { getChampions } from "./parsers/champions.js";
import { getItems } from "./parsers/items.js";

const main = async () => {
  await getItems();
  info("Successfully merged items.json\n");
  await getChampions();
  info("Successfully merged champions.json\n");
  info("Successfully generated custom files.");
};

await main();
