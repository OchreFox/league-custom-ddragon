export type MergedChampionData = Partial<Champion> &
  Partial<MobalyticsChampion>;
export type MergedChampionDataObject = Record<string, MergedChampionData>;

export type MerakiChampionObject = Record<string, MerakiChampion>;

export interface Champion extends MerakiChampion {
  placeholder?: string;
  riotSlug?: string;
}

export interface MerakiChampion {
  id: number;
  key: string;
  name: string;
  title: string;
  fullName: string;
  icon: string;
  resource: Resource | string;
  attackType: AttackType;
  adaptiveType: DamageType;
  stats: { [key: string]: ChampionStat };
  roles: string[];
  attributeRatings: AttributeRatings;
  abilities: Abilities;
  releaseDate: string;
  releasePatch: string;
  patchLastChanged: string;
  price: Price;
  lore: string;
  faction: string;
  skins: Skin[];
}

export enum Resource {
  Charge = "CHARGE",
  CurrentHealth = "CURRENT_HEALTH",
  Energy = "ENERGY",
  Fury = "FURY",
  Grit = "GRIT",
  Health = "HEALTH",
  Mana = "MANA",
  ManaPerSecond = "MANA_PER_SECOND",
  MaximumHealth = "MAXIMUM_HEALTH",
  Other = "OTHER",
  BloodWell = "BLOOD_WELL",
  Flow = "FLOW",
  None = "NONE",
}

export enum AttackType {
  Melee = "MELEE",
  Ranged = "RANGED",
}

export enum DamageType {
  MagicDamage = "MAGIC_DAMAGE",
  MixedDamage = "MIXED_DAMAGE",
  OtherDamage = "OTHER_DAMAGE",
  PhysicalDamage = "PHYSICAL_DAMAGE",
  TrueDamage = "TRUE_DAMAGE",
}

export interface Skin {
  name: string;
  id: number;
  isBase: boolean;
  availability: Availability;
  formatName: string;
  lootEligible: boolean;
  cost: string | number;
  sale: number;
  distribution: null | string;
  rarity: Rarity;
  chromas?: Chroma[];
  lore: null | string;
  release: string;
  set: string[];
  splashPath: string;
  uncenteredSplashPath: string;
  tilePath: string;
  loadScreenPath: string;
  loadScreenVintagePath: null | string;
  newEffects: boolean;
  newAnimations: boolean;
  newRecall: boolean;
  newVoice: boolean;
  newQuotes: boolean;
  voiceActor: string[];
  splashArtist: string[];
}

export enum Availability {
  Available = "Available",
  Legacy = "Legacy",
  Limited = "Limited",
  Rare = "Rare",
  Upcoming = "Upcoming",
}

export enum Rarity {
  Epic = "Epic",
  Legendary = "Legendary",
  Mythic = "Mythic",
  NoRarity = "NoRarity",
  Rare = "Rare",
  Ultimate = "Ultimate",
}

export interface Chroma {
  name: string;
  id: number;
  chromaPath: string;
  colors: string[];
  descriptions: Description[];
  rarities: RarityProps[];
}

export interface Description {
  description: null | string;
  region: Region | null;
}

export enum Region {
  Empty = "",
  ID = "ID",
  RegionTencent = "tencent",
  Riot = "riot",
  Tencent = "TENCENT",
  Tw = "TW",
  Vn = "VN",
}

export interface RarityProps {
  rarity: number | null;
  region: Region | null;
}

export interface ChampionStat {
  flat: number;
  percent: number;
  perLevel: number;
  percentPerLevel: number;
}

export interface AttributeRatings {
  damage: number;
  toughness: number;
  control: number;
  mobility: number;
  utility: number;
  abilityReliance: number;
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
}

export interface Price {
  blueEssence: number;
  rp: number;
  saleRp: number;
}

