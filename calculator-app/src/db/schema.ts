import { index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import type {
  ReformParameterMetadata,
  ReformProvenanceMetadata,
} from "@/types/metadata/reformMetadata";

/**
 * Central store for the flagship app's reform objects.
 *
 * A reform is user-owned, mutable content; the canonical immutable Policy
 * lives in the main PolicyEngine API and is linked via policy_id once the
 * reform has been materialized for simulation.
 */
export const reforms = pgTable(
  "reforms",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    countryId: text("country_id").notNull(),
    label: text("label"),
    policyId: text("policy_id"),
    parameters: jsonb("parameters").notNull().$type<ReformParameterMetadata[]>(),
    baseline: text("baseline").notNull().default("current-law"),
    provenance: jsonb("provenance").notNull().$type<ReformProvenanceMetadata>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("reforms_user_country_idx").on(table.userId, table.countryId)],
);

export type ReformRow = typeof reforms.$inferSelect;
export type NewReformRow = typeof reforms.$inferInsert;
