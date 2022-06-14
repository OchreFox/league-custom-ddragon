const core = require("@actions/core");
const { getItems } = require("./src/items");
const { getChampions } = require("./src/champions");

const main = async () => {
  try {
    await getItems();
    core.info("Successfully merged items.json\n");
    await getChampions();
    core.info("Successfully merged champions.json\n");
    core.info("Successfully generated custom files.");
  } catch (error) {
    core.setFailed(error.message);
  }
};

main();
