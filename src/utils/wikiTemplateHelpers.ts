import { writeFileSync } from "fs";
import { downloadImage } from "./downloadImages";
import { createDirectory } from "./endpointUtils";
import { TooltipData, keywordColors, tooltipData } from "./wikiTemplates";
import { ItemObject } from "../types/items";

export const extractWikiTemplates = (text: string) => {
  // Grab everything between double curly braces
  const templateRegex = /{{(.*?)}}/g;
  let templates: string[] = [];
  let match;
  while ((match = templateRegex.exec(text)) !== null) {
    let template = match[1];
    // RGet only the first piece of the template (e.g. "tip" from "tip|Ahri")
    template = template.split("|")[0];
    templates.push(template);
  }
  return templates;
};

export const extractAllTemplates = (itemData: ItemObject) => {
  let allTemplates: string[] = [];
  Object.values(itemData).forEach((item) => {
    // Extract the templates from each passive[].effects and active[].effects
    if (item.passives && item.passives.length > 0) {
      item.passives.forEach((passive) => {
        if (passive.effects) {
          allTemplates.push(...extractWikiTemplates(passive.effects));
        }
      });
    }
    if (item.active && Array.isArray(item.active) && item.active.length > 0) {
      item.active.forEach((actv) => {
        if (actv.effects) {
          allTemplates.push(...extractWikiTemplates(actv.effects));
        }
      });
    }
  });
  // Remove duplicates
  return Array.from(new Set(allTemplates));
};

// To be used in https://leagueoflegends.fandom.com/wiki/Template:Tip
const extractTooltipInfo = (liElement: HTMLLIElement, type: string) => {
  const name = liElement.querySelector("span")?.getAttribute("data-tip");
  const icon =
    liElement.querySelector("img")?.getAttribute("src")?.split("png")[0] +
    "png";

  // Alias is the text content of the li element (e.g. "(or Bush)")
  // It is in the last child node of the li element
  let alias = "";
  const lastChild = liElement.childNodes[liElement.childNodes.length - 1];
  // Check if the last child is a text node
  if (lastChild.nodeType === 3) {
    alias = (lastChild.textContent ?? "")
      .trim()
      .replace(/[()]/g, "")
      .replace("or ", "");
  }

  return { name: name, alias: alias, type: type, icon: icon };
};
const getTooltipInfo = (liElements: HTMLLIElement[], type: string) => {
  let tooltipInfo: {
    name: string | null | undefined;
    alias: string;
    icon: string;
  }[] = [];
  liElements.forEach((liElement) => {
    tooltipInfo.push(extractTooltipInfo(liElement, type));
  });
  return tooltipInfo;
};
const getTooltip = (ulElement: HTMLUListElement, type: string) => {
  const liElements = ulElement.querySelectorAll("li");
  return getTooltipInfo(Array.from(liElements), type);
};

// After extracting the tooltip info, we can use the following function to
// Download the images and save them to our /data/img/tooltips folder
// The path of the image will be the name of the tooltip (e.g. "Ahri.png")
// The image will be used in the tooltip component of the item page
export const downloadTooltipImages = async (tooltips: TooltipData[]) => {
  createDirectory("data/img/tooltips");
  let tooltipIconPromises: Promise<void>[] = [];
  tooltips.forEach((tooltip) => {
    if (tooltip.icon) {
      const snakeCaseName = tooltip.name.replace(/ /g, "_").toLowerCase();
      let promise = downloadImage(
        `data/img/tooltips/${snakeCaseName}.png`,
        tooltip.icon
      )
        .then(() => {
          console.log("Downloaded icon for tooltip " + tooltip.name);
        })
        .catch((error) => {
          console.error(
            `Error downloading icon for tooltip ${tooltip.name}: ${error}`
          );
        });
      tooltipIconPromises.push(promise);
    } else {
      console.log(`No icon for tooltip ${tooltip.name}, skipping...`);
    }
  });

  await Promise.all(tooltipIconPromises);
};

// Save tooltip data with the icon path to the /data folder
export const saveTooltipData = (tooltips: TooltipData[]) => {
  let tooltipData = JSON.stringify(tooltips, null, 2);
  const path = "data/tooltips.json";
  writeFileSync(path, tooltipData);
  console.log(`Tooltip data saved to ${path}`);
};

export const saveTooltips = () => {
  downloadTooltipImages(tooltipData);
  // Modify the tooltipData to include the icon path
  let newTooltipData = tooltipData.map((tooltip) => {
    const snakeCaseName = tooltip.name.replace(/ /g, "_").toLowerCase();
    if (tooltip.icon) {
      return {
        ...tooltip,
        icon: `data/img/tooltips/${snakeCaseName}.png`,
      };
    }
    return tooltip;
  });

  saveTooltipData(newTooltipData);

  console.log("Successfully downloaded and saved tooltip images.");
};

