import { z } from "zod";
import { rankSchema } from "./meraki-item-zod-schema";

export const ClassElementSchema = z.enum([
  "ASSASSIN",
  "FIGHTER",
  "MAGE",
  "MARKSMAN",
  "SUPPORT",
  "TANK",
]);
export type ClassElement = z.infer<typeof ClassElementSchema>;

export const RequiredAllySchema = z.enum(["", "Ornn"]);
export type RequiredAlly = z.infer<typeof RequiredAllySchema>;

export const RequiredBuffCurrencyNameSchema = z.enum([
  "",
  "GangplankBilgewaterToken",
  "S11Support_Quest_Completion_Buff",
]);
export type RequiredBuffCurrencyName = z.infer<
  typeof RequiredBuffCurrencyNameSchema
>;

export const RequiredChampionSchema = z.enum([
  "",
  "FiddleSticks",
  "Gangplank",
  "Kalista",
  "Sylas",
]);
export type RequiredChampion = z.infer<typeof RequiredChampionSchema>;

export const ActiveElementSchema = z.object({
  unique: z.boolean(),
  name: z.union([z.null(), z.string()]),
  effects: z.string(),
  range: z.union([z.number(), z.null()]),
  cooldown: z.null(),
});
export type ActiveElement = z.infer<typeof ActiveElementSchema>;

export const GoldSchema = z.object({
  base: z.number(),
  purchasable: z.boolean(),
  total: z.number(),
  sell: z.number(),
});
export type Gold = z.infer<typeof GoldSchema>;

export const CooldownReductionSchema = z.object({});
export type CooldownReduction = z.infer<typeof CooldownReductionSchema>;

export const AbilityHasteSchema = z.object({
  flat: z.number().optional(),
});
export type AbilityHaste = z.infer<typeof AbilityHasteSchema>;

export const ArmorPenetrationSchema = z.object({
  percent: z.number().optional(),
});
export type ArmorPenetration = z.infer<typeof ArmorPenetrationSchema>;

export const HealthRegenSchema = z.object({
  percent: z.number().optional(),
  flat: z.number().optional(),
});
export type HealthRegen = z.infer<typeof HealthRegenSchema>;

export const ItemsStatsSchema = z.object({
  abilityPower: AbilityHasteSchema.optional(),
  armor: AbilityHasteSchema.optional(),
  armorPenetration: ArmorPenetrationSchema.optional(),
  attackDamage: AbilityHasteSchema.optional(),
  attackSpeed: AbilityHasteSchema.optional(),
  cooldownReduction: CooldownReductionSchema.optional(),
  criticalStrikeChance: ArmorPenetrationSchema.optional(),
  goldPer10: AbilityHasteSchema.optional(),
  healAndShieldPower: AbilityHasteSchema.optional(),
  health: AbilityHasteSchema.optional(),
  healthRegen: HealthRegenSchema.optional(),
  lethality: AbilityHasteSchema.optional(),
  lifesteal: ArmorPenetrationSchema.optional(),
  magicPenetration: HealthRegenSchema.optional(),
  magicResistance: AbilityHasteSchema.optional(),
  mana: AbilityHasteSchema.optional(),
  manaRegen: ArmorPenetrationSchema.optional(),
  movespeed: HealthRegenSchema.optional(),
  abilityHaste: AbilityHasteSchema.optional(),
  omnivamp: CooldownReductionSchema.optional(),
  tenacity: ArmorPenetrationSchema.optional(),
});
export type ItemsStats = z.infer<typeof ItemsStatsSchema>;

export const PassiveStatsSchema = z.object({
  abilityPower: AbilityHasteSchema,
  armor: CooldownReductionSchema,
  armorPenetration: CooldownReductionSchema,
  attackDamage: CooldownReductionSchema,
  attackSpeed: CooldownReductionSchema,
  cooldownReduction: CooldownReductionSchema,
  criticalStrikeChance: CooldownReductionSchema,
  goldPer10: CooldownReductionSchema,
  healAndShieldPower: CooldownReductionSchema,
  health: CooldownReductionSchema,
  healthRegen: CooldownReductionSchema,
  lethality: CooldownReductionSchema,
  lifesteal: ArmorPenetrationSchema,
  magicPenetration: CooldownReductionSchema,
  magicResistance: CooldownReductionSchema,
  mana: CooldownReductionSchema,
  manaRegen: CooldownReductionSchema,
  movespeed: HealthRegenSchema,
  abilityHaste: CooldownReductionSchema,
  omnivamp: ArmorPenetrationSchema,
  tenacity: CooldownReductionSchema,
});
export type PassiveStats = z.infer<typeof PassiveStatsSchema>;

export const PassiveSchema = z.object({
  unique: z.boolean(),
  mythic: z.boolean(),
  name: z.union([z.null(), z.string()]),
  effects: z.string(),
  range: z.union([z.number(), z.null()]),
  cooldown: z.union([z.null(), z.string()]),
  stats: PassiveStatsSchema,
});
export type Passive = z.infer<typeof PassiveSchema>;

export const ItemsValueSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.union([z.null(), z.string()]),
  active: z.union([z.array(ActiveElementSchema), z.boolean()]),
  inStore: z.boolean(),
  from: z.array(z.number()),
  to: z.array(z.number()),
  categories: z.array(z.string()),
  maxStacks: z.number(),
  requiredChampion: RequiredChampionSchema,
  requiredAlly: RequiredAllySchema.optional(),
  requiredBuffCurrencyName: RequiredBuffCurrencyNameSchema.optional(),
  requiredBuffCurrencyCost: z.number().optional(),
  specialRecipe: z.number().optional(),
  isEnchantment: z.boolean().optional(),
  price: z.number().optional(),
  priceTotal: z.number().optional(),
  iconPath: z.string().optional(),
  icon: z.string(),
  maps: z.array(z.number()),
  iconOverlay: z.boolean(),
  nicknames: z.array(z.string()),
  simpleDescription: z.union([z.null(), z.string()]),
  stats: ItemsStatsSchema,
  passives: z.array(PassiveSchema).optional(),
  classes: z.array(ClassElementSchema),
  gold: GoldSchema,
  placeholder: z.string(),
  type: z.array(z.any()),
  rank: z.array(rankSchema),
});
export type ItemsValue = z.infer<typeof ItemsValueSchema>;

// All items
export type ItemObject = Record<string, ItemsValue>;

export const ItemsSchema = z.record(ItemsValueSchema);
