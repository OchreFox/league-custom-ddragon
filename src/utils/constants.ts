import { Item, RequiredChampion } from "../types/items";

// Set default values for required keys
export const defaultValues: Item = {
  categories: [],
  classes: [],
  description: null,
  from: [],
  gold: { base: 0, purchasable: false, total: 0, sell: 0 },
  icon: "",
  iconOverlay: false,
  id: -1,
  inStore: false,
  to: [],
  maps: [],
  maxStacks: 0,
  name: "",
  nicknames: [],
  placeholder: "",
  requiredChampion: RequiredChampion.Empty,
  simpleDescription: "",
  stats: {},
  type: [],
  active: false,
  rank: [],
};
