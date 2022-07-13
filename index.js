import { info, setFailed } from "@actions/core";
import { getItems } from "./src/items.js";
import { getChampions } from "./src/champions.js";

const main = async () => {
  try {
    await getItems();
    info("Successfully merged items.json\n");
    await getChampions();
    info("Successfully merged champions.json\n");
    info("Successfully generated custom files.");
  } catch (error) {
    setFailed(error.message);
  }
};

main();