export interface Abilities {
  P: Ability[];
  Q: Ability[];
  W: Ability[];
  E: Ability[];
  R: Ability[];
}
export interface Ability {
  name: string;
  icon: string;
  effects: Effect[];
  cost: CostClass | null;
  cooldown: Cooldown | null;
  targeting: Targeting;
  affects: null | string;
  spellshieldable: null | string;
  resource: Resource | null;
  damageType: DamageType | null;
  spellEffects: null | string;
  projectile: Projectile | null;
  onHitEffects: null | string;
  occurrence: Occurrence | null;
  notes: null | string;
  blurb: null | string;
  missileSpeed: null;
  rechargeRate: number[] | null;
  collisionRadius: null | string;
  tetherRadius: null | string;
  onTargetCdStatic: null | string;
  innerRadius: null | string;
  speed: null | string;
  width: null | string;
  angle: null | string;
  castTime: null | string;
  effectRadius: null | string;
  targetRange: null | string;
}

export interface Modifier {
  values: number[];
  units: string[];
}

export interface Effect {
  description: string;
  leveling: Leveling[];
}

export interface Leveling {
  attribute: string;
  modifiers: Modifier[];
}

export interface Cooldown {
  modifiers: Modifier[];
  affectedByCdr: boolean;
}

export interface CostClass {
  modifiers: Modifier[];
}

export enum Targeting {
  Auto = "Auto",
  AutoDirection = "Auto / Direction",
  AutoLocation = "Auto / Location",
  AutoUnit = "Auto / Unit",
  Direction = "Direction",
  DirectionAuto = "Direction / Auto",
  DirectionAutoLocation = "Direction / Auto / Location",
  DirectionLocation = "Direction / Location",
  DirectionLocationUnit = "Direction / Location / Unit",
  Location = "Location",
  LocationAuto = "Location / Auto",
  LocationUnit = "Location / Unit",
  NA = "N/A",
  Passive = "Passive",
  Unit = "Unit",
  UnitAuto = "Unit / Auto",
  UnitDirection = "Unit / Direction",
  UnitLocation = "Unit / Location",
  Varied = "Varied",
  Vector = "Vector",
}

export enum Occurrence {
  OccurrenceOnHit = "on-hit",
  OnHit = "On-hit",
  True = "True",
}

export enum Projectile {
  False = "FALSE",
  Special = "SPECIAL",
  True = "TRUE",
}

// Mobalytics types

export interface MobalyticsChampions {
  data: MobalyticsData;
}

export interface MobalyticsData {
  info: Info[];
}

export interface Info {
  flatData: MobalyticsChampion;
}

export interface MobalyticsChampion {
  slug: string;
  kite: number | null;
  preToughness: number | null;
  powerSpikes: PowerSpike[];
  difficultyLevel: number | null;
  name: string;
  antiDive: boolean | null;
  gankReliability: boolean | null;
  preControl: number | null;
  postMobility: number | null;
  postToughness: number | null;
  key: number;
  gankTurnAround: boolean | null;
  mobility: number | null;
  postControl: number | null;
  utility: number | null;
  engage: number | null;
  gankDenial: boolean | null;
  preDamage: number | null;
  postDamage: number | null;
  toughness: number;
  damageType: number | null;
  divePotential: boolean | null;
  pick: number | null;
  skirmish: number | null;
  split: number | null;
  sustained: number | null;
  damage: number | null;
  poke: number | null;
  preMobility: number | null;
  control: number | null;
  difficulty: Difficulty[];
  burst: number | null;
  tags: ChampionTag[];
  waveclear: number | null;
  riotSlug: string;
}

export interface Difficulty {
  flatData: DifficultyFlatData;
}

export interface DifficultyFlatData {
  slug: Slug;
  name: Name;
  level: number;
}

export enum Name {
  Average = "Average",
  Easy = "Easy",
  Hard = "Hard",
  Severe = "Severe",
}

export enum Slug {
  Average = "average",
  Easy = "easy",
  Hard = "hard",
  Severe = "severe",
}

export interface PowerSpike {
  early: number;
  mid: number;
  late: number;
}

export enum ChampionTag {
  Assassin = "Assassin",
  Fighter = "Fighter",
  Mage = "Mage",
  Marksman = "Marksman",
  Support = "Support",
  Tank = "Tank",
}
