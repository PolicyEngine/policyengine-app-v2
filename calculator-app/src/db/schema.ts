import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
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
    parameters: jsonb("parameters")
      .notNull()
      .$type<ReformParameterMetadata[]>(),
    baseline: text("baseline").notNull().default("current-law"),
    provenance: jsonb("provenance").notNull().$type<ReformProvenanceMetadata>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("reforms_user_country_idx").on(table.userId, table.countryId),
  ],
);

export type ReformRow = typeof reforms.$inferSelect;
export type NewReformRow = typeof reforms.$inferInsert;

/**
 * A generated impact report: a pointer to the computed output on the
 * PolicyEngine API plus the provenance snapshot shown in the report
 * header. Outputs themselves are never duplicated here — the API caches
 * and persists them.
 */
export const reports = pgTable(
  "reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    countryId: text("country_id").notNull(),
    /** Report id on api.policyengine.org — the pointer to the outputs. */
    apiReportId: text("api_report_id").notNull(),
    title: text("title"),
    /** e.g. "Utah · Enacted" for bills, "Hand-built" for drafts. */
    sourceNote: text("source_note"),
    /** Provision snapshot at run time, for the provenance header. */
    provisions: jsonb("provisions")
      .notNull()
      .$type<ReportProvisionMetadata[]>(),
    /** Originating reform row, when the run came from a saved reform. */
    reformId: uuid("reform_id"),
    year: text("year").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("reports_user_country_idx").on(table.userId, table.countryId),
  ],
);

export interface ReportProvisionMetadata {
  path: string;
  breadcrumb: string;
  unit: string | null;
  baseline_value: unknown;
  value: unknown;
}

export type ReportRow = typeof reports.$inferSelect;
export type NewReportRow = typeof reports.$inferInsert;
