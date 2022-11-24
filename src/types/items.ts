export type ItemObject = Record<string, Item>;

export interface Item {
  id: number;
  name: string;
  description: null | string;
  maps: number[];
  gold: Gold;
  into: number[];
  mythic: boolean;
  icon: string;
  iconOverlay: boolean;
  nicknames: string[];
  requiredChampion: RequiredChampion;
  simpleDescription: null | string;
  tier: number;
  stats: Stats;
  classes: ChampionClass[];
  categories: Category[];
  inStore: boolean;
  maxStacks: number;
  from: number[];
  placeholder: string;
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

export enum ChampionClass {
  Assassin = "ASSASSIN",
  Fighter = "FIGHTER",
  Mage = "MAGE",
  Marksman = "MARKSMAN",
  Support = "SUPPORT",
  Tank = "TANK",
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
}

// Meraki types
export type MerakiItemObject = Record<string, MerakiItem>;

export interface MerakiItem {
  name: string;
  id: number;
  tier: number;
  rank: any[];
  buildsFrom?: number[];
  buildsInto?: number[];
  specialRecipe?: number;
  noEffects?: boolean;
  removed: boolean;
  requiredChampion?: RequiredChampion;
  requiredAlly?: string;
  icon: string;
  simpleDescription?: null | string;
  nicknames: string[];
  passives: Passive[];
  active: Active[];
  stats: MerakiStats;
  shop: Shop;
  iconOverlay: boolean;
  builds_from?: number[];
  builds_into?: number[];
  special_recipe?: number;
  no_effects?: boolean;
  required_champion?: string;
  required_ally?: string;
  simple_description?: null | string;
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
  mythic: boolean;
  name: null | string;
  effects: null | string;
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

export interface MerakiStats {
  abilityPower?: MerakiStatExtended;
  armor: MerakiStatExtended;
  armorPenetration?: MerakiStatExtended;
  attackDamage?: MerakiStatExtended;
  attackSpeed?: MerakiStatTypeBase;
  cooldownReduction?: MerakiStatExtended;
  criticalStrikeChance?: MerakiStatExtended;
  goldPer_10?: MerakiStatTypeBase;
  goldPer10?: MerakiStatTypeBase;
  healAndShieldPower?: MerakiStatTypeBase;
  health: MerakiStatExtended;
  healthRegen?: MerakiStatExtended;
  lethality: MerakiStatExtended;
  lifesteal: MerakiStatExtended;
  magicPenetration?: MerakiStatExtended;
  magicResistance?: MerakiStatExtended;
  mana: MerakiStatTypeBase;
  manaRegen?: MerakiStatExtended;
  movespeed: MerakiStatExtended;
  abilityHaste?: MerakiStatExtended;
  omnivamp: MerakiStatTypeBase;
  tenacity: MerakiStatTypeBase;
  ability_power?: MerakiStatTypeBase;
  armor_penetration?: MerakiStatExtended;
  attack_damage?: MerakiStatExtended;
  attack_speed?: MerakiStatExtended;
  cooldown_reduction?: MerakiStatTypeBase;
  critical_strike_chance?: MerakiStatExtended;
  gold_per_10?: MerakiStatTypeBase;
  heal_and_shield_power?: MerakiStatTypeBase;
  health_regen?: MerakiStatTypeBase;
  magic_penetration?: MerakiStatTypeBase;
  magic_resistance?: MerakiStatTypeBase;
  mana_regen?: MerakiStatExtended;
  ability_haste?: MerakiStatTypeBase;
  [key: string]: MerakiStatExtended | undefined;
}

export interface MerakiStatTypeBase {
  flat?: number;
  percent?: number;
  perLevel?: number;
  percentPerLevel?: number;
  percentBase?: number;
  percentBonus?: number;
}

export interface MerakiStatExtended extends Partial<MerakiStatTypeBase> {
  per_level?: number;
  percent_per_level?: number;
  percent_base?: number;
  percent_bonus?: number;
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
  maps: string[];
  gold: Gold;
  into?: string[];
  mythic: boolean;
  from?: string[];
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
