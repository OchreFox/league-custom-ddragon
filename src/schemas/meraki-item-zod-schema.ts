import { z } from "zod";

export enum ItemRank {
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

export enum ItemTag {
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

export const activeSchema = z.object({
  unique: z.boolean(),
  name: z.string().nullable(),
  effects: z.string(),
  range: z.number().nullable(),
  cooldown: z.null(),
});

export const itemStatsSchema = z.object({
  flat: z.number(),
  percent: z.number(),
  perLevel: z.number().optional(),
  percentPerLevel: z.number().optional(),
  percentBase: z.number().optional(),
  percentBonus: z.number().optional(),
});

export const rankSchema = z.nativeEnum(ItemRank);

export const pricesSchema = z.object({
  total: z.number(),
  combined: z.number(),
  sell: z.number(),
});

export const tagSchema = z.nativeEnum(ItemTag);

export const merakiItemStatsSchema = z.object({
  abilityPower: itemStatsSchema.optional(),
  armor: itemStatsSchema,
  armorPenetration: itemStatsSchema.optional(),
  attackDamage: itemStatsSchema.optional(),
  attackSpeed: itemStatsSchema.optional(),
  cooldownReduction: itemStatsSchema.optional(),
  criticalStrikeChance: itemStatsSchema.optional(),
  goldPer10: itemStatsSchema.optional(),
  healAndShieldPower: itemStatsSchema.optional(),
  health: itemStatsSchema,
  healthRegen: itemStatsSchema.optional(),
  lethality: itemStatsSchema,
  lifesteal: itemStatsSchema,
  magicPenetration: itemStatsSchema.optional(),
  magicResistance: itemStatsSchema.optional(),
  mana: itemStatsSchema,
  manaRegen: itemStatsSchema.optional(),
  movespeed: itemStatsSchema,
  abilityHaste: itemStatsSchema.optional(),
  omnivamp: itemStatsSchema,
  tenacity: itemStatsSchema,
});

export const shopSchema = z.object({
  prices: pricesSchema,
  purchasable: z.boolean(),
  tags: z.array(tagSchema),
});

export const passiveSchema = z.object({
  unique: z.boolean(),
  mythic: z.boolean().optional(),
  name: z.string().nullable(),
  effects: z.string(),
  range: z.number().nullable(),
  cooldown: z.string().nullable(),
  stats: merakiItemStatsSchema,
});

export const merakiItemSchema = z.object({
  name: z.string(),
  id: z.number(),
  rank: z.array(rankSchema),
  buildsFrom: z.array(z.number()).optional(),
  buildsInto: z.array(z.number()).optional(),
  specialRecipe: z.number().optional(),
  noEffects: z.boolean().optional(),
  removed: z.boolean(),
  requiredChampion: z.string().optional(),
  requiredAlly: z.string().optional(),
  icon: z.string(),
  simpleDescription: z.string().optional().nullable(),
  nicknames: z.array(z.string()),
  passives: z.array(passiveSchema),
  active: z.array(activeSchema),
  stats: merakiItemStatsSchema,
  shop: shopSchema,
  iconOverlay: z.boolean(),
});
