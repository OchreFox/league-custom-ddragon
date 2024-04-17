export type ItemObject = Record<string, Item>;

export interface Item {
  id: number;
  name: string;
  description: null | string;
  maps: number[];
  gold: Gold;
  icon: string;
  iconOverlay: boolean;
  nicknames: string[];
  requiredChampion: RequiredChampion;
  simpleDescription: null | string;
  stats: Stats;
  classes: ChampionClass[];
  categories: Category[];
  inStore: boolean;
  maxStacks: number;
  from: number[];
  to: number[];
  placeholder: string;
  type: string[];
  passives?: Passive[];
  active: Passive[] | boolean;
  requiredAlly?: string;
  requiredBuffCurrencyName?: string;
  requiredBuffCurrencyCost?: number;
  specialRecipe?: number;
  isEnchantment?: boolean;
  price?: number;
  priceTotal?: number;
  iconPath?: string;
  rank?: Rank[];
}

export enum Category {
  AbilityHaste = "AbilityHaste",
  Active = "Active",
  Armor = "Armor",
  ArmorPenetration = "ArmorPenetration",
  AttackSpeed = "AttackSpeed",
  Aura = "Aura",
  Boots = "Boots",
  Consumable = "Consumable",
  CooldownReduction = "CooldownReduction",
  CriticalStrike = "CriticalStrike",
  Damage = "Damage",
  GoldPer = "GoldPer",
  Health = "Health",
  HealthRegen = "HealthRegen",
  Jungle = "Jungle",
  Lane = "Lane",
  LifeSteal = "LifeSteal",
  MagicPenetration = "MagicPenetration",
  MagicResist = "MagicResist",
  Mana = "Mana",
  ManaRegen = "ManaRegen",
  NonbootsMovement = "NonbootsMovement",
  OnHit = "OnHit",
  Slow = "Slow",
  SpellBlock = "SpellBlock",
  SpellDamage = "SpellDamage",
  SpellVamp = "SpellVamp",
  Stealth = "Stealth",
  Tenacity = "Tenacity",
  Trinket = "Trinket",
  Vision = "Vision",
}

export interface Gold {
  base: number;
  purchasable: boolean;
  total: number;
  sell: number;
}

export enum RequiredChampion {
  Empty = "",
  FiddleSticks = "FiddleSticks",
  Gangplank = "Gangplank",
}

export interface Stats {
  abilityPower?: FlatNumber;
  armor?: FlatNumber;
  armorPenetration?: PercentNumber;
  attackDamage?: FlatNumber;
  attackSpeed?: FlatNumber;
  cooldownReduction?: CooldownReduction;
  criticalStrikeChance?: PercentNumber;
  healAndShieldPower?: FlatNumber;
  health?: FlatNumber;
  healthRegen?: MixedNumber;
  lethality?: FlatNumber;
  lifesteal?: PercentNumber;
  magicPenetration?: MixedNumber;
  magicResistance?: FlatNumber;
  mana?: FlatNumber;
  manaRegen?: PercentNumber;
  movespeed?: MixedNumber;
  abilityHaste?: FlatNumber;
  omnivamp?: PercentNumber;
  tenacity?: FlatNumber;
  goldPer10?: FlatNumber;
}

export interface FlatNumber {
  flat?: number;
}

export interface PercentNumber {
  percent?: number;
}

export interface CooldownReduction {}

export interface MixedNumber {
  percent?: number;
  flat?: number;
}

// CommunityDragon types

export type CommunityDragonItemObject = Record<string, CommunityDragonItem>;

export interface CommunityDragonItem {
  id: number;
  name: string;
  description: string;
  active: boolean;
  inStore: boolean;
  from: number[];
  to: number[];
  categories: Category[];
  maxStacks: number;
  requiredChampion: RequiredChampion;
  requiredAlly: string;
  requiredBuffCurrencyName: string;
  requiredBuffCurrencyCost: number;
  specialRecipe: number;
  isEnchantment: boolean;
  price: number;
  priceTotal: number;
  iconPath: string;
  // Custom properties
  icon: string;
}

// Meraki types
export type MerakiItemObject = Record<string, MerakiItem>;

export enum Rank {
  Basic = "BASIC",
  Boots = "BOOTS",
  Consumable = "CONSUMABLE",
  Distributed = "DISTRIBUTED",
  Epic = "EPIC",
  Legendary = "LEGENDARY",
  Minion = "MINION",
  Potion = "POTION",
  Starter = "STARTER",
  Trinket = "TRINKET",
  Turret = "TURRET",
}

