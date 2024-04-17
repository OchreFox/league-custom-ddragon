import { info } from "@actions/core";
import { getChampions } from "./parsers/champions.js";
import { getItems } from "./parsers/items.js";
import { saveTooltips } from "./utils/wikiTemplateHelpers.js";

const main = async () => {
  // Get Tooltips
  saveTooltips();
  info("Successfully downloaded tooltip data.\n");
  await getItems();
  info("Successfully merged items.json\n");
  await getChampions();
  info("Successfully merged champions.json\n");
  info("Successfully generated custom files.");
};

main();
