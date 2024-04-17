import _ from "lodash";
import DOMPurify from "isomorphic-dompurify";
import { XMLParser, XMLBuilder } from "fast-xml-parser";
import { Item } from "~/src/types/items.js";

/**
 * Function to convert a string from camel case or snake case to pascal case
 * @param {string} str - The string to convert to PascalCase.
 */
export const toPascalCase = (str: string) => {
  return str
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
};

/**
 * It takes a string, sanitizes it, parses it, and returns a string.
 * @param {Item} item - {
 * @returns {string} A string of XML.
 */
export function sanitizeText(
  item: Item,
  allowedTags: string[],
  pascalCaseTags: string[]
): string {
  if (!item) return "";
  let text = item.description;
  if (!text) {
    console.warn(`Item ${item.name} has no description`);
    return "";
  }

  // Sanitize text with dompurify
  let sanitizedText = DOMPurify.sanitize(text, {
    ALLOWED_TAGS: allowedTags,
    FORBID_TAGS: ["br", "attention", "{{", "{%", "{", "}", "%}", "}}"],
    SAFE_FOR_TEMPLATES: false,
    ALLOW_DATA_ATTR: true,
    KEEP_CONTENT: true, // Preserve content between tags
  });

  // Replace all lowercase tags with PascalCase tags
  pascalCaseTags.forEach((tag) => {
    sanitizedText = sanitizedText.replace(
      new RegExp(`<${tag.toLowerCase()}>`, "g"),
      `<${tag}>`
    );
    sanitizedText = sanitizedText.replace(
      new RegExp(`</${tag.toLowerCase()}>`, "g"),
      `</${tag}>`
    );
  });

  // Manipulate the sanitized text with JSDOM
  const document = new JSDOM(sanitizedText).window.document;
  const rootElement = document.querySelector("body");

  // Replace all "checked" attributes in input tags to "defaultChecked" that have no "onChange" attribute
  const inputTags = rootElement.querySelectorAll("input");
  inputTags.forEach((input) => {
    if (input.hasAttribute("checked") && !input.hasAttribute("onChange")) {
      input.setAttribute("defaultChecked", "true");
      input.removeAttribute("checked");
    }
  });

  let jsxString = rootElement.innerHTML;

  // The "defaultChecked" attribute is lowercased when using innerHTML, so we need to replace it with "defaultChecked={true}" manually
  // As is: <input type="checkbox" defaultchecked="true">
  // To be: <input type="checkbox" defaultChecked={true}>
  const defaultCheckedRegex = new RegExp(/defaultchecked="true"/, "g");
  jsxString = jsxString.replace(defaultCheckedRegex, "defaultChecked={true}");

  // Parse with fast-xml-parser
  const parser = new XMLParser({
    preserveOrder: true,
  });
  const xml = parser.parse(sanitizedText);

  // Remove stats from the xml object
  if (xml.mainText?.stats) {
    for (let key in xml.mainText.stats) {
      delete xml.mainText.stats[key];
    }
  }

  // Convert xml object to XML string
  const builder = new XMLBuilder({
    preserveOrder: true,
  });
  let xmlString = builder.build(xml);

  // Add stats between <Stats> tag and </Stats> tag
  xmlString = parseStats(xmlString, item);
  // Combine Active tags
  xmlString = parseActives(xmlString);

  // Replace in xmlString:
  // Add a whitespace (' ') before a less than character ('<') if the preceding character is a letter (a-z, A-Z) or a colon (':')
  const lessThanRegex = /([a-zA-Z,:])</g;
  xmlString = xmlString.replace(lessThanRegex, "$1 <");

  return xmlString;
}

/**
 * Takes an XML string and an item object, and replaces the string with a JSX element
 * @param {string} xmlString - The string of the xml file
 * @param {Item} item - The item object that contains the stats
 * @returns {string} The xmlString is being returned with the stats of the item.
 * @example
 * Returns: <Stats><Stat name="Attack Speed">1.5</Stat></Stats>
 */
export function parseStats(xmlString: string, item: Item): string {
  const statsRegex = /<Stats>(.*?)<\/Stats>/g;
  const statsMatch = xmlString.match(statsRegex);
  if (statsMatch) {
    const statsTag = statsMatch[0];
    let statsString = "";

    // Create the stats string with the stats of the item
    if (item.stats) {
      Object.entries(item.stats).forEach(([keyItem, value]) => {
        Object.entries(value).forEach(([key2, value2]) => {
          let statName = toPascalCase(key2) + toPascalCase(keyItem);
          statsString += `<Stat name="${statName}">${value2}${
            key2.includes("percent") ? "%" : ""
          }</Stat>`;
        });
      });
    }

    const statText = `<Stats>${statsString}</Stats>`;
    xmlString = _.replace(xmlString, statsTag, statText);
  }
  return xmlString;
}

/** Combine all two adjacent Active tags when the first one is "Active -"
 * @param {string} xmlString - The string of the xml file
 * @returns {string} Parsed string
 * @example
 * Input: <Active>Active -</Active><Active>Lorem ipsum</Active>
 * Result:  <Active>Active - Lorem ipsum</Active>
 */
export function parseActives(xmlString: string): string {
  const activeRegex = /<Active>(.*?)<\/Active>/g;
  const activeMatch = xmlString.match(activeRegex);
  let skipNext = false;
  if (activeMatch) {
    // Loop through each match
    for (const match of activeMatch) {
      // If skipNext is set to true, skip the next match
      if (skipNext === true) {
        skipNext = false;
        // Delete the match from the xmlString
        xmlString = _.replace(xmlString, match, "");
        continue;
      }
      // Get the content of the match
      const tagContent = match.replace(/<\/?Active>/g, "");
      // Check if the content is "Active -"
      if (tagContent === "Active -") {
        // Replace the match with the "Active - " and the content of the next match
        const nextTagContent = activeMatch[activeMatch.indexOf(match) + 1]
          .replace(/<\/?Active>/g, "")
          .trim();

        xmlString = _.replace(
          xmlString,
          match,
          `<Active>Active - ${nextTagContent}</Active>`
        );
        // Skip the next match
        skipNext = true;
      }
    }
  }
  return xmlString;
}