export interface MerakiItem {
  name: string;
  id: number;
  rank: Rank[];
  buildsFrom?: number[];
  buildsInto?: number[];
  specialRecipe?: number;
  noEffects?: boolean;
  removed: boolean;
  requiredChampion?: string;
  requiredAlly?: string;
  icon: string;
  simpleDescription?: null | string;
  nicknames: string[];
  passives: Passive[];
  active: Active[];
  stats: MerakiStats;
  shop: Shop;
  iconOverlay: boolean;
}

export interface Active {
  unique: boolean;
  name: null | string;
  effects: string;
  range: number | null;
  cooldown: null;
}

export interface Passive {
  unique: boolean;
  name: null | string;
  effects: null | string;
  cooldown: null | string;
  range: number | null;
  stats: MerakiStats;
}

export interface Shop {
  prices: Prices;
  purchasable: boolean;
  tags: MerakiTag[];
}

export interface Prices {
  total: number;
  combined: number;
  sell: number;
}

export enum MerakiTag {
  AbilityPower = "ABILITY_POWER",
  ArmorPen = "ARMOR_PEN",
  Assassin = "ASSASSIN",
  AttackDamage = "ATTACK_DAMAGE",
  AttackSpeed = "ATTACK_SPEED",
  Fighter = "FIGHTER",
  HealthAndReg = "HEALTH_AND_REG",
  LifestealVamp = "LIFESTEAL_VAMP",
  Mage = "MAGE",
  MagicPen = "MAGIC_PEN",
  ManaAndReg = "MANA_AND_REG",
  Marksman = "MARKSMAN",
  Movement = "MOVEMENT",
  OnhitEffects = "ONHIT_EFFECTS",
  Support = "SUPPORT",
  Tank = "TANK",
}

export enum ChampionClass {
  Assassin = "ASSASSIN",
  Fighter = "FIGHTER",
  Mage = "MAGE",
  Marksman = "MARKSMAN",
  Support = "SUPPORT",
  Tank = "TANK",
}

export interface MerakiStats {
  abilityPower?: ItemStats;
  armor: ItemStats;
  armorPenetration?: ItemStats;
  attackDamage?: ItemStats;
  attackSpeed?: ItemStats;
  cooldownReduction?: ItemStats;
  criticalStrikeChance?: ItemStats;
  goldPer10?: ItemStats;
  healAndShieldPower?: ItemStats;
  health: ItemStats;
  healthRegen?: ItemStats;
  lethality: ItemStats;
  lifesteal: ItemStats;
  magicPenetration?: ItemStats;
  magicResistance?: ItemStats;
  mana: ItemStats;
  manaRegen?: ItemStats;
  movespeed: ItemStats;
  abilityHaste?: ItemStats;
  omnivamp: ItemStats;
  tenacity: ItemStats;
  [x: string]: ItemStats | undefined;
}

export interface ItemStats {
  flat?: number;
  percent?: number;
  perLevel?: number;
  percentPerLevel?: number;
  percentBase?: number;
  percentBonus?: number;
}

// Blitz types
export interface BlitzRoot {
  type: string;
  version: string;
  basic: Basic;
  data: BlitzData;
  groups: Group[];
  tree: Tree[];
}

export interface Basic {
  name: string;
  rune: Rune;
  gold: Gold;
  group: string;
  description: string;
  colloq: string;
  plaintext: string;
  consumed: boolean;
  stacks: number;
  depth: number;
  consumeOnFull: boolean;
  from: any[];
  into: any[];
  specialRecipe: number;
  inStore: boolean;
  hideFromAll: boolean;
  requiredChampion: string;
  requiredAlly: string;
  stats: { [key: string]: number };
  tags: any[];
  maps: { [key: string]: boolean };
}

export interface Gold {
  base: number;
  total: number;
  sell: number;
  purchasable: boolean;
}

export interface Rune {
  isrune: boolean;
  tier: number;
  type: string;
}

export type BlitzData = Record<string, BlitzItem>;

export interface BlitzItem {
  id: number | string;
  name: string;
  description: string;
  stats?: BlitzStats;
  maps: number[];
  gold: Gold;
  into?: number[];
  from?: number[];
  depth?: number;
}

export interface BlitzStats {
  FlatArmorMod?: number;
  FlatCritChanceMod?: number;
  FlatHPPoolMod?: number;
  FlatHPRegenMod?: number;
  FlatMagicDamageMod?: number;
  FlatMovementSpeedMod?: number;
  FlatMPPoolMod?: number;
  FlatPhysicalDamageMod?: number;
  FlatSpellBlockMod?: number;
  PercentAttackSpeedMod?: number;
  PercentLifeStealMod?: number;
  PercentMovementSpeedMod?: number;
}

export interface Group {
  id: string;
  MaxGroupOwnable: string;
}

export interface Tree {
  header: string;
  tags: string[];
}
