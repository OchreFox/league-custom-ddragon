export const requiredKeysMeraki = [
  "icon",
  "iconOverlay",
  "nicknames",
  "requiredChampion",
  "simpleDescription",
  "tier",
  "stats",
];

export const admittedClasses = [
  "MAGE",
  "SUPPORT",
  "TANK",
  "FIGHTER",
  "MARKSMAN",
  "ASSASSIN",
];

// Set default values for required keys
export const defaultValues = {
  categories: [],
  classes: [],
  description: null,
  from: [],
  gold: { base: 0, purchasable: false, total: 0, sell: 0 },
  icon: "",
  iconOverlay: false,
  id: -1,
  inStore: false,
  into: [],
  maps: [],
  maxStacks: 0,
  mythic: false,
  name: "",
  nicknames: [],
  requiredChampion: "",
  simpleDescription: "",
  stats: {},
  tier: 0,
};
