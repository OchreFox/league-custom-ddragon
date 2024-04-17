import { CommunityDragonItemObject } from "../types/items";
import { writeFileSync } from "fs";

export const extractTags = (itemData: CommunityDragonItemObject) => {
  // Iterate through the items and extract the description of each item, then extract all the tags used in the description
  // tags are in the format <tag> and are case insensitive
  let tags: string[] = [];

  Object.entries(itemData).forEach(([key, value]) => {
    if (value.description) {
      const description = value.description;
      const regex = /<([a-zA-Z]+)>/g;
      let match;
      while ((match = regex.exec(description)) !== null) {
        tags.push(match[1]);
      }
    }
  });

  // Remove duplicates
  tags = [...new Set(tags)];
  // Remove the forbidden tags
  const forbiddenTags = ["br", "attention"];
  tags = tags.filter((tag) => !forbiddenTags.includes(tag));
  // Sort the tags
  tags.sort((a, b) => a.localeCompare(b));
  // Save the tags to a file
  writeFileSync("data/tags.json", JSON.stringify(tags));
  console.log("Tags extracted and saved to data/tags.json");

  return tags;
};
