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
 * A reform is mutable content; the canonical immutable Policy lives in
 * the main PolicyEngine API and is linked via policy_id once the reform
 * has been materialized for simulation.
 *
 * Rows carry no user identifier (and no IP address or user agent). The
 * unguessable id is the only way to reach a row; the browser that
 * created it keeps the id in its own index, with the edit token whose
 * hash is stored here.
 */
export const reforms = pgTable(
  "reforms",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    /** Legacy: client-supplied on rows written before edit tokens. Never written now. */
    userId: text("user_id"),
    /** SHA-256 of the edit token issued at creation. Null on legacy rows, which are read-only. */
    editTokenHash: text("edit_token_hash"),
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
  // Serves the new-row budget (db/limits.ts), which counts recent rows.
  (table) => [index("reforms_created_at_idx").on(table.createdAt)],
);

export type ReformRow = typeof reforms.$inferSelect;
export type NewReformRow = typeof reforms.$inferInsert;

/**
 * A generated impact report: a pointer to the computed output on the
 * PolicyEngine API plus the provenance snapshot shown in the report
 * header. Outputs themselves are never duplicated here — the API caches
 * and persists them. Same ownership model as reforms: no user
 * identifier, an unguessable id, and the hash of an edit token.
 */
export const reports = pgTable(
  "reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    /** Legacy: client-supplied on rows written before edit tokens. Never written now. */
    userId: text("user_id"),
    /** SHA-256 of the edit token issued at creation. Null on legacy rows, which are read-only. */
    editTokenHash: text("edit_token_hash"),
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
    /**
     * What validation matched this report against, pinned at match time:
     * the populace release and model version behind the calibration
     * check and the scorecard programs. Later releases make the stored
     * comparison historical, which the report can then say.
     */
    validation: jsonb("validation").$type<ReportValidationMetadata | null>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("reports_created_at_idx").on(table.createdAt)],
);

export interface ReportProvisionMetadata {
  path: string;
  breadcrumb: string;
  unit: string | null;
  baseline_value: unknown;
  value: unknown;
}

export interface ReportValidationMatchMetadata {
  variable: string;
  depth: number;
  ring: "primary" | "mechanism" | "downstream";
  target_count: number;
  mean_abs_relative_error: number;
  worst: {
    name: string;
    source: string;
    geography: string;
    relative_error: number | null;
  };
}

export interface ReportValidationMetadata {
  matched_at: string;
  /** Model version the dependency map was traced from. */
  map_model_version: string;
  calibration: {
    release_id: string | null;
    geography: string;
    reached_count: number;
    matches: ReportValidationMatchMetadata[];
  } | null;
  scorecard: { programs: string[] } | null;
}

export type ReportRow = typeof reports.$inferSelect;
export type NewReportRow = typeof reports.$inferInsert;