// Passive Progression
// https://leagueoflegends.fandom.com/wiki/Template:Passive_progression/doc
// LUA Code source:
// https://leagueoflegends.fandom.com/wiki/Module:Passive_progression
// There are two generated outputs: the visible text output, and the table embedded within the tooltip. (in our case, the table is an array of level:value pairs)
// Syntax
// The abbreviated link {{t|pp|}} is used for brevity.

// However, there are numerous optional parameters of variable usefulness:

// {{t|pp|1|2|changedisplay|showtype|label1|type|label|formula|key|key1|round|round1|color}}

// 1
//  The first parameter specifies the progression's values, separated using semicolons and up to a maximum of 30. (bottom row of table)
// 2
//  The second parameter specifies the values' associated levels (or other basis of scaling), again separated using semicolons and capped at 30. (top row of table)
//  If left blank, this will automatically be populated using counting numbers.
// changedisplay
//  If parameter 1 includes 5 or fewer values, the default in-line display is separated by slashes. If there are more than five values, then the in-line output will be abbreviated to a range only displaying the initial and final values.
//  If this parameter is set to true, it will reverse the display settings from the default, established by the previous point.
// showtype
//  The display includes an in-line text describing the type of scaling in parentheses, which defaults to "(based on level)".
//  Setting this parameter to false will disable the in-line text.
// label1, type
//  Overwrites the label of the tooltip's top row and the in-line text's scaling factor.
//  If both parameters are present, type will over-write the in-line text, and label1 will override top row's label.
// label
//  Overwrites the label of the tooltip's bottom row.
// formula
//  Formulas are displayed automatically in tooltip if available.
//  Can be set to a custom string.
//  Operator symbols are switched with operator characters.
// key, key1
//  Used to add units to values.
//  key appends text to each value of parameter 1.
//  key1 appends text to each value of parameter 2.
//  Both keys are appended only if the value is a number.
// round, round1
//  Sets the number of decimal places. Defaults to 2 decimal places.
//  Can be set to a positive integer value, abs, ceil, floor or trunc.
// color
//  Used to set the color of in-line text, based on the keywordColors array.

// Example
// {{pp|5;5.5 to 10 for 10|1;8 to 17|formula=5 + 0.5 starting at level 8 and until level 17}}

export interface PassiveProgressionValues {
  level: number;
  value: number;
}

// We only care to output the values, the text label, and the formula
export interface PassiveProgression {
  values: PassiveProgressionValues[];
  label: string;
  formula: string;
}

const parseVerboseProgression = (text: string) => {
  // Parse the verbose progression (e.g. "5.5 to 10 for 10")
  // This means that the value is 5.5 at the initial level, and it increases by equal increments until it reaches 10 at 10 levels or steps
  // We can parse this by splitting the string by " to " and " for "
  const [initialValue, rest] = text.split(" to ");
  const [finalValue, steps] = rest.split(" for ");
  // Generate the progression
  let progression: string[] = [];
  for (let i = 0; i <= parseInt(steps); i++) {
    progression.push(
      (
        parseFloat(initialValue) +
        (parseFloat(finalValue) - parseFloat(initialValue)) *
          (i / parseInt(steps))
      ).toFixed(2)
    );
  }
  return progression;
};

export const parsePassiveProgression = (text: string): PassiveProgression => {
  const progressionRegex = /{{pp\|(.+?)}}/g;
  let match = progressionRegex.exec(text);
  if (match) {
    const [values, levels, ...rest] = match[1].split("|");
    // Parse the value skip by semicolon
    let valueArray = values.split(";");
    let levelArray = levels.split(";");

    let valueProgression: string[] = [];

    // If there's a verbose progression, parse it
    valueArray.map((value) => {
      if (value.includes(" to ")) {
        valueProgression.push(...parseVerboseProgression(value));
      } else {
        valueProgression.push(value);
      }
    });

    let progression: PassiveProgressionValues[] = [];
    valueProgression.forEach((value, index) => {
      progression.push({
        level: parseInt(levelArray[index]),
        value: parseFloat(value),
      });
    });
    const label = rest[rest.length - 2];
    const formula = rest[rest.length - 1].split("=")[1];
    return {
      values: progression,
      label: label,
      formula: formula,
    };
  }
  throw new Error("Error parsing passive progression");
};
