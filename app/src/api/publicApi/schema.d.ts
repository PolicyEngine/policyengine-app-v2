/**
 * Generated from src/api/publicApi/openapi.json by scripts/public-api-client.ts.
 * Do not edit: run `bun run public-api:generate` (or `public-api:refresh`).
 */

export interface paths {
  '/v2/countries': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** List the served countries and the calculations each supports */
    get: operations['list_countries_v2_countries_get'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v2/datasets': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** List logical inputs from a selected PolicyEngine.py catalog */
    get: operations['list_datasets_v2_datasets_get'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v2/datasets/{dataset_id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Get one logical input from a selected PolicyEngine.py catalog */
    get: operations['get_dataset_v2_datasets__dataset_id__get'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v2/economy-options': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Get compact economy-selection options from a selected catalog */
    get: operations['get_economy_options_v2_economy_options_get'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v2/household-calculations': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Calculate a stored household under a stored policy */
    post: operations['submit_household_calculation_v2_household_calculations_post'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v2/household-calculations/{calculation_id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Read a household calculation and its result */
    get: operations['get_household_calculation_v2_household_calculations__calculation_id__get'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v2/households': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** List immutable households */
    get: operations['get_households_v2_households_get'];
    put?: never;
    /** Create or find an immutable household */
    post: operations['create_household_v2_households_post'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v2/households/{household_id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Read one immutable household */
    get: operations['get_household_v2_households__household_id__get'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v2/me': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Read the current user
     * @description For a bearer access token, returns the PolicyEngine user, creating it on the first call with primary_country set from country_id. For the PolicyEngine-Unauthenticated-User header, returns the browser's unauthenticated user, or 404 before its first saved record; reading never creates one.
     */
    get: operations['get_me_v2_me_get'];
    put?: never;
    post?: never;
    /**
     * Delete the current user and all of their saved records
     * @description For a signed-in user, obtains Auth0 Management credentials first when they are configured, then deletes the user's legacy user mappings, the user (identities and associations cascade), and the Auth0 user. For an unauthenticated user, deletes the user and its associations and never calls Auth0; 204 even when it does not exist.
     */
    delete: operations['delete_me_v2_me_delete'];
    options?: never;
    head?: never;
    /**
     * Update the signed-in user's names or primary country
     * @description Unauthenticated users cannot edit account details (403).
     */
    patch: operations['patch_me_v2_me_patch'];
    trace?: never;
  };
  '/v2/me/export': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Export the current user and every saved record
     * @description Covers every country, not only country_id. user is null, and every list empty, for an unauthenticated user with no saved records.
     */
    get: operations['export_me_v2_me_export_get'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v2/me/upgrade': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Move this browser's unauthenticated user into the signed-in account
     * @description Requires both a bearer access token and the PolicyEngine-Unauthenticated-User header. When the signed-in identity has no account yet, the unauthenticated user becomes it in place, keeping its ID and records (converted). When the identity already has an account, every record moves to that account with its ID unchanged and the unauthenticated user is deleted (merged). When the header names no unauthenticated user, including a signed-in account's ID, nothing moves (none). The response is the signed-in account.
     */
    post: operations['upgrade_me_v2_me_upgrade_post'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v2/model-catalog': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Get the small parts of one PolicyEngine.py catalog version
     * @description Returns the selected catalog version's model, model version, entities, basic inputs, regions, logical input datasets and economy choices, which are empty lists for a catalog without regions. The result names the selected PolicyEngine.py version, so a client can request the version's other parts by that exact version; a response for a named version may be reused for a day.
     */
    get: operations['get_model_catalog_v2_model_catalog_get'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v2/model-catalog/parameters': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Get several parameters of one catalog version by name
     * @description Returns the named parameters (repeat name for each, at most 100) in name order, each with its economy and household flags and its current-law values by date, plus the stored labels of their ancestor nodes for breadcrumbs and the requested names the version has no parameter for. A client showing or editing a reform loads all of its parameters in this one request.
     */
    get: operations['get_catalog_parameters_v2_model_catalog_parameters_get'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v2/model-catalog/variables': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Get every variable of one PolicyEngine.py catalog version
     * @description Returns all of the selected catalog version's variables in name order, in one response. Where a variable's adds or subtracts list comes from a parameter, part_parameter_values carries that parameter's current-law values by date, so a client can pick the list for any year.
     */
    get: operations['get_catalog_variables_v2_model_catalog_variables_get'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v2/parameter-values': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** List canonical values from a selected PolicyEngine.py catalog */
    get: operations['list_parameter_values_v2_parameter_values_get'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v2/parameter-values/{value_id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Get one canonical value from a selected PolicyEngine.py catalog */
    get: operations['get_parameter_value_v2_parameter_values__value_id__get'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v2/parameters': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** List parameters from a selected PolicyEngine.py catalog */
    get: operations['list_parameters_v2_parameters_get'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v2/parameters/children': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * List one level of a catalog version's parameter tree
     * @description Lists the direct children of `parent_path` (the top level when empty). With `reform_changeable=true`, only the children a reform can change, sorted by label, with child counts that count only those. Invalid query parameters return 422, including a malformed policyengine_version, an unsupported country, and an unknown or repeated parameter. A catalog version without a tree (publication writes trees only for the versions it publishes and for the installed version with catalog format 2) returns 503 with a message naming it.
     */
    get: operations['list_parameter_children_v2_parameters_children_get'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v2/parameters/search-file': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Get a catalog version's parameter search file */
    get: operations['get_parameter_search_file_v2_parameters_search_file_get'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v2/parameters/{parameter_id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Get one parameter from a selected PolicyEngine.py catalog */
    get: operations['get_parameter_v2_parameters__parameter_id__get'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v2/policies': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** List immutable policies */
    get: operations['get_policies_v2_policies_get'];
    put?: never;
    /** Create or find an immutable policy */
    post: operations['create_policy_v2_policies_post'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v2/policies/{policy_id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Read one immutable policy */
    get: operations['get_policy_v2_policies__policy_id__get'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v2/regions': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** List regions from a selected PolicyEngine.py catalog */
    get: operations['list_regions_v2_regions_get'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v2/regions/by-code/{region_code}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Get one region by code from a selected catalog */
    get: operations['get_region_by_code_v2_regions_by_code__region_code__get'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v2/regions/{region_id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Get one region from a selected PolicyEngine.py catalog */
    get: operations['get_region_v2_regions__region_id__get'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v2/reports': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * List chosen reports
     * @description Lists the country's reports of both kinds among the report_id values (at most 25), in that order and once each, with their status and newest run but without economy results or household calculations. Unknown reports and other countries' are left out. Listing does not start the first run of an economy report that has none; reading it does.
     */
    get: operations['list_reports_v2_reports_get'];
    put?: never;
    /**
     * Submit an economy or household report
     * @description Creates the report, its simulations and its first run in the simulation service, on the country's current catalog version, and starts the run. Read the report to follow it. An economy report (kind economy) compares two policies across a region; a country without economy reports, such as a household-only one, is refused with 422 before anything is created. A household report (kind household) calculates a household stored through /v2/households under a baseline and an optional reform, for the household's default year; it needs the country's household calculations, which a household-only country has, and a household and policies of the country (404 otherwise) with a default year (422 otherwise), all checked before anything is created.
     */
    post: operations['submit_report_v2_reports_post'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v2/reports/by-legacy-number/{legacy_report_id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Find the report migrated from a v1 report number
     * @description Answers as reading the report by its ID, including starting the first run of a report that has none. 404 means no report of this country was migrated from that number.
     */
    get: operations['get_report_by_legacy_number_v2_reports_by_legacy_number__legacy_report_id__get'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v2/reports/{report_id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Read an economy or household report
     * @description Returns the report, its newest run and, once that run succeeded, its result: an economy report's result, or a household report's calculated households in the run's baseline and reform. An economy report with no run, such as one migrated from v1, is calculated the first time it is read: the read starts a run with the system trigger on the current catalog version and answers with it. If the simulation service cannot run it, the report is returned not run.
     */
    get: operations['get_report_v2_reports__report_id__get'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v2/reports/{report_id}/runs': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * List an economy report's runs
     * @description Every run of the report, newest first, each with the catalog version and PolicyEngine.py version it ran on. Only economy reports list their runs; a household report's newest run is in the report.
     */
    get: operations['list_report_runs_v2_reports__report_id__runs_get'];
    put?: never;
    /**
     * Run an economy or household report again
     * @description Runs the report on the country's current catalog version with the manual trigger, and answers with the new run. Simulation runs that already exist for that version and year are reused unless force is set, which calculates both simulations again; a household report reuses calculations that are unfinished or succeeded within the last 28 days. A country without economy reports, such as a household-only one, can run only its household reports again; its other report IDs are refused with 422, and a country without household calculations cannot run household reports again (422), before the simulation service is asked to run them.
     */
    post: operations['run_report_v2_reports__report_id__runs_post'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v2/shared-reports/{association_id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Read a saved report by its shareable link
     * @description Needs no credential: a saved report's ID is its link, and anyone holding it can read the report. The owner and the owner's saved-reform IDs are left out; the reform the report was compared with is named instead.
     */
    get: operations['get_shared_report_v2_shared_reports__association_id__get'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v2/tax-benefit-model-versions': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** List selected PolicyEngine.py model versions */
    get: operations['list_model_versions_v2_tax_benefit_model_versions_get'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v2/tax-benefit-model-versions/{version_id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Get one selected PolicyEngine.py model version */
    get: operations['get_model_version_v2_tax_benefit_model_versions__version_id__get'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v2/tax-benefit-models': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** List models for one PolicyEngine.py catalog */
    get: operations['list_models_v2_tax_benefit_models_get'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v2/tax-benefit-models/by-country/{country_id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Get a country model and selected PolicyEngine.py version */
    get: operations['get_model_by_country_v2_tax_benefit_models_by_country__country_id__get'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v2/tax-benefit-models/{model_id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Get one model from a selected PolicyEngine.py catalog */
    get: operations['get_model_v2_tax_benefit_models__model_id__get'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v2/user-households': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** List the current user's saved households */
    get: operations['get_user_households_v2_user_households_get'];
    put?: never;
    /**
     * Save a household for the current user
     * @description Requires a bearer access token or the PolicyEngine-Unauthenticated-User header; the owner is taken from that credential. Accepts legacy_household_id (a v1 household, checked in the v1 database) or household_id (a v2 household).
     */
    post: operations['create_user_household_v2_user_households_post'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v2/user-households/{association_id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Read one of the current user's saved households */
    get: operations['get_user_household_v2_user_households__association_id__get'];
    put?: never;
    post?: never;
    /** Delete one of the current user's saved households */
    delete: operations['delete_user_household_route_v2_user_households__association_id__delete'];
    options?: never;
    head?: never;
    /**
     * Update or repoint one of the current user's saved households
     * @description The row keeps its id, owner and creation time. Changing legacy_household_id repoints the row and re-resolves household_id from the Stage 11 copy mapping, or clears it. Changing household_id alone points the row at that v2 household, which must exist in the same country, and clears legacy_household_id. Supplied together, both are stored, and household_id must be the copy of legacy_household_id when one exists.
     */
    patch: operations['patch_user_household_route_v2_user_households__association_id__patch'];
    trace?: never;
  };
  '/v2/user-policies': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** List the current user's saved policies */
    get: operations['get_user_policies_v2_user_policies_get'];
    put?: never;
    /**
     * Save a policy for the current user
     * @description Requires a bearer access token or the PolicyEngine-Unauthenticated-User header; the owner is taken from that credential. Accepts legacy_policy_id (a v1 policy, checked in the v1 database) or policy_id (a v2 policy). When only legacy_policy_id is supplied, policy_id is filled from the Stage 10 mirror mapping when one exists.
     */
    post: operations['create_user_policy_v2_user_policies_post'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v2/user-policies/{association_id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Read one of the current user's saved policies */
    get: operations['get_user_policy_v2_user_policies__association_id__get'];
    put?: never;
    post?: never;
    /** Delete one of the current user's saved policies */
    delete: operations['delete_user_policy_route_v2_user_policies__association_id__delete'];
    options?: never;
    head?: never;
    /**
     * Update or repoint one of the current user's saved policies
     * @description The row keeps its id, owner and creation time. Changing legacy_policy_id repoints the row and re-resolves policy_id from the Stage 10 mirror mapping, or clears it. Changing policy_id alone points the row at that v2 policy, which must exist in the same country, and clears legacy_policy_id. Supplied together, both are stored, and policy_id must be the mirror copy of legacy_policy_id when one exists. Rows maintained by the v1 saved-policy mirror return 409.
     */
    patch: operations['patch_user_policy_route_v2_user_policies__association_id__patch'];
    trace?: never;
  };
  '/v2/user-reports': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** List the current user's saved reports */
    get: operations['get_user_reports_v2_user_reports_get'];
    put?: never;
    /**
     * Save a report for the current user
     * @description Requires a bearer access token or the PolicyEngine-Unauthenticated-User header; the owner is taken from that credential. The body names a v2 report (report_id), checked with the simulation service, a v1 report output (legacy_report_id), checked in the v1 database, or both; with both, the v2 report must be the one migrated from that v1 report output (400 otherwise). An optional user_policy_id must name the same user's saved policy in the same country.
     */
    post: operations['create_user_report_v2_user_reports_post'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v2/user-reports/{association_id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Read one of the current user's saved reports */
    get: operations['get_user_report_v2_user_reports__association_id__get'];
    put?: never;
    post?: never;
    /** Delete one of the current user's saved reports */
    delete: operations['delete_user_report_route_v2_user_reports__association_id__delete'];
    options?: never;
    head?: never;
    /** Update or repoint one of the current user's saved reports */
    patch: operations['patch_user_report_route_v2_user_reports__association_id__patch'];
    trace?: never;
  };
  '/v2/user-simulations': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** List the current user's saved simulations */
    get: operations['get_user_simulations_v2_user_simulations_get'];
    put?: never;
    /**
     * Save a simulation for the current user
     * @description Requires a bearer access token or the PolicyEngine-Unauthenticated-User header; the owner is taken from that credential. The body names a v2 simulation (simulation_id), checked with the simulation service, a v1 simulation (legacy_simulation_id), checked in the v1 database, or both; with both, the v2 simulation must be the one migrated from that v1 simulation (400 otherwise).
     */
    post: operations['create_user_simulation_v2_user_simulations_post'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v2/user-simulations/{association_id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Read one of the current user's saved simulations */
    get: operations['get_user_simulation_v2_user_simulations__association_id__get'];
    put?: never;
    post?: never;
    /** Delete one of the current user's saved simulations */
    delete: operations['delete_user_simulation_route_v2_user_simulations__association_id__delete'];
    options?: never;
    head?: never;
    /** Update or repoint one of the current user's saved simulations */
    patch: operations['patch_user_simulation_route_v2_user_simulations__association_id__patch'];
    trace?: never;
  };
  '/v2/variables': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** List variables from a selected PolicyEngine.py catalog */
    get: operations['list_variables_v2_variables_get'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v2/variables/{variable_id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Get one variable from a selected PolicyEngine.py catalog */
    get: operations['get_variable_v2_variables__variable_id__get'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
}
export type webhooks = Record<string, never>;
export interface components {
  schemas: {
    /**
     * AccountPatchRequest
     * @description Explicitly supplied account presentation fields.
     */
    AccountPatchRequest: {
      /** First Name */
      first_name?: string | null;
      /** Last Name */
      last_name?: string | null;
      /** Primary Country */
      primary_country?: ('us' | 'uk') | null;
    };
    /**
     * ComparisonItem
     * @description A report run's comparison step, which computes the report's result.
     */
    ComparisonItem: {
      /** Status */
      status: string;
      error: components['schemas']['RunErrorItem'] | null;
      /** Dispatched At */
      dispatched_at: string | null;
      /** Completed At */
      completed_at: string | null;
    };
    /**
     * CountryItem
     * @description One served country and the calculations it supports.
     *
     *     ``id`` is the value other v2 resources take as ``country_id``.
     *     ``household_enabled`` means household calculations and saved households
     *     are available; ``society_wide_enabled`` means society-wide reports are,
     *     and is only set for a country that is also household enabled.
     */
    CountryItem: {
      /** Id */
      id: string;
      /** Household Enabled */
      household_enabled: boolean;
      /** Society Wide Enabled */
      society_wide_enabled: boolean;
    };
    /**
     * CountryListResponse
     * @description Success envelope: ``status`` "ok", a null ``message`` and the countries.
     */
    CountryListResponse: {
      /**
       * Status
       * @default ok
       * @constant
       */
      status: 'ok';
      /** Message */
      message?: null;
      result: components['schemas']['CountryListResult'];
    };
    /**
     * CountryListResult
     * @description Every served country, ordered by ``id``.
     */
    CountryListResult: {
      /** Items */
      items: components['schemas']['CountryItem'][];
    };
    /**
     * EconomyReportCreateRequest
     * @description A new economy report; ``country_id`` must match the query's.
     *
     *     ``baseline`` and ``reform`` each name a v2 policy and dynamic, and an
     *     empty object means current law. Options are not accepted yet.
     */
    EconomyReportCreateRequest: {
      /**
       * @description discriminator enum property added by openapi-typescript
       * @enum {string}
       */
      kind: 'economy';
      /**
       * Year
       * @description The report's year
       */
      year: number;
      /** Region Code */
      region_code: string;
      /** Dataset Name */
      dataset_name?: string | null;
      baseline: components['schemas']['SimulationChoice'];
      reform: components['schemas']['SimulationChoice'];
      /**
       * Country Id
       * @description Supported PolicyEngine country ID
       * @enum {string}
       */
      country_id: 'us' | 'uk';
    };
    /**
     * EconomyReportRunRequest
     * @description A re-run of an economy or household report on the current catalog version.
     *
     *     ``{}`` reuses existing runs: an economy report's simulation runs for that
     *     version and year, or a household report's calculations that are
     *     unfinished or succeeded within the last 28 days. With ``force``, each of
     *     the report's simulations (one for a household report of the baseline
     *     alone) is calculated again as a new attempt.
     */
    EconomyReportRunRequest: {
      /**
       * Force
       * @default false
       */
      force: boolean;
    };
    FiniteJsonValue:
      | components['schemas']['FiniteJsonValue'][]
      | {
          [key: string]: components['schemas']['FiniteJsonValue'];
        }
      | string
      | boolean
      | number
      | null;
    /**
     * HealthResponse
     * @description Health-check result showing that the API is up and serving requests.
     */
    HealthResponse: {
      /**
       * Status
       * @constant
       */
      status: 'healthy';
    };
    /**
     * HouseholdCalculationAxis
     * @description One input varied across points.
     *
     *     The variable ``name`` takes ``count`` evenly spaced values from ``min`` to
     *     ``max`` in ``period`` (the household's ``default_year`` when omitted), for
     *     the entity member at position ``index`` (the first when omitted).
     */
    HouseholdCalculationAxis: {
      /** Name */
      name: string;
      /** Count */
      count: number;
      /** Min */
      min: number;
      /** Max */
      max: number;
      /** Period */
      period?: string | number | null;
      /** Index */
      index?: number | null;
    };
    /**
     * HouseholdCalculationError
     * @description Why a calculation failed; ``detail`` holds the calculation's own error.
     */
    HouseholdCalculationError: {
      /** Code */
      code: string;
      /** Message */
      message: string;
      /** Detail */
      detail: {
        [key: string]: components['schemas']['JsonValue'];
      } | null;
    };
    /**
     * HouseholdCalculationItem
     * @description A household calculation and its outcome.
     *
     *     ``status`` moves from ``pending`` through ``dispatching`` and ``running``
     *     to ``succeeded``, with ``result``, or ``failed``, with ``error``. Poll
     *     ``GET /v2/household-calculations/{calculation_id}`` until it is one of
     *     those two. ``catalog_version_id`` is the catalog version calculated.
     */
    HouseholdCalculationItem: {
      /**
       * Calculation Id
       * Format: uuid
       */
      calculation_id: string;
      /** Country Id */
      country_id: string;
      /**
       * Household Id
       * Format: uuid
       */
      household_id: string;
      /** Policy Id */
      policy_id: string | null;
      /** Year */
      year: number;
      /**
       * Catalog Version Id
       * Format: uuid
       */
      catalog_version_id: string;
      /**
       * Status
       * @enum {string}
       */
      status: 'pending' | 'dispatching' | 'running' | 'succeeded' | 'failed';
      /**
       * Created At
       * Format: date-time
       */
      created_at: string;
      /** Completed At */
      completed_at: string | null;
      result: components['schemas']['HouseholdCalculationOutput'] | null;
      error: components['schemas']['HouseholdCalculationError'] | null;
    };
    /**
     * HouseholdCalculationOutput
     * @description A succeeded calculation's household.
     *
     *     ``household`` is the stored household in the situation shape (people and
     *     groups keyed by their record IDs) with each calculated value filled in by
     *     period. ``warnings`` lists inputs the country model ignored. In the US,
     *     ``spm_config`` is the SPM selection the calculation applied and
     *     ``spm_provenance`` its receipt; both are null elsewhere.
     *     ``policyengine_version`` is the PolicyEngine.py version that calculated it.
     */
    HouseholdCalculationOutput: {
      /** Household */
      household: {
        [key: string]: components['schemas']['JsonValue'];
      };
      /** Warnings */
      warnings: string[];
      /** Spm Config */
      spm_config: {
        [key: string]: components['schemas']['JsonValue'];
      } | null;
      /** Spm Provenance */
      spm_provenance: {
        [key: string]: components['schemas']['JsonValue'];
      } | null;
      /** Policyengine Version */
      policyengine_version: string | null;
    };
    /**
     * HouseholdCalculationRequest
     * @description A stored household to calculate under a stored policy, or current law.
     *
     *     ``household_id`` and ``policy_id`` name records of ``country_id`` stored
     *     through ``/v2/households`` and ``/v2/policies``; without ``policy_id`` the
     *     household is calculated under current law, for the household's
     *     ``default_year``. Each group in ``axes`` varies its inputs together across
     *     ``count`` points; several groups form a grid of at most 10,000 points.
     *     ``add_missing_variables`` adds every variable the household lacks before
     *     calculating. An identical calculation that succeeded in the last 28 days
     *     is returned again instead of being repeated.
     */
    HouseholdCalculationRequest: {
      /**
       * Country Id
       * @description Supported PolicyEngine country ID
       * @enum {string}
       */
      country_id: 'us' | 'uk';
      /**
       * Household Id
       * Format: uuid
       */
      household_id: string;
      /** Policy Id */
      policy_id?: string | null;
      /** Axes */
      axes?: components['schemas']['HouseholdCalculationAxis'][][] | null;
      /**
       * Add Missing Variables
       * @default false
       */
      add_missing_variables: boolean;
    };
    /**
     * HouseholdCalculationResponse
     * @description Success envelope: ``status`` "ok", a null ``message`` and the calculation.
     */
    HouseholdCalculationResponse: {
      /**
       * Status
       * @default ok
       * @constant
       */
      status: 'ok';
      /** Message */
      message?: null;
      result: components['schemas']['HouseholdCalculationItem'];
    };
    /**
     * HouseholdCreateRequest
     * @description Native immutable household content with no presentation or model fields.
     */
    HouseholdCreateRequest: {
      /**
       * Country Id
       * @description Supported PolicyEngine country ID
       * @enum {string}
       */
      country_id: 'us' | 'uk';
      /**
       * Default Year
       * @description Default year for values without explicit period keys
       */
      default_year: number;
      /** Household Data */
      household_data:
        | components['schemas']['USHouseholdDocument-Input']
        | components['schemas']['UKHouseholdDocument'];
    };
    /**
     * HouseholdDetailResponse
     * @description Success response holding one household.
     */
    HouseholdDetailResponse: {
      /**
       * Status
       * @default ok
       * @constant
       */
      status: 'ok';
      /** Message */
      message?: null;
      result: components['schemas']['HouseholdDetailResult'];
    };
    /**
     * HouseholdDetailResult
     * @description Result holding one household in ``item``.
     */
    HouseholdDetailResult: {
      item: components['schemas']['HouseholdItem'];
    };
    /**
     * HouseholdEntityRecord
     * @description One group entity in a household, such as a tax unit or a benefit unit.
     *
     *     ``id`` is unique within its collection and is what people's ``memberships``
     *     refer to. ``values`` maps variable names to values, and ``source_name``
     *     optionally keeps the entity's original name, such as its key in a v1 household.
     */
    HouseholdEntityRecord: {
      /** Id */
      id: string;
      /** Source Name */
      source_name?: string | null;
      /** Values */
      values: {
        [key: string]: components['schemas']['JsonValue'];
      };
    };
    /**
     * HouseholdItem
     * @description A stored household.
     *
     *     Households are immutable and deduplicated: creating one with identical
     *     content returns the existing household and its ``id``.
     */
    HouseholdItem: {
      /**
       * Id
       * Format: uuid
       */
      id: string;
      /**
       * Country Id
       * @description Supported PolicyEngine country ID
       * @enum {string}
       */
      country_id: 'us' | 'uk';
      /** Default Year */
      default_year: number | null;
      /** Household Data */
      household_data:
        | components['schemas']['USHouseholdDocument-Output']
        | components['schemas']['UKHouseholdDocument'];
      /**
       * Created At
       * Format: date-time
       */
      created_at: string;
      /**
       * Updated At
       * Format: date-time
       */
      updated_at: string;
    };
    /**
     * HouseholdPageResponse
     * @description Success response holding one page of households.
     */
    HouseholdPageResponse: {
      /**
       * Status
       * @default ok
       * @constant
       */
      status: 'ok';
      /** Message */
      message?: null;
      result: components['schemas']['HouseholdPageResult'];
    };
    /**
     * HouseholdPageResult
     * @description One page of households, oldest first.
     *
     *     ``offset`` and ``limit`` echo the request; when ``has_more`` is true, ask
     *     for the next page with ``offset + limit``.
     */
    HouseholdPageResult: {
      /** Items */
      items: components['schemas']['HouseholdItem'][];
      /** Offset */
      offset: number;
      /** Limit */
      limit: number;
      /** Has More */
      has_more: boolean;
    };
    /**
     * HouseholdPersonRecord
     * @description One person in a household.
     *
     *     ``memberships`` maps each of the country's entity collections to the ``id``
     *     of the group the person belongs to, and must name every collection.
     */
    HouseholdPersonRecord: {
      /** Id */
      id: string;
      /** Source Name */
      source_name?: string | null;
      /** Values */
      values: {
        [key: string]: components['schemas']['JsonValue'];
      };
      /** Memberships */
      memberships: {
        [key: string]: string;
      };
    };
    /**
     * HouseholdPolicyChoice
     * @description A stored v2 policy of the report's country, or none for current law.
     */
    HouseholdPolicyChoice: {
      /** Policy Id */
      policy_id?: string | null;
    };
    /**
     * HouseholdReportCalculationErrorItem
     * @description Why a household calculation failed.
     *
     *     ``code`` is ``household_calculation_failed`` when the household function
     *     refused the inputs, with its error in ``detail``; ``worker_error``,
     *     ``worker_timeout`` or ``dispatch_abandoned`` otherwise.
     */
    HouseholdReportCalculationErrorItem: {
      /** Code */
      code: string;
      /** Message */
      message: string;
      /** Detail */
      detail: {
        [key: string]: components['schemas']['JsonValue'];
      } | null;
    };
    /**
     * HouseholdReportCalculationItem
     * @description One calculation of the household under one policy (a simulation run).
     *
     *     A null ``policy_id`` means current law. ``status`` is ``pending``,
     *     ``dispatching``, ``running``, ``succeeded`` or ``failed``; ``attempt``
     *     counts forced recalculations. ``result`` is set once it succeeded and
     *     ``error`` once it failed.
     */
    HouseholdReportCalculationItem: {
      /**
       * Id
       * Format: uuid
       */
      id: string;
      /**
       * Simulation Id
       * Format: uuid
       */
      simulation_id: string;
      /** Policy Id */
      policy_id: string | null;
      /** Status */
      status: string;
      /** Attempt */
      attempt: number;
      /** Trigger */
      trigger: string;
      error: components['schemas']['HouseholdReportCalculationErrorItem'] | null;
      result: components['schemas']['HouseholdReportCalculationResultItem'] | null;
      /** Dispatched At */
      dispatched_at: string | null;
      /** Completed At */
      completed_at: string | null;
      /**
       * Created At
       * Format: date-time
       */
      created_at: string;
    };
    /**
     * HouseholdReportCalculationResultItem
     * @description The household with each requested value filled in, in its own key order.
     *
     *     ``spm_config`` is the SPM selection applied and ``spm_provenance`` its
     *     receipt, both null for a country without SPM.
     */
    HouseholdReportCalculationResultItem: {
      /** Household */
      household: {
        [key: string]: components['schemas']['JsonValue'];
      };
      /** Warnings */
      warnings: string[];
      /** Spm Config */
      spm_config: {
        [key: string]: components['schemas']['JsonValue'];
      } | null;
      /** Spm Provenance */
      spm_provenance: {
        [key: string]: components['schemas']['JsonValue'];
      } | null;
    };
    /**
     * HouseholdReportCreateRequest
     * @description A new household report; ``country_id`` must match the query's.
     *
     *     ``baseline`` and ``reform`` each name a v2 policy of the country, and an
     *     empty object means current law; ``reform`` is null for a report of the
     *     baseline alone. It is calculated for the household's ``default_year``;
     *     with ``add_missing_variables``, each calculation also adds every yearly,
     *     monthly and eternal variable the household lacks, as ``/calculate-full``
     *     does. A re-run keeps the choice made when the report was created.
     */
    HouseholdReportCreateRequest: {
      /**
       * @description discriminator enum property added by openapi-typescript
       * @enum {string}
       */
      kind: 'household';
      /**
       * Household Id
       * Format: uuid
       * @description Exact resource UUID
       */
      household_id: string;
      baseline: components['schemas']['HouseholdPolicyChoice'];
      reform?: components['schemas']['HouseholdPolicyChoice'] | null;
      /**
       * Add Missing Variables
       * @default false
       */
      add_missing_variables: boolean;
      /**
       * Country Id
       * @description Supported PolicyEngine country ID
       * @enum {string}
       */
      country_id: 'us' | 'uk';
    };
    /**
     * HouseholdReportItem
     * @description A household report with its newest run and that run's calculations.
     */
    HouseholdReportItem: {
      /**
       * Id
       * Format: uuid
       */
      id: string;
      /** Country Id */
      country_id: string;
      /**
       * @description discriminator enum property added by openapi-typescript
       * @enum {string}
       */
      kind: 'household';
      /** Year */
      year: number;
      /** Household Id */
      household_id: string | null;
      /**
       * Baseline Simulation Id
       * Format: uuid
       */
      baseline_simulation_id: string;
      /** Reform Simulation Id */
      reform_simulation_id: string | null;
      status: components['schemas']['ReportStatus'];
      run: components['schemas']['HouseholdReportRunItem'] | null;
    };
    /**
     * HouseholdReportRunItem
     * @description One calculation of a household report: the baseline's and the reform's.
     *
     *     ``reform`` is null for a report of the baseline alone.
     */
    HouseholdReportRunItem: {
      /**
       * @description discriminator enum property added by openapi-typescript
       * @enum {string}
       */
      kind: 'household';
      /**
       * Id
       * Format: uuid
       */
      id: string;
      /**
       * Report Id
       * Format: uuid
       */
      report_id: string;
      /** Trigger */
      trigger: string;
      /**
       * Tax Benefit Model Version Id
       * Format: uuid
       */
      tax_benefit_model_version_id: string;
      /** Policyengine Version */
      policyengine_version: string | null;
      /** Year */
      year: number;
      status: components['schemas']['ReportStatus'];
      baseline: components['schemas']['HouseholdReportCalculationItem'];
      reform: components['schemas']['HouseholdReportCalculationItem'] | null;
    };
    /**
     * HouseholdReportRunSummaryItem
     * @description One calculation of a household report, without its calculations.
     *
     *     ``trigger`` is ``initial`` for the run a submission starts and ``manual``
     *     for a re-run. ``tax_benefit_model_version_id`` and ``policyengine_version``
     *     name the catalog version it ran on.
     */
    HouseholdReportRunSummaryItem: {
      /**
       * Kind
       * @default household
       * @constant
       */
      kind: 'household';
      /**
       * Id
       * Format: uuid
       */
      id: string;
      /**
       * Report Id
       * Format: uuid
       */
      report_id: string;
      /** Trigger */
      trigger: string;
      /**
       * Tax Benefit Model Version Id
       * Format: uuid
       */
      tax_benefit_model_version_id: string;
      /** Policyengine Version */
      policyengine_version: string | null;
      /** Year */
      year: number;
      status: components['schemas']['ReportStatus'];
    };
    /**
     * HouseholdReportSummaryItem
     * @description A household report: a stored household under a baseline and a reform.
     *
     *     The report is for the household's ``default_year``. ``status`` is the
     *     newest run's, or ``not_run`` before the first run, when ``household_id`` is
     *     not known either. ``reform_simulation_id`` is null for a report of the
     *     baseline alone.
     */
    HouseholdReportSummaryItem: {
      /**
       * Id
       * Format: uuid
       */
      id: string;
      /** Country Id */
      country_id: string;
      /**
       * @description discriminator enum property added by openapi-typescript
       * @enum {string}
       */
      kind: 'household';
      /** Year */
      year: number;
      /** Household Id */
      household_id: string | null;
      /**
       * Baseline Simulation Id
       * Format: uuid
       */
      baseline_simulation_id: string;
      /** Reform Simulation Id */
      reform_simulation_id: string | null;
      status: components['schemas']['ReportStatus'];
      run: components['schemas']['HouseholdReportRunSummaryItem'] | null;
    };
    JsonValue: unknown;
    /**
     * MeDetailResponse
     * @description Success response holding the current user.
     */
    MeDetailResponse: {
      /**
       * Status
       * @default ok
       * @constant
       */
      status: 'ok';
      /** Message */
      message?: null;
      result: components['schemas']['MeDetailResult'];
    };
    /**
     * MeDetailResult
     * @description Result holding the current user in ``item``.
     */
    MeDetailResult: {
      item: components['schemas']['MeItem'];
    };
    /**
     * MeExportResponse
     * @description Success response holding the current user's export.
     */
    MeExportResponse: {
      /**
       * Status
       * @default ok
       * @constant
       */
      status: 'ok';
      /** Message */
      message?: null;
      result: components['schemas']['MeExportResult'];
    };
    /**
     * MeExportResult
     * @description The current user and every policy, household, simulation and report it saved.
     *
     *     The export covers every country, not only the requested one.
     */
    MeExportResult: {
      user: components['schemas']['MeItem'] | null;
      /** Policies */
      policies: components['schemas']['UserPolicyItem'][];
      /** Households */
      households: components['schemas']['UserHouseholdItem'][];
      /** Simulations */
      simulations: components['schemas']['UserSimulationItem'][];
      /** Reports */
      reports: components['schemas']['UserReportItem'][];
    };
    /**
     * MeItem
     * @description The current user: a signed-in account or a browser's unauthenticated user.
     *
     *     ``user_type`` says which. An unauthenticated user has no primary country, and
     *     only a signed-in user can set its names or primary country.
     */
    MeItem: {
      /**
       * Id
       * Format: uuid
       */
      id: string;
      /**
       * User Type
       * @enum {string}
       */
      user_type: 'unauthenticated' | 'standard';
      /** Primary Country */
      primary_country: ('us' | 'uk') | null;
      /** First Name */
      first_name: string | null;
      /** Last Name */
      last_name: string | null;
      /** Email */
      email: string | null;
      /**
       * Created At
       * Format: date-time
       */
      created_at: string;
    };
    /**
     * MeUpgradeResponse
     * @description Success response holding the signed-in account after an upgrade.
     */
    MeUpgradeResponse: {
      /**
       * Status
       * @default ok
       * @constant
       */
      status: 'ok';
      /** Message */
      message?: null;
      result: components['schemas']['MeUpgradeResult'];
    };
    /**
     * MeUpgradeResult
     * @description The signed-in account after a browser's unauthenticated user moved into it.
     *
     *     ``outcome`` is ``converted`` when the unauthenticated user became the account
     *     in place, ``merged`` when its records moved to an existing account, and
     *     ``none`` when there was no unauthenticated user to move.
     */
    MeUpgradeResult: {
      item: components['schemas']['MeItem'];
      /**
       * Outcome
       * @enum {string}
       */
      outcome: 'converted' | 'merged' | 'none';
    };
    /**
     * MetadataCanonicalParameterValue
     * @description One current-law value of a parameter.
     *
     *     The value applies from start_date until end_date, or indefinitely when
     *     end_date is null.
     */
    MetadataCanonicalParameterValue: {
      /**
       * Id
       * Format: uuid
       */
      id: string;
      /**
       * Parameter Id
       * Format: uuid
       */
      parameter_id: string;
      value: components['schemas']['JsonValue'];
      /**
       * Start Date
       * Format: date-time
       */
      start_date: string;
      /** End Date */
      end_date: string | null;
    };
    /**
     * MetadataCatalogParameter
     * @description A parameter with its current-law values in start-date order.
     */
    MetadataCatalogParameter: {
      /**
       * Id
       * Format: uuid
       */
      id: string;
      /** Name */
      name: string;
      /** Label */
      label: string | null;
      /** Description */
      description: string | null;
      /** Data Type */
      data_type: string | null;
      /** Unit */
      unit: string | null;
      /** Economy */
      economy: boolean | null;
      /** Household */
      household: boolean | null;
      /** Values */
      values: components['schemas']['MetadataDatedValue'][];
    };
    /**
     * MetadataCatalogParametersResponse
     * @description Success response holding parameters fetched by name, with their values.
     */
    MetadataCatalogParametersResponse: {
      /**
       * Status
       * @default ok
       * @constant
       */
      status: 'ok';
      /** Message */
      message?: null;
      result: components['schemas']['MetadataCatalogParametersResult'];
    };
    /**
     * MetadataCatalogParametersResult
     * @description Requested parameters of one catalog version, in name order.
     *
     *     node_labels maps each ancestor of a requested parameter that the version
     *     stores as a parameter node to the node's stored label (null when it has
     *     none), for breadcrumbs; a bracket index such as ``rates[0]`` counts as a
     *     child of its schedule ``rates``. missing_names lists requested names the
     *     version has no parameter for.
     */
    MetadataCatalogParametersResult: {
      /** Policyengine Version */
      policyengine_version: string;
      /** Catalog Format */
      catalog_format: number | null;
      /** Parameters */
      parameters: components['schemas']['MetadataCatalogParameter'][];
      /** Node Labels */
      node_labels: {
        [key: string]: string | null;
      };
      /** Missing Names */
      missing_names: string[];
    };
    /**
     * MetadataCatalogVariablesResponse
     * @description Success response holding every variable of one catalog version.
     */
    MetadataCatalogVariablesResponse: {
      /**
       * Status
       * @default ok
       * @constant
       */
      status: 'ok';
      /** Message */
      message?: null;
      result: components['schemas']['MetadataCatalogVariablesResult'];
    };
    /**
     * MetadataCatalogVariablesResult
     * @description Every variable of one catalog version, in name order.
     *
     *     part_parameter_values has an entry for each parameter path a variable's
     *     adds_parameter_path or subtracts_parameter_path names: that parameter's
     *     current-law values in start-date order, or an empty list when the
     *     catalog has no such parameter.
     */
    MetadataCatalogVariablesResult: {
      /** Policyengine Version */
      policyengine_version: string;
      /** Catalog Format */
      catalog_format: number | null;
      /** Variables */
      variables: components['schemas']['MetadataVariable'][];
      /** Part Parameter Values */
      part_parameter_values: {
        [key: string]: components['schemas']['MetadataDatedValue'][];
      };
    };
    /**
     * MetadataDataset
     * @description A named input dataset available to the selected model version.
     *
     *     These datasets are logical inputs, so storage_path is always null and
     *     is_output_dataset is always false.
     */
    MetadataDataset: {
      /**
       * Id
       * Format: uuid
       */
      id: string;
      /** Name */
      name: string;
      /** Description */
      description: string | null;
      /** Year */
      year: number;
      /** Storage Path */
      storage_path?: null;
      /**
       * Is Output Dataset
       * @default false
       * @constant
       */
      is_output_dataset: false;
    };
    /**
     * MetadataDatasetDetailResponse
     * @description Success response holding one dataset.
     */
    MetadataDatasetDetailResponse: {
      /**
       * Status
       * @default ok
       * @constant
       */
      status: 'ok';
      /** Message */
      message?: null;
      result: components['schemas']['MetadataDetailResult_MetadataDataset_'];
    };
    /**
     * MetadataDatasetOption
     * @description The national dataset, offered as the default for an economy calculation.
     */
    MetadataDatasetOption: {
      /** Name */
      name: string;
      /** Label */
      label: string;
      /**
       * Default
       * @default true
       * @constant
       */
      default: true;
    };
    /**
     * MetadataDatasetPageResponse
     * @description Success response holding one page of datasets.
     */
    MetadataDatasetPageResponse: {
      /**
       * Status
       * @default ok
       * @constant
       */
      status: 'ok';
      /** Message */
      message?: null;
      result: components['schemas']['MetadataPageResult_MetadataDataset_'];
    };
    /**
     * MetadataDatedValue
     * @description A current-law parameter value from start_date until end_date.
     *
     *     A null end_date means the value applies until a later value starts, or
     *     indefinitely.
     */
    MetadataDatedValue: {
      /**
       * Start Date
       * Format: date-time
       */
      start_date: string;
      /** End Date */
      end_date: string | null;
      value: components['schemas']['JsonValue'];
    };
    /** MetadataDetailResult[MetadataCanonicalParameterValue] */
    MetadataDetailResult_MetadataCanonicalParameterValue_: {
      /** Policyengine Version */
      policyengine_version: string;
      item: components['schemas']['MetadataCanonicalParameterValue'];
    };
    /** MetadataDetailResult[MetadataDataset] */
    MetadataDetailResult_MetadataDataset_: {
      /** Policyengine Version */
      policyengine_version: string;
      item: components['schemas']['MetadataDataset'];
    };
    /** MetadataDetailResult[MetadataModelVersionDetail] */
    MetadataDetailResult_MetadataModelVersionDetail_: {
      /** Policyengine Version */
      policyengine_version: string;
      item: components['schemas']['MetadataModelVersionDetail'];
    };
    /** MetadataDetailResult[MetadataModel] */
    MetadataDetailResult_MetadataModel_: {
      /** Policyengine Version */
      policyengine_version: string;
      item: components['schemas']['MetadataModel'];
    };
    /** MetadataDetailResult[MetadataParameterSummary] */
    MetadataDetailResult_MetadataParameterSummary_: {
      /** Policyengine Version */
      policyengine_version: string;
      item: components['schemas']['MetadataParameterSummary'];
    };
    /** MetadataDetailResult[MetadataRegion] */
    MetadataDetailResult_MetadataRegion_: {
      /** Policyengine Version */
      policyengine_version: string;
      item: components['schemas']['MetadataRegion'];
    };
    /** MetadataDetailResult[MetadataVariable] */
    MetadataDetailResult_MetadataVariable_: {
      /** Policyengine Version */
      policyengine_version: string;
      item: components['schemas']['MetadataVariable'];
    };
    /**
     * MetadataEconomyOptions
     * @description The region, year and dataset choices for an economy calculation.
     *
     *     Every list is empty for a catalog without regions, such as a
     *     household-only country's, which offers no economy calculation.
     */
    MetadataEconomyOptions: {
      /** Region */
      region: components['schemas']['MetadataRegionOption'][];
      /** Time Period */
      time_period: components['schemas']['MetadataTimePeriodOption'][];
      /** Datasets */
      datasets: components['schemas']['MetadataDatasetOption'][];
    };
    /**
     * MetadataEconomyOptionsResponse
     * @description Success response holding the options for configuring an economy comparison.
     */
    MetadataEconomyOptionsResponse: {
      /**
       * Status
       * @default ok
       * @constant
       */
      status: 'ok';
      /** Message */
      message?: null;
      result: components['schemas']['MetadataEconomyOptionsResult'];
    };
    /**
     * MetadataEconomyOptionsResult
     * @description The choices for configuring an economy calculation.
     *
     *     It lists the selectable regions, years and datasets, and the id of the
     *     current-law policy to use as a baseline.
     */
    MetadataEconomyOptionsResult: {
      /** Policyengine Version */
      policyengine_version: string;
      /** Current Law Id */
      current_law_id: number;
      /** Region */
      region: components['schemas']['MetadataRegionOption'][];
      /** Time Period */
      time_period: components['schemas']['MetadataTimePeriodOption'][];
      /** Datasets */
      datasets: components['schemas']['MetadataDatasetOption'][];
    };
    /**
     * MetadataEntity
     * @description A kind of member a household holds, such as a person or a tax unit.
     *
     *     plural is the key the household's members of this kind are listed under,
     *     and is_person marks the entity every household input about a person uses.
     */
    MetadataEntity: {
      /** Key */
      key: string;
      /** Plural */
      plural: string;
      /** Is Person */
      is_person: boolean;
    };
    /**
     * MetadataEnumValue
     * @description One value of an enum variable: its stored name and its display label.
     *
     *     The label keeps the type the country package declares it with.
     */
    MetadataEnumValue: {
      /** Value */
      value: string;
      /** Label */
      label: string | number | boolean | null;
    };
    /**
     * MetadataModel
     * @description A country's tax-benefit model in the selected PolicyEngine.py catalog.
     */
    MetadataModel: {
      /**
       * Id
       * Format: uuid
       */
      id: string;
      /** Name */
      name: string;
      /** Description */
      description: string | null;
    };
    /**
     * MetadataModelCatalogResponse
     * @description Success response holding the small parts of one catalog version.
     */
    MetadataModelCatalogResponse: {
      /**
       * Status
       * @default ok
       * @constant
       */
      status: 'ok';
      /** Message */
      message?: null;
      result: components['schemas']['MetadataModelCatalogResult'];
    };
    /**
     * MetadataModelCatalogResult
     * @description The small parts of one catalog version, read when a client starts.
     *
     *     policyengine_version names the selected catalog version, so a client can
     *     request its other parts for that exact version. catalog_format is null,
     *     and entities and basic_inputs are empty, for a version published before
     *     catalog format 2. ``spm`` says whether the version offers SPM settings.
     *     Variables, parameters and their values are served by their own routes.
     */
    MetadataModelCatalogResult: {
      /** Policyengine Version */
      policyengine_version: string;
      /** Catalog Format */
      catalog_format: number | null;
      model: components['schemas']['MetadataModel'];
      model_version: components['schemas']['MetadataModelVersionDetail'];
      /** Entities */
      entities: components['schemas']['MetadataEntity'][];
      /** Basic Inputs */
      basic_inputs: string[];
      /** Regions */
      regions: components['schemas']['MetadataRegion'][];
      /** Datasets */
      datasets: components['schemas']['MetadataDataset'][];
      economy_options: components['schemas']['MetadataEconomyOptions'];
      spm: components['schemas']['MetadataSPMAvailability'];
    };
    /**
     * MetadataModelDetailResponse
     * @description Success response holding one tax-benefit model.
     */
    MetadataModelDetailResponse: {
      /**
       * Status
       * @default ok
       * @constant
       */
      status: 'ok';
      /** Message */
      message?: null;
      result: components['schemas']['MetadataDetailResult_MetadataModel_'];
    };
    /**
     * MetadataModelPageResponse
     * @description Success response holding a page of the selected catalog's tax-benefit models.
     *
     *     A catalog has one model per country, so only the first page has an item.
     */
    MetadataModelPageResponse: {
      /**
       * Status
       * @default ok
       * @constant
       */
      status: 'ok';
      /** Message */
      message?: null;
      result: components['schemas']['MetadataPageResult_MetadataModel_'];
    };
    /**
     * MetadataModelSelectionResponse
     * @description Success response holding a country's model and its selected model version.
     */
    MetadataModelSelectionResponse: {
      /**
       * Status
       * @default ok
       * @constant
       */
      status: 'ok';
      /** Message */
      message?: null;
      result: components['schemas']['MetadataModelSelectionResult'];
    };
    /**
     * MetadataModelSelectionResult
     * @description A country's model together with the model version selected for the request.
     */
    MetadataModelSelectionResult: {
      /** Policyengine Version */
      policyengine_version: string;
      model: components['schemas']['MetadataModel'];
      model_version: components['schemas']['MetadataModelVersionDetail'];
    };
    /**
     * MetadataModelVersionDetail
     * @description A model version, with its current-law policy id and the years offered.
     */
    MetadataModelVersionDetail: {
      /**
       * Id
       * Format: uuid
       */
      id: string;
      /**
       * Model Id
       * Format: uuid
       */
      model_id: string;
      /** Version */
      version: string;
      /** Description */
      description: string | null;
      /** Current Law Id */
      current_law_id: number;
      /** Metadata Time Periods */
      metadata_time_periods: number[];
    };
    /**
     * MetadataModelVersionDetailResponse
     * @description Success response holding one model version.
     */
    MetadataModelVersionDetailResponse: {
      /**
       * Status
       * @default ok
       * @constant
       */
      status: 'ok';
      /** Message */
      message?: null;
      result: components['schemas']['MetadataDetailResult_MetadataModelVersionDetail_'];
    };
    /**
     * MetadataModelVersionPageResponse
     * @description Success response holding a page of the selected catalog's model versions.
     *
     *     A catalog has one model version, so only the first page has an item.
     */
    MetadataModelVersionPageResponse: {
      /**
       * Status
       * @default ok
       * @constant
       */
      status: 'ok';
      /** Message */
      message?: null;
      result: components['schemas']['MetadataPageResult_MetadataModelVersionDetail_'];
    };
    /** MetadataPageResult[MetadataCanonicalParameterValue] */
    MetadataPageResult_MetadataCanonicalParameterValue_: {
      /** Policyengine Version */
      policyengine_version: string;
      /** Items */
      items: components['schemas']['MetadataCanonicalParameterValue'][];
      /** Offset */
      offset: number;
      /** Limit */
      limit: number;
      /** Has More */
      has_more: boolean;
    };
    /** MetadataPageResult[MetadataDataset] */
    MetadataPageResult_MetadataDataset_: {
      /** Policyengine Version */
      policyengine_version: string;
      /** Items */
      items: components['schemas']['MetadataDataset'][];
      /** Offset */
      offset: number;
      /** Limit */
      limit: number;
      /** Has More */
      has_more: boolean;
    };
    /** MetadataPageResult[MetadataModelVersionDetail] */
    MetadataPageResult_MetadataModelVersionDetail_: {
      /** Policyengine Version */
      policyengine_version: string;
      /** Items */
      items: components['schemas']['MetadataModelVersionDetail'][];
      /** Offset */
      offset: number;
      /** Limit */
      limit: number;
      /** Has More */
      has_more: boolean;
    };
    /** MetadataPageResult[MetadataModel] */
    MetadataPageResult_MetadataModel_: {
      /** Policyengine Version */
      policyengine_version: string;
      /** Items */
      items: components['schemas']['MetadataModel'][];
      /** Offset */
      offset: number;
      /** Limit */
      limit: number;
      /** Has More */
      has_more: boolean;
    };
    /** MetadataPageResult[MetadataParameterChild] */
    MetadataPageResult_MetadataParameterChild_: {
      /** Policyengine Version */
      policyengine_version: string;
      /** Items */
      items: components['schemas']['MetadataParameterChild'][];
      /** Offset */
      offset: number;
      /** Limit */
      limit: number;
      /** Has More */
      has_more: boolean;
    };
    /** MetadataPageResult[MetadataParameterSummary] */
    MetadataPageResult_MetadataParameterSummary_: {
      /** Policyengine Version */
      policyengine_version: string;
      /** Items */
      items: components['schemas']['MetadataParameterSummary'][];
      /** Offset */
      offset: number;
      /** Limit */
      limit: number;
      /** Has More */
      has_more: boolean;
    };
    /** MetadataPageResult[MetadataRegion] */
    MetadataPageResult_MetadataRegion_: {
      /** Policyengine Version */
      policyengine_version: string;
      /** Items */
      items: components['schemas']['MetadataRegion'][];
      /** Offset */
      offset: number;
      /** Limit */
      limit: number;
      /** Has More */
      has_more: boolean;
    };
    /** MetadataPageResult[MetadataVariable] */
    MetadataPageResult_MetadataVariable_: {
      /** Policyengine Version */
      policyengine_version: string;
      /** Items */
      items: components['schemas']['MetadataVariable'][];
      /** Offset */
      offset: number;
      /** Limit */
      limit: number;
      /** Has More */
      has_more: boolean;
    };
    /**
     * MetadataParameterChild
     * @description A direct child in the parameter tree.
     *
     *     A node has a child_count; a parameter leaf carries the parameter's summary.
     */
    MetadataParameterChild: {
      /** Path */
      path: string;
      /** Label */
      label: string;
      /**
       * Type
       * @enum {string}
       */
      type: 'node' | 'parameter';
      /** Child Count */
      child_count?: number | null;
      parameter?: components['schemas']['MetadataParameterSummary'] | null;
    };
    /**
     * MetadataParameterChildPageResponse
     * @description Success response holding one page of a parameter path's direct children.
     */
    MetadataParameterChildPageResponse: {
      /**
       * Status
       * @default ok
       * @constant
       */
      status: 'ok';
      /** Message */
      message?: null;
      result: components['schemas']['MetadataPageResult_MetadataParameterChild_'];
    };
    /**
     * MetadataParameterDetailResponse
     * @description Success response holding one parameter.
     */
    MetadataParameterDetailResponse: {
      /**
       * Status
       * @default ok
       * @constant
       */
      status: 'ok';
      /** Message */
      message?: null;
      result: components['schemas']['MetadataDetailResult_MetadataParameterSummary_'];
    };
    /**
     * MetadataParameterPageResponse
     * @description Success response holding one page of parameters.
     */
    MetadataParameterPageResponse: {
      /**
       * Status
       * @default ok
       * @constant
       */
      status: 'ok';
      /** Message */
      message?: null;
      result: components['schemas']['MetadataPageResult_MetadataParameterSummary_'];
    };
    /**
     * MetadataParameterSearchFileContent
     * @description One catalog version's parameter search file, ordered by path.
     *
     *     It holds what v3's parameter search reads, without the catalog's values.
     *     A reader applies v1's label fallback where a label is null.
     */
    MetadataParameterSearchFileContent: {
      /** Format */
      format: number;
      /** Country Id */
      country_id: string;
      /** Policyengine Version */
      policyengine_version: string;
      /** Parameters */
      parameters: components['schemas']['MetadataParameterSearchFileParameter'][];
      /** Other Parameters */
      other_parameters: components['schemas']['MetadataParameterSearchFileLabel'][];
      /** Nodes */
      nodes: components['schemas']['MetadataParameterSearchFileNode'][];
    };
    /**
     * MetadataParameterSearchFileEditabilityChange
     * @description From ``start_date`` (an ISO date), whether a draft can edit the value.
     */
    MetadataParameterSearchFileEditabilityChange: {
      /**
       * Start Date
       * Format: date
       */
      start_date: string;
      /** Editable */
      editable: boolean;
    };
    /**
     * MetadataParameterSearchFileLabel
     * @description Another parameter under ``gov``: its path and stored label, or null.
     */
    MetadataParameterSearchFileLabel: {
      /** Path */
      path: string;
      /** Label */
      label: string | null;
    };
    /**
     * MetadataParameterSearchFileNode
     * @description ``gov`` or a node under it that has a stored label.
     */
    MetadataParameterSearchFileNode: {
      /** Path */
      path: string;
      /** Label */
      label: string;
    };
    /**
     * MetadataParameterSearchFileParameter
     * @description A parameter a reform can change, with what v3's search indexes.
     *
     *     ``label`` is the stored label, or null when none is stored. ``editable``
     *     says whether a draft can edit the earliest current-law value (a number, a
     *     yes/no value or an infinite threshold); ``editable_changes``, present only
     *     when that changes over time and never null, lists the dates from which it
     *     changes.
     */
    MetadataParameterSearchFileParameter: {
      /** Path */
      path: string;
      /** Label */
      label: string | null;
      /** Unit */
      unit: string | null;
      /** Description */
      description: string | null;
      /** Editable */
      editable: boolean;
      /** Editable Changes */
      editable_changes?: components['schemas']['MetadataParameterSearchFileEditabilityChange'][];
    };
    /**
     * MetadataParameterSummary
     * @description A policy parameter, described without its values.
     *
     *     Its current-law values are listed by GET /v2/parameter-values. economy and
     *     household say whether a reform of an economy or of a household may change
     *     it; they are null in versions published before catalog format 2.
     */
    MetadataParameterSummary: {
      /**
       * Id
       * Format: uuid
       */
      id: string;
      /** Name */
      name: string;
      /** Label */
      label: string | null;
      /** Description */
      description: string | null;
      /** Data Type */
      data_type: string | null;
      /** Unit */
      unit: string | null;
      /** Economy */
      economy: boolean | null;
      /** Household */
      household: boolean | null;
    };
    /**
     * MetadataParameterValueDetailResponse
     * @description Success response holding one parameter value.
     */
    MetadataParameterValueDetailResponse: {
      /**
       * Status
       * @default ok
       * @constant
       */
      status: 'ok';
      /** Message */
      message?: null;
      result: components['schemas']['MetadataDetailResult_MetadataCanonicalParameterValue_'];
    };
    /**
     * MetadataParameterValuePageResponse
     * @description Success response holding one page of parameter values.
     */
    MetadataParameterValuePageResponse: {
      /**
       * Status
       * @default ok
       * @constant
       */
      status: 'ok';
      /** Message */
      message?: null;
      result: components['schemas']['MetadataPageResult_MetadataCanonicalParameterValue_'];
    };
    /**
     * MetadataRegion
     * @description A region the model can simulate, such as a country, state or constituency.
     *
     *     When requires_filter is true, filter_strategy says how the region selects
     *     households of its default dataset. With "row_filter", it keeps the
     *     households whose filter_field column equals filter_value (or is in it,
     *     when filter_value is a JSON list).
     */
    MetadataRegion: {
      /**
       * Id
       * Format: uuid
       */
      id: string;
      /** Code */
      code: string;
      /** Label */
      label: string;
      region_type: components['schemas']['MetadataRegionType'];
      /** Requires Filter */
      requires_filter: boolean;
      /** Filter Field */
      filter_field: string | null;
      /** Filter Value */
      filter_value: string | null;
      /** Filter Strategy */
      filter_strategy: string | null;
      /** Parent Code */
      parent_code: string | null;
      /** State Code */
      state_code: string | null;
      /** State Name */
      state_name: string | null;
      /**
       * Default Dataset Id
       * Format: uuid
       */
      default_dataset_id: string;
    };
    /**
     * MetadataRegionDetailResponse
     * @description Success response holding one region.
     */
    MetadataRegionDetailResponse: {
      /**
       * Status
       * @default ok
       * @constant
       */
      status: 'ok';
      /** Message */
      message?: null;
      result: components['schemas']['MetadataDetailResult_MetadataRegion_'];
    };
    /**
     * MetadataRegionOption
     * @description A region that can be chosen for an economy calculation; name is its code.
     */
    MetadataRegionOption: {
      /** Name */
      name: string;
      /** Label */
      label: string;
      type: components['schemas']['MetadataRegionType'];
    };
    /**
     * MetadataRegionPageResponse
     * @description Success response holding one page of regions.
     */
    MetadataRegionPageResponse: {
      /**
       * Status
       * @default ok
       * @constant
       */
      status: 'ok';
      /** Message */
      message?: null;
      result: components['schemas']['MetadataPageResult_MetadataRegion_'];
    };
    /**
     * MetadataRegionType
     * @description The geographic level of a region.
     * @enum {string}
     */
    MetadataRegionType:
      | 'national'
      | 'country'
      | 'state'
      | 'congressional_district'
      | 'constituency'
      | 'local_authority'
      | 'city'
      | 'place';
    /**
     * MetadataSPMAvailability
     * @description Whether a catalog version offers SPM settings for a household.
     *
     *     When ``available``, ``settings_schema`` is the JSON schema of a
     *     household's ``spm`` selection and ``defaults`` the certified selection
     *     that applies to every field a household leaves out. A version without
     *     them (any country but the US, or a bundle without certified SPM support)
     *     is not available, and both are null.
     */
    MetadataSPMAvailability: {
      /** Available */
      available: boolean;
      /** Settings Schema */
      settings_schema?: {
        [key: string]: components['schemas']['JsonValue'];
      } | null;
      /** Defaults */
      defaults?: {
        [key: string]: components['schemas']['JsonValue'];
      } | null;
    };
    /**
     * MetadataTimePeriodOption
     * @description A year that can be chosen for an economy calculation.
     */
    MetadataTimePeriodOption: {
      /** Name */
      name: number;
      /** Label */
      label: string;
    };
    /**
     * MetadataVariable
     * @description A variable the tax-benefit model computes or accepts as input.
     *
     *     adds and subtracts, when present, list the variables summed into or
     *     subtracted from this one. When the model takes that list from a
     *     parameter, adds_parameter_path or subtracts_parameter_path names the
     *     parameter, whose dated values give the list for each year (adds and
     *     subtracts hold its value on 2025-01-01). unit is the country package's
     *     unit (for example ``currency-USD``) and definition_period the period a
     *     value covers (``year``, ``month`` or ``eternity``). The catalog format 2
     *     fields (is_input_variable, hidden_input, module_name, the two parameter
     *     paths, enum_values, unit and definition_period) are null in versions
     *     published before that format.
     */
    MetadataVariable: {
      /**
       * Id
       * Format: uuid
       */
      id: string;
      /** Name */
      name: string;
      /** Label */
      label: string | null;
      /** Entity */
      entity: string;
      /** Description */
      description: string | null;
      /** Data Type */
      data_type: string | null;
      /** Possible Values */
      possible_values: string[] | null;
      default_value: components['schemas']['JsonValue'];
      /** Adds */
      adds: string[] | null;
      /** Subtracts */
      subtracts: string[] | null;
      /** Is Input Variable */
      is_input_variable: boolean | null;
      /** Hidden Input */
      hidden_input: boolean | null;
      /** Module Name */
      module_name: string | null;
      /** Adds Parameter Path */
      adds_parameter_path: string | null;
      /** Subtracts Parameter Path */
      subtracts_parameter_path: string | null;
      /** Enum Values */
      enum_values: components['schemas']['MetadataEnumValue'][] | null;
      /** Unit */
      unit: string | null;
      /** Definition Period */
      definition_period: string | null;
    };
    /**
     * MetadataVariableDetailResponse
     * @description Success response holding one variable.
     */
    MetadataVariableDetailResponse: {
      /**
       * Status
       * @default ok
       * @constant
       */
      status: 'ok';
      /** Message */
      message?: null;
      result: components['schemas']['MetadataDetailResult_MetadataVariable_'];
    };
    /**
     * MetadataVariablePageResponse
     * @description Success response holding one page of variables.
     */
    MetadataVariablePageResponse: {
      /**
       * Status
       * @default ok
       * @constant
       */
      status: 'ok';
      /** Message */
      message?: null;
      result: components['schemas']['MetadataPageResult_MetadataVariable_'];
    };
    /**
     * PolicyCreateRequest
     * @description Native body containing immutable policy content only.
     */
    PolicyCreateRequest: {
      /**
       * Country Id
       * @description Supported PolicyEngine country ID
       * @enum {string}
       */
      country_id: 'us' | 'uk';
      /**
       * Tax Benefit Model Id
       * Format: uuid
       */
      tax_benefit_model_id: string;
      /** Parameter Values */
      parameter_values: components['schemas']['PolicyParameterValueInput'][];
    };
    /**
     * PolicyDetailResponse
     * @description Success response holding one policy.
     */
    PolicyDetailResponse: {
      /**
       * Status
       * @default ok
       * @constant
       */
      status: 'ok';
      /** Message */
      message?: null;
      result: components['schemas']['PolicyDetailResult'];
    };
    /**
     * PolicyDetailResult
     * @description Result holding one policy in ``item``.
     */
    PolicyDetailResult: {
      item: components['schemas']['PolicyItem'];
    };
    /**
     * PolicyItem
     * @description A stored policy: parameter values for one tax-benefit model.
     *
     *     Policies are immutable and deduplicated: creating one with identical
     *     content returns the existing policy and its ``id``.
     */
    PolicyItem: {
      /**
       * Id
       * Format: uuid
       */
      id: string;
      /** Country Id */
      country_id: string;
      /**
       * Tax Benefit Model Id
       * Format: uuid
       */
      tax_benefit_model_id: string;
      /**
       * Created At
       * Format: date-time
       */
      created_at: string;
      /**
       * Updated At
       * Format: date-time
       */
      updated_at: string;
      /** Parameter Values */
      parameter_values: components['schemas']['PolicyParameterValueItem'][];
    };
    /**
     * PolicyPageResponse
     * @description Success response holding one page of policies.
     */
    PolicyPageResponse: {
      /**
       * Status
       * @default ok
       * @constant
       */
      status: 'ok';
      /** Message */
      message?: null;
      result: components['schemas']['PolicyPageResult'];
    };
    /**
     * PolicyPageResult
     * @description One page of policies, oldest first.
     *
     *     ``offset`` and ``limit`` echo the request; when ``has_more`` is true, ask
     *     for the next page with ``offset + limit``.
     */
    PolicyPageResult: {
      /** Items */
      items: components['schemas']['PolicyItem'][];
      /** Offset */
      offset: number;
      /** Limit */
      limit: number;
      /** Has More */
      has_more: boolean;
    };
    /**
     * PolicyParameterValueInput
     * @description One normalized effective value for a catalog parameter UUID.
     */
    PolicyParameterValueInput: {
      /**
       * Parameter Id
       * Format: uuid
       */
      parameter_id: string;
      value: components['schemas']['JsonValue'];
      /**
       * Start Date
       * Format: date-time
       */
      start_date: string;
      /** End Date */
      end_date?: string | null;
    };
    /**
     * PolicyParameterValueItem
     * @description One value a policy sets for a parameter from ``start_date``.
     *
     *     ``parameter_name`` is the parameter's path in the model, and a null
     *     ``end_date`` means the value has no end.
     */
    PolicyParameterValueItem: {
      /**
       * Id
       * Format: uuid
       */
      id: string;
      /**
       * Parameter Id
       * Format: uuid
       */
      parameter_id: string;
      /** Parameter Name */
      parameter_name: string;
      value: components['schemas']['JsonValue'];
      /**
       * Start Date
       * Format: date-time
       */
      start_date: string;
      /** End Date */
      end_date: string | null;
    };
    /**
     * PolicyProvenance
     * @description Where a v3 reform came from.
     */
    PolicyProvenance: {
      /**
       * Source
       * @enum {string}
       */
      source: 'manual' | 'chat' | 'bill' | 'tool';
      /** Ref */
      ref?: string | null;
      /** Confidence */
      confidence?: ('exact' | 'approximated' | 'partial') | null;
    };
    /**
     * PolicyProvenanceItem
     * @description Stored v3 reform provenance as responses publish it.
     *
     *     It mirrors the contract without the input bounds and ignores unknown keys,
     *     so any stored row serializes.
     */
    PolicyProvenanceItem: {
      /** Source */
      source: string;
      /** Ref */
      ref?: string | null;
      /** Confidence */
      confidence?: string | null;
    };
    /**
     * ReportCalibration
     * @description Calibration results for one geography, with at most 500 variable matches.
     */
    ReportCalibration: {
      /** Release Id */
      release_id?: string | null;
      /** Geography */
      geography: string;
      /** Reached Count */
      reached_count: number;
      /** Matches */
      matches: components['schemas']['ReportCalibrationMatch'][];
    };
    /**
     * ReportCalibrationItem
     * @description Calibration results saved with a report, for one geography and data release.
     */
    ReportCalibrationItem: {
      /** Release Id */
      release_id?: string | null;
      /** Geography */
      geography: string;
      /** Reached Count */
      reached_count: number;
      /** Matches */
      matches: components['schemas']['ReportCalibrationMatchItem'][];
    };
    /**
     * ReportCalibrationMatch
     * @description Calibration of one variable: how closely its targets are met.
     *
     *     ``ring`` is ``primary``, ``mechanism`` or ``downstream``.
     *     ``mean_abs_relative_error`` is averaged over the variable's ``target_count``
     *     targets, and ``worst`` is the target with the largest error.
     */
    ReportCalibrationMatch: {
      /** Variable */
      variable: string;
      /** Depth */
      depth: number;
      /**
       * Ring
       * @enum {string}
       */
      ring: 'primary' | 'mechanism' | 'downstream';
      /** Target Count */
      target_count: number;
      /** Mean Abs Relative Error */
      mean_abs_relative_error: number;
      worst: components['schemas']['ReportCalibrationWorst'];
    };
    /**
     * ReportCalibrationMatchItem
     * @description One variable's calibration match: its targets, mean error and worst target.
     */
    ReportCalibrationMatchItem: {
      /** Variable */
      variable: string;
      /** Depth */
      depth: number;
      /** Ring */
      ring: string;
      /** Target Count */
      target_count: number;
      /** Mean Abs Relative Error */
      mean_abs_relative_error: number;
      worst: components['schemas']['ReportCalibrationWorstItem'];
    };
    /**
     * ReportCalibrationWorst
     * @description The calibration target a match fits worst, with its source and geography.
     */
    ReportCalibrationWorst: {
      /** Name */
      name: string;
      /** Source */
      source: string;
      /** Geography */
      geography: string;
      /** Relative Error */
      relative_error?: number | null;
    };
    /**
     * ReportCalibrationWorstItem
     * @description The calibration target that one match fits worst, with its relative error.
     */
    ReportCalibrationWorstItem: {
      /** Name */
      name: string;
      /** Source */
      source: string;
      /** Geography */
      geography: string;
      /** Relative Error */
      relative_error?: number | null;
    };
    /**
     * ReportDetailResponse
     * @description Success response holding one report.
     */
    ReportDetailResponse: {
      /**
       * Status
       * @default ok
       * @constant
       */
      status: 'ok';
      /** Message */
      message?: null;
      result: components['schemas']['ReportDetailResult'];
    };
    /**
     * ReportDetailResult
     * @description Result holding one report, of either kind, in ``item``.
     */
    ReportDetailResult: {
      /** Item */
      item: components['schemas']['ReportItem'] | components['schemas']['HouseholdReportItem'];
    };
    /**
     * ReportItem
     * @description An economy report with its result.
     *
     *     ``result`` holds today's economy result format (``SingleYearMacroOutput``)
     *     once the newest run has succeeded, and is null otherwise.
     */
    ReportItem: {
      /**
       * Id
       * Format: uuid
       */
      id: string;
      /** Country Id */
      country_id: string;
      /**
       * @description discriminator enum property added by openapi-typescript
       * @enum {string}
       */
      kind: 'economy';
      /** Year */
      year: number;
      /** Options */
      options: {
        [key: string]: components['schemas']['JsonValue'];
      };
      /** Legacy Report Id */
      legacy_report_id: number | null;
      /**
       * Created At
       * Format: date-time
       */
      created_at: string;
      baseline_simulation: components['schemas']['SimulationItem'];
      reform_simulation: components['schemas']['SimulationItem'];
      status: components['schemas']['ReportStatus'];
      run: components['schemas']['ReportRunItem'] | null;
      /** Result */
      result: {
        [key: string]: components['schemas']['JsonValue'];
      } | null;
    };
    /**
     * ReportListResponse
     * @description Success response holding listed reports.
     */
    ReportListResponse: {
      /**
       * Status
       * @default ok
       * @constant
       */
      status: 'ok';
      /** Message */
      message?: null;
      result: components['schemas']['ReportListResult'];
    };
    /**
     * ReportListResult
     * @description The listed reports of both kinds in ``items``, in the order asked.
     *
     *     Economy reports are listed without their results and household reports
     *     without their calculations.
     */
    ReportListResult: {
      /** Items */
      items: (
        | components['schemas']['ReportSummaryItem']
        | components['schemas']['HouseholdReportSummaryItem']
      )[];
    };
    /**
     * ReportProvision
     * @description One provision of the report's reform: a parameter's baseline and reform values.
     *
     *     ``path`` is the parameter path and ``breadcrumb`` its readable label, and
     *     ``intervals`` optionally gives a dated schedule. ``growth`` says how a value
     *     set from one year on moves in later years (``fixed``, ``current_law`` or an
     *     index's parameter path); the other ``growth_*`` fields say when it moves and
     *     how grown values round. They are absent for a hand-set schedule.
     */
    ReportProvision: {
      /** Path */
      path: string;
      /** Breadcrumb */
      breadcrumb: string;
      /** Unit */
      unit?: string | null;
      baseline_value: components['schemas']['FiniteJsonValue'];
      value: components['schemas']['FiniteJsonValue'];
      /** Intervals */
      intervals?: components['schemas']['ReportProvisionInterval'][] | null;
      /** Growth */
      growth?: string | null;
      /** Growth Start */
      growth_start?: number | null;
      /** Growth Base */
      growth_base?: number | null;
      /** Growth Round To */
      growth_round_to?: number | null;
      /** Growth Round */
      growth_round?: ('nearest' | 'down' | 'up') | null;
    };
    /**
     * ReportProvisionInterval
     * @description One dated value in a provision's schedule, from ``start_date`` to ``end_date``.
     *
     *     Dates are ``YYYY-MM-DD`` strings and ``value`` is any finite JSON value.
     *     ``parameter`` is optional, and is left out of the stored report when unset.
     */
    ReportProvisionInterval: {
      /** Parameter */
      parameter?: string | null;
      /** Start Date */
      start_date: string;
      /** End Date */
      end_date: string;
      value: components['schemas']['FiniteJsonValue'];
    };
    /**
     * ReportProvisionIntervalItem
     * @description A provision's value for the dates from ``start_date`` to ``end_date``.
     */
    ReportProvisionIntervalItem: {
      /** Parameter */
      parameter?: string | null;
      /** Start Date */
      start_date: string;
      /** End Date */
      end_date: string;
      value: components['schemas']['JsonValue'];
    };
    /**
     * ReportProvisionItem
     * @description One parameter the report's reform changes, with its baseline and reform values.
     *
     *     ``intervals`` gives the reform's dated values when they vary over time. The
     *     ``growth`` keys, present only when set, say how a value set from one year on
     *     moves in later years and how grown values round.
     */
    ReportProvisionItem: {
      /** Path */
      path: string;
      /** Breadcrumb */
      breadcrumb: string;
      /** Unit */
      unit?: string | null;
      baseline_value: components['schemas']['JsonValue'];
      value: components['schemas']['JsonValue'];
      /** Intervals */
      intervals?: components['schemas']['ReportProvisionIntervalItem'][] | null;
      /** Growth */
      growth?: string | null;
      /** Growth Start */
      growth_start?: number | null;
      /** Growth Base */
      growth_base?: number | null;
      /** Growth Round To */
      growth_round_to?: number | null;
      /** Growth Round */
      growth_round?: string | null;
    };
    /**
     * ReportRunDetailResponse
     * @description Success response holding one report run.
     */
    ReportRunDetailResponse: {
      /**
       * Status
       * @default ok
       * @constant
       */
      status: 'ok';
      /** Message */
      message?: null;
      result: components['schemas']['ReportRunDetailResult'];
    };
    /**
     * ReportRunDetailResult
     * @description Result holding one report run, of either kind, in ``item``.
     */
    ReportRunDetailResult: {
      /** Item */
      item:
        | components['schemas']['ReportRunItem']
        | components['schemas']['HouseholdReportRunItem'];
    };
    /**
     * ReportRunItem
     * @description One calculation of a report: two simulation runs and their comparison.
     *
     *     ``trigger`` is ``initial`` for the run a submission starts, ``manual`` for
     *     a re-run and ``system`` for the run the first read of a report with no run
     *     starts. ``tax_benefit_model_version_id`` and ``policyengine_version`` name
     *     the catalog version it ran on. While it runs, ``stage`` is ``queued``,
     *     ``simulating`` or ``outputs``.
     */
    ReportRunItem: {
      /**
       * @description discriminator enum property added by openapi-typescript
       * @enum {string}
       */
      kind: 'economy';
      /**
       * Id
       * Format: uuid
       */
      id: string;
      /**
       * Report Id
       * Format: uuid
       */
      report_id: string;
      /** Trigger */
      trigger: string;
      /**
       * Tax Benefit Model Version Id
       * Format: uuid
       */
      tax_benefit_model_version_id: string;
      /** Policyengine Version */
      policyengine_version: string | null;
      /** Year */
      year: number;
      status: components['schemas']['ReportStatus'];
      /** Stage */
      stage: string | null;
      error: components['schemas']['RunErrorItem'] | null;
      baseline_run: components['schemas']['SimulationRunItem'];
      reform_run: components['schemas']['SimulationRunItem'];
      comparison: components['schemas']['ComparisonItem'];
      /**
       * Created At
       * Format: date-time
       */
      created_at: string;
    };
    /**
     * ReportRunListResponse
     * @description Success response holding a report's runs.
     */
    ReportRunListResponse: {
      /**
       * Status
       * @default ok
       * @constant
       */
      status: 'ok';
      /** Message */
      message?: null;
      result: components['schemas']['ReportRunListResult'];
    };
    /**
     * ReportRunListResult
     * @description A report's runs in ``items``, newest first.
     */
    ReportRunListResult: {
      /** Items */
      items: components['schemas']['ReportRunItem'][];
    };
    /**
     * ReportScorecard
     * @description The programs on the report's validation scorecard, at most 200 names.
     */
    ReportScorecard: {
      /** Programs */
      programs: string[];
    };
    /**
     * ReportScorecardItem
     * @description The programs on the scorecard saved with a report's validation.
     */
    ReportScorecardItem: {
      /** Programs */
      programs: string[];
    };
    /**
     * ReportStatus
     * @description Where a report or report run stands; a report's is its newest run's.
     *
     *     A report with no run, such as one migrated from v1, is ``not_run``.
     * @enum {string}
     */
    ReportStatus: 'not_run' | 'pending' | 'running' | 'succeeded' | 'failed';
    /**
     * ReportSummaryItem
     * @description An economy report comparing a baseline and a reform simulation.
     *
     *     ``status`` is the newest run's, or ``not_run`` for a report with no run.
     *     ``legacy_report_id`` is the v1 report output it was migrated from.
     */
    ReportSummaryItem: {
      /**
       * Id
       * Format: uuid
       */
      id: string;
      /** Country Id */
      country_id: string;
      /**
       * @description discriminator enum property added by openapi-typescript
       * @enum {string}
       */
      kind: 'economy';
      /** Year */
      year: number;
      /** Options */
      options: {
        [key: string]: components['schemas']['JsonValue'];
      };
      /** Legacy Report Id */
      legacy_report_id: number | null;
      /**
       * Created At
       * Format: date-time
       */
      created_at: string;
      baseline_simulation: components['schemas']['SimulationItem'];
      reform_simulation: components['schemas']['SimulationItem'];
      status: components['schemas']['ReportStatus'];
      run: components['schemas']['ReportRunItem'] | null;
    };
    /**
     * ReportValidation
     * @description The validation snapshot saved with a report.
     *
     *     ``calibration`` and ``scorecard`` are optional, and the stored snapshot keeps
     *     only the keys supplied.
     */
    ReportValidation: {
      /** Matched At */
      matched_at: string;
      /** Map Model Version */
      map_model_version: string;
      calibration?: components['schemas']['ReportCalibration'] | null;
      scorecard?: components['schemas']['ReportScorecard'] | null;
    };
    /**
     * ReportValidationItem
     * @description The validation snapshot saved with a report.
     *
     *     It records when the report was matched and with which map model version,
     *     and optionally the calibration results and scorecard.
     */
    ReportValidationItem: {
      /** Matched At */
      matched_at: string;
      /** Map Model Version */
      map_model_version: string;
      calibration?: components['schemas']['ReportCalibrationItem'] | null;
      scorecard?: components['schemas']['ReportScorecardItem'] | null;
    };
    /**
     * RunErrorItem
     * @description Why a run failed, without user data.
     */
    RunErrorItem: {
      /** Code */
      code: string;
      /** Message */
      message: string | null;
    };
    /**
     * SPMSelection
     * @description Select a forecast scenario and an explicit household SPM geography.
     */
    SPMSelection: {
      /** Forecast Content Sha256 */
      forecast_content_sha256?: string | null;
      /** Scenario */
      scenario?: string | null;
      /**
       * Geography Kind
       * @enum {string}
       */
      geography_kind?: 'county' | 'national' | 'metro';
      /** Geography Id */
      geography_id?: string | null;
      /** County Vintage */
      county_vintage?: string;
      /**
       * As Of
       * Format: date
       * @description ISO calendar date (YYYY-MM-DD); must satisfy the selected artifact's information date
       */
      as_of?: string | null;
    } & (
      | {
          /** @enum {unknown} */
          geography_kind?: 'county' | 'national';
        }
      | {
          /** @enum {unknown} */
          geography_kind: 'metro';
          geography_id: string;
        }
    );
    /**
     * SharedBaselineReformItem
     * @description The saved reform a shared report was compared with, named but not linked.
     */
    SharedBaselineReformItem: {
      /** Name */
      name: string | null;
    };
    /**
     * SharedUserReportDetailResponse
     * @description Success response holding one shared report.
     */
    SharedUserReportDetailResponse: {
      /**
       * Status
       * @default ok
       * @constant
       */
      status: 'ok';
      /** Message */
      message?: null;
      result: components['schemas']['SharedUserReportDetailResult'];
    };
    /**
     * SharedUserReportDetailResult
     * @description Result holding one shared report in ``item``.
     */
    SharedUserReportDetailResult: {
      item: components['schemas']['SharedUserReportItem'];
    };
    /**
     * SharedUserReportItem
     * @description A saved report as anyone holding its link reads it.
     *
     *     ``report_id`` is the v2 report it shows and ``legacy_report_id`` the v1
     *     report output.
     */
    SharedUserReportItem: {
      /**
       * Id
       * Format: uuid
       */
      id: string;
      /**
       * Country Id
       * @description Supported PolicyEngine country ID
       * @enum {string}
       */
      country_id: 'us' | 'uk';
      /** Report Id */
      report_id: string | null;
      /** Legacy Report Id */
      legacy_report_id: number | null;
      /** Name */
      name: string | null;
      /** Source Note */
      source_note: string | null;
      /** Provisions */
      provisions: components['schemas']['ReportProvisionItem'][] | null;
      validation: components['schemas']['ReportValidationItem'] | null;
      /** Budget Window Years */
      budget_window_years: number | null;
      baseline_reform: components['schemas']['SharedBaselineReformItem'] | null;
      /** Last Run At */
      last_run_at: string | null;
      /**
       * Created At
       * Format: date-time
       */
      created_at: string;
      /**
       * Updated At
       * Format: date-time
       */
      updated_at: string;
    };
    /**
     * SimulationChoice
     * @description A simulation's v2 policy and dynamic; neither means current law.
     */
    SimulationChoice: {
      /** Policy Id */
      policy_id?: string | null;
      /** Dynamic Id */
      dynamic_id?: string | null;
    };
    /**
     * SimulationItem
     * @description A simulation: one v2 policy and dynamic applied to one region.
     *
     *     A null ``policy_id`` and ``dynamic_id`` mean current law. A null
     *     ``dataset_name`` means the region's default dataset in each catalog
     *     version.
     */
    SimulationItem: {
      /**
       * Id
       * Format: uuid
       */
      id: string;
      /** Kind */
      kind: string;
      /** Country Id */
      country_id: string;
      /** Policy Id */
      policy_id: string | null;
      /** Dynamic Id */
      dynamic_id: string | null;
      /** Region Code */
      region_code: string | null;
      /** Dataset Name */
      dataset_name: string | null;
      /** Legacy Simulation Id */
      legacy_simulation_id: number | null;
      /**
       * Created At
       * Format: date-time
       */
      created_at: string;
    };
    /**
     * SimulationRunItem
     * @description One execution of a simulation for a catalog version and year.
     *
     *     ``status`` is ``pending``, ``dispatching``, ``running``, ``succeeded`` or
     *     ``failed``; ``attempt`` counts forced recalculations.
     */
    SimulationRunItem: {
      /**
       * Id
       * Format: uuid
       */
      id: string;
      /**
       * Simulation Id
       * Format: uuid
       */
      simulation_id: string;
      /** Status */
      status: string;
      /** Attempt */
      attempt: number;
      /** Trigger */
      trigger: string;
      error: components['schemas']['RunErrorItem'] | null;
      /** Dispatched At */
      dispatched_at: string | null;
      /** Completed At */
      completed_at: string | null;
      /**
       * Created At
       * Format: date-time
       */
      created_at: string;
    };
    /**
     * UKHouseholdDocument
     * @description UK household content: people, households and benefit units.
     */
    UKHouseholdDocument: {
      /** People */
      people: components['schemas']['HouseholdPersonRecord'][];
      /** Household */
      household: components['schemas']['HouseholdEntityRecord'][];
      /** Benunit */
      benunit: components['schemas']['HouseholdEntityRecord'][];
    };
    /**
     * USHouseholdDocument
     * @description US household content: people and the US group entities they belong to.
     *
     *     ``spm`` optionally selects an SPM forecast scenario and geography; omit it
     *     rather than sending null.
     */
    'USHouseholdDocument-Input': {
      /** People */
      people: components['schemas']['HouseholdPersonRecord'][];
      /** Household */
      household: components['schemas']['HouseholdEntityRecord'][];
      /** Family */
      family: components['schemas']['HouseholdEntityRecord'][];
      /** Tax Unit */
      tax_unit: components['schemas']['HouseholdEntityRecord'][];
      /** Spm Unit */
      spm_unit: components['schemas']['HouseholdEntityRecord'][];
      /** Marital Unit */
      marital_unit: components['schemas']['HouseholdEntityRecord'][];
      /** Spm */
      spm?: components['schemas']['SPMSelection'];
    };
    'USHouseholdDocument-Output': {
      [key: string]: unknown;
    };
    /**
     * UserHouseholdCreateRequest
     * @description Association fields; the owner is taken from the request credential.
     */
    UserHouseholdCreateRequest: {
      /**
       * Country Id
       * @description Supported PolicyEngine country ID
       * @enum {string}
       */
      country_id: 'us' | 'uk';
      /** Household Id */
      household_id?: string | null;
      /** Legacy Household Id */
      legacy_household_id?: number | null;
      /** Name */
      name?: string | null;
      /** Description */
      description?: string | null;
    };
    /**
     * UserHouseholdDetailResponse
     * @description Success response holding one user-household association.
     */
    UserHouseholdDetailResponse: {
      /**
       * Status
       * @default ok
       * @constant
       */
      status: 'ok';
      /** Message */
      message?: null;
      result: components['schemas']['UserHouseholdDetailResult'];
    };
    /**
     * UserHouseholdDetailResult
     * @description Result holding one user-household association in ``item``.
     */
    UserHouseholdDetailResult: {
      item: components['schemas']['UserHouseholdItem'];
    };
    /**
     * UserHouseholdItem
     * @description A household saved by a v2 user, with the user's name and description for it.
     *
     *     Unlike households, associations can be renamed, pointed at another
     *     household of the same country, or deleted.
     */
    UserHouseholdItem: {
      /**
       * Id
       * Format: uuid
       */
      id: string;
      /**
       * Country Id
       * @description Supported PolicyEngine country ID
       * @enum {string}
       */
      country_id: 'us' | 'uk';
      /**
       * User Id
       * Format: uuid
       */
      user_id: string;
      /** Household Id */
      household_id: string | null;
      /** Legacy Household Id */
      legacy_household_id: number | null;
      /** Name */
      name: string | null;
      /** Description */
      description: string | null;
      /**
       * Created At
       * Format: date-time
       */
      created_at: string;
      /**
       * Updated At
       * Format: date-time
       */
      updated_at: string;
    };
    /**
     * UserHouseholdPageResponse
     * @description Success response holding one page of user-household associations.
     */
    UserHouseholdPageResponse: {
      /**
       * Status
       * @default ok
       * @constant
       */
      status: 'ok';
      /** Message */
      message?: null;
      result: components['schemas']['UserHouseholdPageResult'];
    };
    /**
     * UserHouseholdPageResult
     * @description One page of user-household associations, oldest first.
     *
     *     ``offset`` and ``limit`` echo the request; when ``has_more`` is true, ask
     *     for the next page with ``offset + limit``.
     */
    UserHouseholdPageResult: {
      /** Items */
      items: components['schemas']['UserHouseholdItem'][];
      /** Offset */
      offset: number;
      /** Limit */
      limit: number;
      /** Has More */
      has_more: boolean;
    };
    /**
     * UserHouseholdPatchRequest
     * @description Explicitly supplied mutable link or presentation fields.
     */
    UserHouseholdPatchRequest: {
      /** Household Id */
      household_id?: string | null;
      /** Legacy Household Id */
      legacy_household_id?: number | null;
      /** Name */
      name?: string | null;
      /** Description */
      description?: string | null;
    };
    /**
     * UserPolicyCreateRequest
     * @description Association fields; the owner is taken from the request credential.
     */
    UserPolicyCreateRequest: {
      /**
       * Country Id
       * @description Supported PolicyEngine country ID
       * @enum {string}
       */
      country_id: 'us' | 'uk';
      /** Policy Id */
      policy_id?: string | null;
      /** Legacy Policy Id */
      legacy_policy_id?: number | null;
      /** Name */
      name?: string | null;
      /** Description */
      description?: string | null;
      /** Baseline */
      baseline?: ('current-law' | 'current-policy') | null;
      provenance?: components['schemas']['PolicyProvenance'] | null;
    };
    /**
     * UserPolicyDetailResponse
     * @description Success response holding one user-policy association.
     */
    UserPolicyDetailResponse: {
      /**
       * Status
       * @default ok
       * @constant
       */
      status: 'ok';
      /** Message */
      message?: null;
      result: components['schemas']['UserPolicyDetailResult'];
    };
    /**
     * UserPolicyDetailResult
     * @description Result holding one user-policy association in ``item``.
     */
    UserPolicyDetailResult: {
      item: components['schemas']['UserPolicyItem'];
    };
    /**
     * UserPolicyItem
     * @description A policy saved by a v2 user, with the user's name and description for it.
     *
     *     Unlike policies, associations can be renamed or deleted.
     */
    UserPolicyItem: {
      /**
       * Id
       * Format: uuid
       */
      id: string;
      /**
       * Country Id
       * @description Supported PolicyEngine country ID
       * @enum {string}
       */
      country_id: 'us' | 'uk';
      /**
       * User Id
       * Format: uuid
       */
      user_id: string;
      /** Policy Id */
      policy_id: string | null;
      /** Legacy Policy Id */
      legacy_policy_id: number | null;
      /** Name */
      name: string | null;
      /** Description */
      description: string | null;
      /** Baseline */
      baseline: ('current-law' | 'current-policy') | null;
      provenance: components['schemas']['PolicyProvenanceItem'] | null;
      /**
       * Created At
       * Format: date-time
       */
      created_at: string;
      /**
       * Updated At
       * Format: date-time
       */
      updated_at: string;
    };
    /**
     * UserPolicyPageResponse
     * @description Success response holding one page of user-policy associations.
     */
    UserPolicyPageResponse: {
      /**
       * Status
       * @default ok
       * @constant
       */
      status: 'ok';
      /** Message */
      message?: null;
      result: components['schemas']['UserPolicyPageResult'];
    };
    /**
     * UserPolicyPageResult
     * @description One page of user-policy associations, oldest first.
     *
     *     ``offset`` and ``limit`` echo the request; when ``has_more`` is true, ask
     *     for the next page with ``offset + limit``.
     */
    UserPolicyPageResult: {
      /** Items */
      items: components['schemas']['UserPolicyItem'][];
      /** Offset */
      offset: number;
      /** Limit */
      limit: number;
      /** Has More */
      has_more: boolean;
    };
    /**
     * UserPolicyPatchRequest
     * @description Explicitly supplied mutable link or presentation fields.
     */
    UserPolicyPatchRequest: {
      /** Policy Id */
      policy_id?: string | null;
      /** Legacy Policy Id */
      legacy_policy_id?: number | null;
      /** Name */
      name?: string | null;
      /** Description */
      description?: string | null;
      /** Baseline */
      baseline?: ('current-law' | 'current-policy') | null;
      provenance?: components['schemas']['PolicyProvenance'] | null;
    };
    /**
     * UserReportCreateRequest
     * @description Association fields; the owner is taken from the request credential.
     */
    UserReportCreateRequest: {
      /** Name */
      name?: string | null;
      /** Description */
      description?: string | null;
      /** Source Note */
      source_note?: string | null;
      /** Provisions */
      provisions?: components['schemas']['ReportProvision'][] | null;
      validation?: components['schemas']['ReportValidation'] | null;
      /** Budget Window Years */
      budget_window_years?: number | null;
      /** Last Run At */
      last_run_at?: string | null;
      /**
       * Country Id
       * @description Supported PolicyEngine country ID
       * @enum {string}
       */
      country_id: 'us' | 'uk';
      /** Report Id */
      report_id?: string | null;
      /** Legacy Report Id */
      legacy_report_id?: number | null;
      /** User Policy Id */
      user_policy_id?: string | null;
      /** Baseline User Policy Id */
      baseline_user_policy_id?: string | null;
    };
    /**
     * UserReportDetailResponse
     * @description Success response holding one user-report association.
     */
    UserReportDetailResponse: {
      /**
       * Status
       * @default ok
       * @constant
       */
      status: 'ok';
      /** Message */
      message?: null;
      result: components['schemas']['UserReportDetailResult'];
    };
    /**
     * UserReportDetailResult
     * @description Result holding one user-report association in ``item``.
     */
    UserReportDetailResult: {
      item: components['schemas']['UserReportItem'];
    };
    /**
     * UserReportItem
     * @description A report saved by a user, with the user's name, notes and saved presentation.
     *
     *     ``report_id`` is the v2 report it shows and ``legacy_report_id`` the v1
     *     report output; a report migrated from v1 has both. ``user_policy_id`` is
     *     the user's saved reform the report was run from, and
     *     ``baseline_user_policy_id`` the saved reform it was compared with instead of
     *     current law; each is null when not set or once that reform is deleted.
     *     ``budget_window_years`` is null for a report without a budget window.
     */
    UserReportItem: {
      /**
       * Id
       * Format: uuid
       */
      id: string;
      /**
       * Country Id
       * @description Supported PolicyEngine country ID
       * @enum {string}
       */
      country_id: 'us' | 'uk';
      /**
       * User Id
       * Format: uuid
       */
      user_id: string;
      /** Report Id */
      report_id: string | null;
      /** Legacy Report Id */
      legacy_report_id: number | null;
      /** Name */
      name: string | null;
      /** Description */
      description: string | null;
      /** User Policy Id */
      user_policy_id: string | null;
      /** Baseline User Policy Id */
      baseline_user_policy_id: string | null;
      /** Source Note */
      source_note: string | null;
      /** Provisions */
      provisions: components['schemas']['ReportProvisionItem'][] | null;
      validation: components['schemas']['ReportValidationItem'] | null;
      /** Budget Window Years */
      budget_window_years: number | null;
      /** Last Run At */
      last_run_at: string | null;
      /**
       * Created At
       * Format: date-time
       */
      created_at: string;
      /**
       * Updated At
       * Format: date-time
       */
      updated_at: string;
    };
    /**
     * UserReportPageResponse
     * @description Success response holding one page of user-report associations.
     */
    UserReportPageResponse: {
      /**
       * Status
       * @default ok
       * @constant
       */
      status: 'ok';
      /** Message */
      message?: null;
      result: components['schemas']['UserReportPageResult'];
    };
    /**
     * UserReportPageResult
     * @description One page of user-report associations, oldest first.
     *
     *     ``offset`` and ``limit`` echo the request; when ``has_more`` is true, ask
     *     for the next page with ``offset + limit``.
     */
    UserReportPageResult: {
      /** Items */
      items: components['schemas']['UserReportItem'][];
      /** Offset */
      offset: number;
      /** Limit */
      limit: number;
      /** Has More */
      has_more: boolean;
    };
    /**
     * UserReportPatchRequest
     * @description Explicitly supplied mutable link or presentation fields.
     */
    UserReportPatchRequest: {
      /** Name */
      name?: string | null;
      /** Description */
      description?: string | null;
      /** Source Note */
      source_note?: string | null;
      /** Provisions */
      provisions?: components['schemas']['ReportProvision'][] | null;
      validation?: components['schemas']['ReportValidation'] | null;
      /** Budget Window Years */
      budget_window_years?: number | null;
      /** Last Run At */
      last_run_at?: string | null;
      /** Report Id */
      report_id?: string | null;
      /** Legacy Report Id */
      legacy_report_id?: number | null;
      /** User Policy Id */
      user_policy_id?: string | null;
      /** Baseline User Policy Id */
      baseline_user_policy_id?: string | null;
    };
    /**
     * UserSimulationCreateRequest
     * @description Association fields; the owner is taken from the request credential.
     */
    UserSimulationCreateRequest: {
      /**
       * Country Id
       * @description Supported PolicyEngine country ID
       * @enum {string}
       */
      country_id: 'us' | 'uk';
      /** Simulation Id */
      simulation_id?: string | null;
      /** Legacy Simulation Id */
      legacy_simulation_id?: number | null;
      /** Name */
      name?: string | null;
      /** Description */
      description?: string | null;
    };
    /**
     * UserSimulationDetailResponse
     * @description Success response holding one user-simulation association.
     */
    UserSimulationDetailResponse: {
      /**
       * Status
       * @default ok
       * @constant
       */
      status: 'ok';
      /** Message */
      message?: null;
      result: components['schemas']['UserSimulationDetailResult'];
    };
    /**
     * UserSimulationDetailResult
     * @description Result holding one user-simulation association in ``item``.
     */
    UserSimulationDetailResult: {
      item: components['schemas']['UserSimulationItem'];
    };
    /**
     * UserSimulationItem
     * @description A simulation saved by a user, with the user's name and description for it.
     *
     *     ``simulation_id`` is the v2 simulation it saves and ``legacy_simulation_id``
     *     the v1 simulation. Associations can be renamed, pointed at another
     *     simulation of the same country, or deleted.
     */
    UserSimulationItem: {
      /**
       * Id
       * Format: uuid
       */
      id: string;
      /**
       * Country Id
       * @description Supported PolicyEngine country ID
       * @enum {string}
       */
      country_id: 'us' | 'uk';
      /**
       * User Id
       * Format: uuid
       */
      user_id: string;
      /** Simulation Id */
      simulation_id: string | null;
      /** Legacy Simulation Id */
      legacy_simulation_id: number | null;
      /** Name */
      name: string | null;
      /** Description */
      description: string | null;
      /**
       * Created At
       * Format: date-time
       */
      created_at: string;
      /**
       * Updated At
       * Format: date-time
       */
      updated_at: string;
    };
    /**
     * UserSimulationPageResponse
     * @description Success response holding one page of user-simulation associations.
     */
    UserSimulationPageResponse: {
      /**
       * Status
       * @default ok
       * @constant
       */
      status: 'ok';
      /** Message */
      message?: null;
      result: components['schemas']['UserSimulationPageResult'];
    };
    /**
     * UserSimulationPageResult
     * @description One page of user-simulation associations, oldest first.
     *
     *     ``offset`` and ``limit`` echo the request; when ``has_more`` is true, ask
     *     for the next page with ``offset + limit``.
     */
    UserSimulationPageResult: {
      /** Items */
      items: components['schemas']['UserSimulationItem'][];
      /** Offset */
      offset: number;
      /** Limit */
      limit: number;
      /** Has More */
      has_more: boolean;
    };
    /**
     * UserSimulationPatchRequest
     * @description Explicitly supplied mutable link or presentation fields.
     */
    UserSimulationPatchRequest: {
      /** Simulation Id */
      simulation_id?: string | null;
      /** Legacy Simulation Id */
      legacy_simulation_id?: number | null;
      /** Name */
      name?: string | null;
      /** Description */
      description?: string | null;
    };
    /**
     * V2ErrorResponse
     * @description Strict error response shared by every API v2 resource.
     */
    V2ErrorResponse: {
      /**
       * Status
       * @default error
       * @constant
       */
      status: 'error';
      /** Message */
      message: string;
    };
  };
  responses: never;
  parameters: never;
  requestBodies: never;
  headers: never;
  pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
  list_countries_v2_countries_get: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['CountryListResponse'];
        };
      };
      /** @description The countries list supports GET only. */
      405: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request has query parameters; the list takes none. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The countries query failed internally. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The v2 database is not configured or cannot be reached. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
  list_datasets_v2_datasets_get: {
    parameters: {
      query: {
        /** @description Zero-based result offset */
        offset?: number;
        /** @description Maximum number of returned resources */
        limit?: number;
        /** @description Supported PolicyEngine country ID */
        country_id: 'us' | 'uk';
        policyengine_version?: string | null;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          /** @description Strong validator: a hash of the uncompressed response body, so a gzip-encoded response carries the same tag. */
          ETag?: string;
          /** @description public, with max-age 86400 when the request names policyengine_version and 300 otherwise; current parameter values expire at the next UTC midnight. */
          'Cache-Control'?: string;
          /** @description Origin, Accept-Encoding: caches keep responses apart by origin and by compression; a 304 carries the same value. */
          Vary?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['MetadataDatasetPageResponse'];
        };
      };
      /** @description Not modified: If-None-Match names the current ETag. No body is sent. */
      304: {
        headers: {
          /** @description Strong validator: a hash of the uncompressed response body, so a gzip-encoded response carries the same tag. */
          ETag?: string;
          /** @description public, with max-age 86400 when the request names policyengine_version and 300 otherwise; current parameter values expire at the next UTC midnight. */
          'Cache-Control'?: string;
          /** @description Origin, Accept-Encoding: caches keep responses apart by origin and by compression; a 304 carries the same value. */
          Vary?: string;
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description The requested catalog resource is absent. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The dormant v2 metadata resources support GET only. */
      405: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The query parameters do not match the resource schema, for example an unknown parameter or a malformed PolicyEngine.py version. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The resource query failed internally. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The initialized v2 catalog is unavailable. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
  get_dataset_v2_datasets__dataset_id__get: {
    parameters: {
      query: {
        /** @description Supported PolicyEngine country ID */
        country_id: 'us' | 'uk';
        policyengine_version?: string | null;
      };
      header?: never;
      path: {
        dataset_id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          /** @description Strong validator: a hash of the uncompressed response body, so a gzip-encoded response carries the same tag. */
          ETag?: string;
          /** @description public, with max-age 86400 when the request names policyengine_version and 300 otherwise; current parameter values expire at the next UTC midnight. */
          'Cache-Control'?: string;
          /** @description Origin, Accept-Encoding: caches keep responses apart by origin and by compression; a 304 carries the same value. */
          Vary?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['MetadataDatasetDetailResponse'];
        };
      };
      /** @description Not modified: If-None-Match names the current ETag. No body is sent. */
      304: {
        headers: {
          /** @description Strong validator: a hash of the uncompressed response body, so a gzip-encoded response carries the same tag. */
          ETag?: string;
          /** @description public, with max-age 86400 when the request names policyengine_version and 300 otherwise; current parameter values expire at the next UTC midnight. */
          'Cache-Control'?: string;
          /** @description Origin, Accept-Encoding: caches keep responses apart by origin and by compression; a 304 carries the same value. */
          Vary?: string;
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description The requested catalog resource is absent. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The dormant v2 metadata resources support GET only. */
      405: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The query parameters do not match the resource schema, for example an unknown parameter or a malformed PolicyEngine.py version. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The resource query failed internally. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The initialized v2 catalog is unavailable. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
  get_economy_options_v2_economy_options_get: {
    parameters: {
      query: {
        /** @description Supported PolicyEngine country ID */
        country_id: 'us' | 'uk';
        policyengine_version?: string | null;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          /** @description Strong validator: a hash of the uncompressed response body, so a gzip-encoded response carries the same tag. */
          ETag?: string;
          /** @description public, with max-age 86400 when the request names policyengine_version and 300 otherwise; current parameter values expire at the next UTC midnight. */
          'Cache-Control'?: string;
          /** @description Origin, Accept-Encoding: caches keep responses apart by origin and by compression; a 304 carries the same value. */
          Vary?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['MetadataEconomyOptionsResponse'];
        };
      };
      /** @description Not modified: If-None-Match names the current ETag. No body is sent. */
      304: {
        headers: {
          /** @description Strong validator: a hash of the uncompressed response body, so a gzip-encoded response carries the same tag. */
          ETag?: string;
          /** @description public, with max-age 86400 when the request names policyengine_version and 300 otherwise; current parameter values expire at the next UTC midnight. */
          'Cache-Control'?: string;
          /** @description Origin, Accept-Encoding: caches keep responses apart by origin and by compression; a 304 carries the same value. */
          Vary?: string;
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description The requested catalog resource is absent. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The dormant v2 metadata resources support GET only. */
      405: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The query parameters do not match the resource schema, for example an unknown parameter or a malformed PolicyEngine.py version. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The resource query failed internally. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The initialized v2 catalog is unavailable. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
  submit_household_calculation_v2_household_calculations_post: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['HouseholdCalculationRequest'];
      };
    };
    responses: {
      /** @description Successful Response */
      202: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['HouseholdCalculationResponse'];
        };
      };
      /** @description The household, policy or calculation does not exist. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request does not match the schema, the country does not offer household calculations, the household has no default year, or the simulation service refuses the caller's data, with its reason in the message: a policy changing a parameter the catalog version lacks, a stored policy value or household it cannot calculate (such as a group no person belongs to), or an invalid option. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The household calculation request failed unexpectedly. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The simulation service, the country's catalog version or v2 storage is unavailable; the simulation service's answer cannot be read; or it refuses a reference the Public API has already checked, or has no v2 worker for the catalog version. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
  get_household_calculation_v2_household_calculations__calculation_id__get: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        calculation_id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['HouseholdCalculationResponse'];
        };
      };
      /** @description The household, policy or calculation does not exist. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request does not match the schema, the country does not offer household calculations, the household has no default year, or the simulation service refuses the caller's data, with its reason in the message: a policy changing a parameter the catalog version lacks, a stored policy value or household it cannot calculate (such as a group no person belongs to), or an invalid option. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The household calculation request failed unexpectedly. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The simulation service, the country's catalog version or v2 storage is unavailable; the simulation service's answer cannot be read; or it refuses a reference the Public API has already checked, or has no v2 worker for the catalog version. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
  get_households_v2_households_get: {
    parameters: {
      query: {
        /** @description Zero-based result offset */
        offset?: number;
        /** @description Maximum number of returned resources */
        limit?: number;
        /** @description Supported PolicyEngine country ID */
        country_id: 'us' | 'uk';
        default_year?: number | null;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['HouseholdPageResponse'];
        };
      };
      /** @description The household content or country selection is invalid. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The selected household does not exist. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description Immutable household content conflicts with stored state. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The household request body exceeds 1 MiB. */
      413: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request does not match the household schema. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description Stored household integrity validation failed. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description Supabase household persistence is unavailable. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
  create_household_v2_households_post: {
    parameters: {
      query: {
        /** @description Supported PolicyEngine country ID */
        country_id: 'us' | 'uk';
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['HouseholdCreateRequest'];
      };
    };
    responses: {
      /** @description Equivalent immutable content already exists. */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['HouseholdDetailResponse'];
        };
      };
      /** @description Successful Response */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['HouseholdDetailResponse'];
        };
      };
      /** @description The household content or country selection is invalid. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The selected household does not exist. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description Immutable household content conflicts with stored state. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The household request body exceeds 1 MiB. */
      413: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request does not match the household schema. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description Stored household integrity validation failed. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description Supabase household persistence is unavailable. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
  get_household_v2_households__household_id__get: {
    parameters: {
      query: {
        /** @description Supported PolicyEngine country ID */
        country_id: 'us' | 'uk';
      };
      header?: never;
      path: {
        household_id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['HouseholdDetailResponse'];
        };
      };
      /** @description The household content or country selection is invalid. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The selected household does not exist. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description Immutable household content conflicts with stored state. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The household request body exceeds 1 MiB. */
      413: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request does not match the household schema. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description Stored household integrity validation failed. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description Supabase household persistence is unavailable. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
  get_me_v2_me_get: {
    parameters: {
      query: {
        /** @description Supported PolicyEngine country ID */
        country_id: 'us' | 'uk';
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['MeDetailResponse'];
        };
      };
      /** @description The supplied references or countries contradict each other. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description A valid bearer access token, or a canonical UUID in the PolicyEngine-Unauthenticated-User header, is required; that UUID may not name a signed-in account. The response carries WWW-Authenticate: Bearer. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description Machine (client-credentials) principals are not permitted, and unauthenticated users cannot edit account details. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The record does not exist or belongs to another user. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The change conflicts with stored state, such as a record maintained by the v1 saved-policy mirror. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request body exceeds 256 KiB. */
      413: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request does not match the schema, or a referenced v1 artifact, v2 report or simulation, or linked record does not exist. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The operation could not be completed. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description User authentication, persistence or the simulation service is unavailable. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
  delete_me_v2_me_delete: {
    parameters: {
      query: {
        /** @description Supported PolicyEngine country ID */
        country_id: 'us' | 'uk';
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful Response */
      204: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description The supplied references or countries contradict each other. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description A valid bearer access token, or a canonical UUID in the PolicyEngine-Unauthenticated-User header, is required; that UUID may not name a signed-in account. The response carries WWW-Authenticate: Bearer. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description Machine (client-credentials) principals are not permitted, and unauthenticated users cannot edit account details. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The record does not exist or belongs to another user. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The change conflicts with stored state, such as a record maintained by the v1 saved-policy mirror. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request body exceeds 256 KiB. */
      413: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request does not match the schema, or a referenced v1 artifact, v2 report or simulation, or linked record does not exist. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The operation could not be completed. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description Account data was deleted but the Auth0 user could not be removed; retrying is safe. */
      502: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description Auth0 Management credentials could not be obtained, or persistence is unavailable; nothing was deleted. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
  patch_me_v2_me_patch: {
    parameters: {
      query: {
        /** @description Supported PolicyEngine country ID */
        country_id: 'us' | 'uk';
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['AccountPatchRequest'];
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['MeDetailResponse'];
        };
      };
      /** @description The supplied references or countries contradict each other. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description A valid bearer access token, or a canonical UUID in the PolicyEngine-Unauthenticated-User header, is required; that UUID may not name a signed-in account. The response carries WWW-Authenticate: Bearer. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description Machine (client-credentials) principals are not permitted, and unauthenticated users cannot edit account details. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The record does not exist or belongs to another user. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The change conflicts with stored state, such as a record maintained by the v1 saved-policy mirror. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request body exceeds 256 KiB. */
      413: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request does not match the schema, or a referenced v1 artifact, v2 report or simulation, or linked record does not exist. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The operation could not be completed. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description User authentication, persistence or the simulation service is unavailable. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
  export_me_v2_me_export_get: {
    parameters: {
      query: {
        /** @description Supported PolicyEngine country ID */
        country_id: 'us' | 'uk';
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['MeExportResponse'];
        };
      };
      /** @description The supplied references or countries contradict each other. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description A valid bearer access token, or a canonical UUID in the PolicyEngine-Unauthenticated-User header, is required; that UUID may not name a signed-in account. The response carries WWW-Authenticate: Bearer. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description Machine (client-credentials) principals are not permitted, and unauthenticated users cannot edit account details. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The record does not exist or belongs to another user. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The change conflicts with stored state, such as a record maintained by the v1 saved-policy mirror. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request body exceeds 256 KiB. */
      413: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request does not match the schema, or a referenced v1 artifact, v2 report or simulation, or linked record does not exist. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The operation could not be completed. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description User authentication, persistence or the simulation service is unavailable. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
  upgrade_me_v2_me_upgrade_post: {
    parameters: {
      query: {
        /** @description Supported PolicyEngine country ID */
        country_id: 'us' | 'uk';
      };
      header: {
        /** @description The browser's unauthenticated user ID (a canonical UUID). */
        'PolicyEngine-Unauthenticated-User': string;
      };
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['MeUpgradeResponse'];
        };
      };
      /** @description The supplied references or countries contradict each other. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description A valid bearer access token, or a canonical UUID in the PolicyEngine-Unauthenticated-User header, is required; that UUID may not name a signed-in account. The response carries WWW-Authenticate: Bearer. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description Machine (client-credentials) principals are not permitted, and unauthenticated users cannot edit account details. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The record does not exist or belongs to another user. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The change conflicts with stored state, such as a record maintained by the v1 saved-policy mirror. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request body exceeds 256 KiB. */
      413: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request does not match the schema, or a referenced v1 artifact, v2 report or simulation, or linked record does not exist. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The operation could not be completed. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description User authentication, persistence or the simulation service is unavailable. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
  get_model_catalog_v2_model_catalog_get: {
    parameters: {
      query: {
        /** @description Supported PolicyEngine country ID */
        country_id: 'us' | 'uk';
        policyengine_version?: string | null;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          /** @description Strong validator: a hash of the uncompressed response body, so a gzip-encoded response carries the same tag. */
          ETag?: string;
          /** @description public, with max-age 86400 when the request names policyengine_version and 300 otherwise; current parameter values expire at the next UTC midnight. */
          'Cache-Control'?: string;
          /** @description Origin, Accept-Encoding: caches keep responses apart by origin and by compression; a 304 carries the same value. */
          Vary?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['MetadataModelCatalogResponse'];
        };
      };
      /** @description Not modified: If-None-Match names the current ETag. No body is sent. */
      304: {
        headers: {
          /** @description Strong validator: a hash of the uncompressed response body, so a gzip-encoded response carries the same tag. */
          ETag?: string;
          /** @description public, with max-age 86400 when the request names policyengine_version and 300 otherwise; current parameter values expire at the next UTC midnight. */
          'Cache-Control'?: string;
          /** @description Origin, Accept-Encoding: caches keep responses apart by origin and by compression; a 304 carries the same value. */
          Vary?: string;
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description The requested catalog resource is absent. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The dormant v2 metadata resources support GET only. */
      405: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The query parameters do not match the resource schema, for example an unknown parameter or a malformed PolicyEngine.py version. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The resource query failed internally. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The initialized v2 catalog is unavailable. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
  get_catalog_parameters_v2_model_catalog_parameters_get: {
    parameters: {
      query: {
        /** @description Supported PolicyEngine country ID */
        country_id: 'us' | 'uk';
        policyengine_version?: string | null;
        /** @description Exact parameter paths; repeat the key for each one */
        name: string[];
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          /** @description Strong validator: a hash of the uncompressed response body, so a gzip-encoded response carries the same tag. */
          ETag?: string;
          /** @description public, with max-age 86400 when the request names policyengine_version and 300 otherwise; current parameter values expire at the next UTC midnight. */
          'Cache-Control'?: string;
          /** @description Origin, Accept-Encoding: caches keep responses apart by origin and by compression; a 304 carries the same value. */
          Vary?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['MetadataCatalogParametersResponse'];
        };
      };
      /** @description Not modified: If-None-Match names the current ETag. No body is sent. */
      304: {
        headers: {
          /** @description Strong validator: a hash of the uncompressed response body, so a gzip-encoded response carries the same tag. */
          ETag?: string;
          /** @description public, with max-age 86400 when the request names policyengine_version and 300 otherwise; current parameter values expire at the next UTC midnight. */
          'Cache-Control'?: string;
          /** @description Origin, Accept-Encoding: caches keep responses apart by origin and by compression; a 304 carries the same value. */
          Vary?: string;
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description The requested catalog resource is absent. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The dormant v2 metadata resources support GET only. */
      405: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The query parameters do not match the resource schema, for example an unknown parameter or a malformed PolicyEngine.py version. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The resource query failed internally. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The initialized v2 catalog is unavailable. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
  get_catalog_variables_v2_model_catalog_variables_get: {
    parameters: {
      query: {
        /** @description Supported PolicyEngine country ID */
        country_id: 'us' | 'uk';
        policyengine_version?: string | null;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          /** @description Strong validator: a hash of the uncompressed response body, so a gzip-encoded response carries the same tag. */
          ETag?: string;
          /** @description public, with max-age 86400 when the request names policyengine_version and 300 otherwise; current parameter values expire at the next UTC midnight. */
          'Cache-Control'?: string;
          /** @description Origin, Accept-Encoding: caches keep responses apart by origin and by compression; a 304 carries the same value. */
          Vary?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['MetadataCatalogVariablesResponse'];
        };
      };
      /** @description Not modified: If-None-Match names the current ETag. No body is sent. */
      304: {
        headers: {
          /** @description Strong validator: a hash of the uncompressed response body, so a gzip-encoded response carries the same tag. */
          ETag?: string;
          /** @description public, with max-age 86400 when the request names policyengine_version and 300 otherwise; current parameter values expire at the next UTC midnight. */
          'Cache-Control'?: string;
          /** @description Origin, Accept-Encoding: caches keep responses apart by origin and by compression; a 304 carries the same value. */
          Vary?: string;
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description The requested catalog resource is absent. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The dormant v2 metadata resources support GET only. */
      405: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The query parameters do not match the resource schema, for example an unknown parameter or a malformed PolicyEngine.py version. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The resource query failed internally. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The initialized v2 catalog is unavailable. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
  list_parameter_values_v2_parameter_values_get: {
    parameters: {
      query: {
        /** @description Zero-based result offset */
        offset?: number;
        /** @description Maximum number of returned resources */
        limit?: number;
        /** @description Supported PolicyEngine country ID */
        country_id: 'us' | 'uk';
        policyengine_version?: string | null;
        parameter_id?: string | null;
        /** @description Keep only these exact parameter paths' values; repeat the key */
        parameter_name?: string[] | null;
        /** @description Keep only the values in effect today (UTC) */
        current?: boolean;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          /** @description Strong validator: a hash of the uncompressed response body, so a gzip-encoded response carries the same tag. */
          ETag?: string;
          /** @description public, with max-age 86400 when the request names policyengine_version and 300 otherwise; current parameter values expire at the next UTC midnight. */
          'Cache-Control'?: string;
          /** @description Origin, Accept-Encoding: caches keep responses apart by origin and by compression; a 304 carries the same value. */
          Vary?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['MetadataParameterValuePageResponse'];
        };
      };
      /** @description Not modified: If-None-Match names the current ETag. No body is sent. */
      304: {
        headers: {
          /** @description Strong validator: a hash of the uncompressed response body, so a gzip-encoded response carries the same tag. */
          ETag?: string;
          /** @description public, with max-age 86400 when the request names policyengine_version and 300 otherwise; current parameter values expire at the next UTC midnight. */
          'Cache-Control'?: string;
          /** @description Origin, Accept-Encoding: caches keep responses apart by origin and by compression; a 304 carries the same value. */
          Vary?: string;
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description The requested catalog resource is absent. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The dormant v2 metadata resources support GET only. */
      405: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The query parameters do not match the resource schema, for example an unknown parameter or a malformed PolicyEngine.py version. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The resource query failed internally. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The initialized v2 catalog is unavailable. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
  get_parameter_value_v2_parameter_values__value_id__get: {
    parameters: {
      query: {
        /** @description Supported PolicyEngine country ID */
        country_id: 'us' | 'uk';
        policyengine_version?: string | null;
      };
      header?: never;
      path: {
        value_id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          /** @description Strong validator: a hash of the uncompressed response body, so a gzip-encoded response carries the same tag. */
          ETag?: string;
          /** @description public, with max-age 86400 when the request names policyengine_version and 300 otherwise; current parameter values expire at the next UTC midnight. */
          'Cache-Control'?: string;
          /** @description Origin, Accept-Encoding: caches keep responses apart by origin and by compression; a 304 carries the same value. */
          Vary?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['MetadataParameterValueDetailResponse'];
        };
      };
      /** @description Not modified: If-None-Match names the current ETag. No body is sent. */
      304: {
        headers: {
          /** @description Strong validator: a hash of the uncompressed response body, so a gzip-encoded response carries the same tag. */
          ETag?: string;
          /** @description public, with max-age 86400 when the request names policyengine_version and 300 otherwise; current parameter values expire at the next UTC midnight. */
          'Cache-Control'?: string;
          /** @description Origin, Accept-Encoding: caches keep responses apart by origin and by compression; a 304 carries the same value. */
          Vary?: string;
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description The requested catalog resource is absent. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The dormant v2 metadata resources support GET only. */
      405: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The query parameters do not match the resource schema, for example an unknown parameter or a malformed PolicyEngine.py version. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The resource query failed internally. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The initialized v2 catalog is unavailable. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
  list_parameters_v2_parameters_get: {
    parameters: {
      query: {
        /** @description Zero-based result offset */
        offset?: number;
        /** @description Maximum number of returned resources */
        limit?: number;
        /** @description Supported PolicyEngine country ID */
        country_id: 'us' | 'uk';
        policyengine_version?: string | null;
        /** @description Case-insensitive substring of the name, label or description */
        search?: string | null;
        /** @description Keep only these exact parameter paths; repeat the key */
        name?: string[] | null;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          /** @description Strong validator: a hash of the uncompressed response body, so a gzip-encoded response carries the same tag. */
          ETag?: string;
          /** @description public, with max-age 86400 when the request names policyengine_version and 300 otherwise; current parameter values expire at the next UTC midnight. */
          'Cache-Control'?: string;
          /** @description Origin, Accept-Encoding: caches keep responses apart by origin and by compression; a 304 carries the same value. */
          Vary?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['MetadataParameterPageResponse'];
        };
      };
      /** @description Not modified: If-None-Match names the current ETag. No body is sent. */
      304: {
        headers: {
          /** @description Strong validator: a hash of the uncompressed response body, so a gzip-encoded response carries the same tag. */
          ETag?: string;
          /** @description public, with max-age 86400 when the request names policyengine_version and 300 otherwise; current parameter values expire at the next UTC midnight. */
          'Cache-Control'?: string;
          /** @description Origin, Accept-Encoding: caches keep responses apart by origin and by compression; a 304 carries the same value. */
          Vary?: string;
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description The requested catalog resource is absent. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The dormant v2 metadata resources support GET only. */
      405: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The query parameters do not match the resource schema, for example an unknown parameter or a malformed PolicyEngine.py version. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The resource query failed internally. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The initialized v2 catalog is unavailable. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
  list_parameter_children_v2_parameters_children_get: {
    parameters: {
      query: {
        /** @description Zero-based result offset */
        offset?: number;
        /** @description Maximum number of returned resources */
        limit?: number;
        /** @description Supported PolicyEngine country ID */
        country_id: 'us' | 'uk';
        policyengine_version?: string | null;
        /** @description Path of the node whose direct children are listed; empty for the top level. A bracket schedule's brackets are its children. */
        parent_path?: string;
        /** @description List only the children a reform can change, sorted by label, with child counts that count only those */
        reform_changeable?: boolean;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          /** @description Strong validator: a hash of the uncompressed response body, so a gzip-encoded response carries the same tag. */
          ETag?: string;
          /** @description public, with max-age 86400 when the request names policyengine_version and 300 otherwise; current parameter values expire at the next UTC midnight. */
          'Cache-Control'?: string;
          /** @description Origin, Accept-Encoding: caches keep responses apart by origin and by compression; a 304 carries the same value. */
          Vary?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['MetadataParameterChildPageResponse'];
        };
      };
      /** @description Not modified: If-None-Match names the current ETag. No body is sent. */
      304: {
        headers: {
          /** @description Strong validator: a hash of the uncompressed response body, so a gzip-encoded response carries the same tag. */
          ETag?: string;
          /** @description public, with max-age 86400 when the request names policyengine_version and 300 otherwise; current parameter values expire at the next UTC midnight. */
          'Cache-Control'?: string;
          /** @description Origin, Accept-Encoding: caches keep responses apart by origin and by compression; a 304 carries the same value. */
          Vary?: string;
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description The requested catalog resource is absent. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The dormant v2 metadata resources support GET only. */
      405: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The query parameters do not match the resource schema, for example an unknown parameter or a malformed PolicyEngine.py version. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The resource query failed internally. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The initialized v2 catalog is unavailable, or the catalog version has no parameter tree (publication writes trees only for the versions it publishes and for the installed version with catalog format 2); the message then names the version. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
  get_parameter_search_file_v2_parameters_search_file_get: {
    parameters: {
      query: {
        /** @description Supported PolicyEngine country ID */
        country_id: 'us' | 'uk';
        policyengine_version?: string | null;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description The catalog version's parameter search file, gzip-encoded when the request accepts gzip. */
      200: {
        headers: {
          /** @description Strong tag of this representation: the SHA-256 of the uncompressed JSON, with "-gzip" appended for the gzip-encoded one. */
          ETag?: string;
          /** @description public, with max-age 86400 when the request names policyengine_version and 300 otherwise; current parameter values expire at the next UTC midnight. */
          'Cache-Control'?: string;
          /** @description Origin, Accept-Encoding: caches keep responses apart by origin and by compression; a 304 carries the same value. */
          Vary?: string;
          /** @description gzip when the request accepts gzip; absent otherwise. */
          'Content-Encoding'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['MetadataParameterSearchFileContent'];
        };
      };
      /** @description Not modified: If-None-Match names the current ETag. No body is sent. */
      304: {
        headers: {
          /** @description Strong validator: a hash of the uncompressed response body, so a gzip-encoded response carries the same tag. */
          ETag?: string;
          /** @description public, with max-age 86400 when the request names policyengine_version and 300 otherwise; current parameter values expire at the next UTC midnight. */
          'Cache-Control'?: string;
          /** @description Origin, Accept-Encoding: caches keep responses apart by origin and by compression; a 304 carries the same value. */
          Vary?: string;
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description The requested catalog resource is absent. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The dormant v2 metadata resources support GET only. */
      405: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The query parameters do not match the resource schema, for example an unknown parameter or a malformed PolicyEngine.py version. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The resource query failed internally. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The initialized v2 catalog is unavailable, or the catalog version has no parameter search file: only catalog format 2 versions that publication has published, or run with installed, since search files were added have one. The message then names the version. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
  get_parameter_v2_parameters__parameter_id__get: {
    parameters: {
      query: {
        /** @description Supported PolicyEngine country ID */
        country_id: 'us' | 'uk';
        policyengine_version?: string | null;
      };
      header?: never;
      path: {
        parameter_id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          /** @description Strong validator: a hash of the uncompressed response body, so a gzip-encoded response carries the same tag. */
          ETag?: string;
          /** @description public, with max-age 86400 when the request names policyengine_version and 300 otherwise; current parameter values expire at the next UTC midnight. */
          'Cache-Control'?: string;
          /** @description Origin, Accept-Encoding: caches keep responses apart by origin and by compression; a 304 carries the same value. */
          Vary?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['MetadataParameterDetailResponse'];
        };
      };
      /** @description Not modified: If-None-Match names the current ETag. No body is sent. */
      304: {
        headers: {
          /** @description Strong validator: a hash of the uncompressed response body, so a gzip-encoded response carries the same tag. */
          ETag?: string;
          /** @description public, with max-age 86400 when the request names policyengine_version and 300 otherwise; current parameter values expire at the next UTC midnight. */
          'Cache-Control'?: string;
          /** @description Origin, Accept-Encoding: caches keep responses apart by origin and by compression; a 304 carries the same value. */
          Vary?: string;
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description The requested catalog resource is absent. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The dormant v2 metadata resources support GET only. */
      405: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The query parameters do not match the resource schema, for example an unknown parameter or a malformed PolicyEngine.py version. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The resource query failed internally. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The initialized v2 catalog is unavailable. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
  get_policies_v2_policies_get: {
    parameters: {
      query: {
        /** @description Zero-based result offset */
        offset?: number;
        /** @description Maximum number of returned resources */
        limit?: number;
        /** @description Supported PolicyEngine country ID */
        country_id: 'us' | 'uk';
        tax_benefit_model_id?: string | null;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['PolicyPageResponse'];
        };
      };
      /** @description The policy content or country selection is invalid. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The selected policy or catalog does not exist. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description Immutable policy identity conflicts with stored state. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The policy request body exceeds 1 MiB. */
      413: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request does not match the policy schema. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description Stored policy integrity validation failed. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description Supabase policy persistence is unavailable. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
  create_policy_v2_policies_post: {
    parameters: {
      query: {
        /** @description Supported PolicyEngine country ID */
        country_id: 'us' | 'uk';
        policyengine_version?: string | null;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['PolicyCreateRequest'];
      };
    };
    responses: {
      /** @description Equivalent immutable content already exists. */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['PolicyDetailResponse'];
        };
      };
      /** @description Successful Response */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['PolicyDetailResponse'];
        };
      };
      /** @description The policy content or country selection is invalid. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The selected policy or catalog does not exist. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description Immutable policy identity conflicts with stored state. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The policy request body exceeds 1 MiB. */
      413: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request does not match the policy schema. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description Stored policy integrity validation failed. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description Supabase policy persistence is unavailable. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
  get_policy_v2_policies__policy_id__get: {
    parameters: {
      query: {
        /** @description Supported PolicyEngine country ID */
        country_id: 'us' | 'uk';
      };
      header?: never;
      path: {
        policy_id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['PolicyDetailResponse'];
        };
      };
      /** @description The policy content or country selection is invalid. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The selected policy or catalog does not exist. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description Immutable policy identity conflicts with stored state. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The policy request body exceeds 1 MiB. */
      413: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request does not match the policy schema. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description Stored policy integrity validation failed. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description Supabase policy persistence is unavailable. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
  list_regions_v2_regions_get: {
    parameters: {
      query: {
        /** @description Zero-based result offset */
        offset?: number;
        /** @description Maximum number of returned resources */
        limit?: number;
        /** @description Supported PolicyEngine country ID */
        country_id: 'us' | 'uk';
        policyengine_version?: string | null;
        /** @description Keep only regions of this type */
        region_type?: components['schemas']['MetadataRegionType'] | null;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          /** @description Strong validator: a hash of the uncompressed response body, so a gzip-encoded response carries the same tag. */
          ETag?: string;
          /** @description public, with max-age 86400 when the request names policyengine_version and 300 otherwise; current parameter values expire at the next UTC midnight. */
          'Cache-Control'?: string;
          /** @description Origin, Accept-Encoding: caches keep responses apart by origin and by compression; a 304 carries the same value. */
          Vary?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['MetadataRegionPageResponse'];
        };
      };
      /** @description Not modified: If-None-Match names the current ETag. No body is sent. */
      304: {
        headers: {
          /** @description Strong validator: a hash of the uncompressed response body, so a gzip-encoded response carries the same tag. */
          ETag?: string;
          /** @description public, with max-age 86400 when the request names policyengine_version and 300 otherwise; current parameter values expire at the next UTC midnight. */
          'Cache-Control'?: string;
          /** @description Origin, Accept-Encoding: caches keep responses apart by origin and by compression; a 304 carries the same value. */
          Vary?: string;
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description The requested catalog resource is absent. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The dormant v2 metadata resources support GET only. */
      405: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The query parameters do not match the resource schema, for example an unknown parameter or a malformed PolicyEngine.py version. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The resource query failed internally. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The initialized v2 catalog is unavailable. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
  get_region_by_code_v2_regions_by_code__region_code__get: {
    parameters: {
      query: {
        /** @description Supported PolicyEngine country ID */
        country_id: 'us' | 'uk';
        policyengine_version?: string | null;
      };
      header?: never;
      path: {
        region_code: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          /** @description Strong validator: a hash of the uncompressed response body, so a gzip-encoded response carries the same tag. */
          ETag?: string;
          /** @description public, with max-age 86400 when the request names policyengine_version and 300 otherwise; current parameter values expire at the next UTC midnight. */
          'Cache-Control'?: string;
          /** @description Origin, Accept-Encoding: caches keep responses apart by origin and by compression; a 304 carries the same value. */
          Vary?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['MetadataRegionDetailResponse'];
        };
      };
      /** @description Not modified: If-None-Match names the current ETag. No body is sent. */
      304: {
        headers: {
          /** @description Strong validator: a hash of the uncompressed response body, so a gzip-encoded response carries the same tag. */
          ETag?: string;
          /** @description public, with max-age 86400 when the request names policyengine_version and 300 otherwise; current parameter values expire at the next UTC midnight. */
          'Cache-Control'?: string;
          /** @description Origin, Accept-Encoding: caches keep responses apart by origin and by compression; a 304 carries the same value. */
          Vary?: string;
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description The requested catalog resource is absent. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The dormant v2 metadata resources support GET only. */
      405: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The query parameters do not match the resource schema, for example an unknown parameter or a malformed PolicyEngine.py version. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The resource query failed internally. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The initialized v2 catalog is unavailable. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
  get_region_v2_regions__region_id__get: {
    parameters: {
      query: {
        /** @description Supported PolicyEngine country ID */
        country_id: 'us' | 'uk';
        policyengine_version?: string | null;
      };
      header?: never;
      path: {
        region_id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          /** @description Strong validator: a hash of the uncompressed response body, so a gzip-encoded response carries the same tag. */
          ETag?: string;
          /** @description public, with max-age 86400 when the request names policyengine_version and 300 otherwise; current parameter values expire at the next UTC midnight. */
          'Cache-Control'?: string;
          /** @description Origin, Accept-Encoding: caches keep responses apart by origin and by compression; a 304 carries the same value. */
          Vary?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['MetadataRegionDetailResponse'];
        };
      };
      /** @description Not modified: If-None-Match names the current ETag. No body is sent. */
      304: {
        headers: {
          /** @description Strong validator: a hash of the uncompressed response body, so a gzip-encoded response carries the same tag. */
          ETag?: string;
          /** @description public, with max-age 86400 when the request names policyengine_version and 300 otherwise; current parameter values expire at the next UTC midnight. */
          'Cache-Control'?: string;
          /** @description Origin, Accept-Encoding: caches keep responses apart by origin and by compression; a 304 carries the same value. */
          Vary?: string;
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description The requested catalog resource is absent. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The dormant v2 metadata resources support GET only. */
      405: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The query parameters do not match the resource schema, for example an unknown parameter or a malformed PolicyEngine.py version. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The resource query failed internally. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The initialized v2 catalog is unavailable. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
  list_reports_v2_reports_get: {
    parameters: {
      query: {
        /** @description Supported PolicyEngine country ID */
        country_id: 'us' | 'uk';
        /** @description A report to list; repeat for each report */
        report_id: string[];
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ReportListResponse'];
        };
      };
      /** @description The request does not match the schema. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The operation could not be completed. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The simulation service or the v2 database is unavailable. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
  submit_report_v2_reports_post: {
    parameters: {
      query: {
        /** @description Supported PolicyEngine country ID */
        country_id: 'us' | 'uk';
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json':
          | components['schemas']['EconomyReportCreateRequest']
          | components['schemas']['HouseholdReportCreateRequest'];
      };
    };
    responses: {
      /** @description Successful Response */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ReportDetailResponse'];
        };
      };
      /** @description The body and query name different countries. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description A household report's household or one of its policies does not exist in this country. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request body exceeds 16 KiB. */
      413: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request does not match the schema; the country does not have economy reports (such as a household-only country) or household calculations; the household has no default year; or the simulation service cannot run the report (for example, no such region or dataset in the current catalog version, or a policy changing a parameter that version lacks); the message says which. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The operation could not be completed. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The simulation service or the v2 database is unavailable. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
  get_report_by_legacy_number_v2_reports_by_legacy_number__legacy_report_id__get: {
    parameters: {
      query: {
        /** @description Supported PolicyEngine country ID */
        country_id: 'us' | 'uk';
      };
      header?: never;
      path: {
        /** @description The v1 report output number the report was migrated from */
        legacy_report_id: number;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ReportDetailResponse'];
        };
      };
      /** @description No report has this ID or v1 number in this country. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request does not match the schema. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The operation could not be completed. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The simulation service has the report but cannot read back its stored result. */
      502: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The simulation service or the v2 database is unavailable. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
  get_report_v2_reports__report_id__get: {
    parameters: {
      query: {
        /** @description Supported PolicyEngine country ID */
        country_id: 'us' | 'uk';
      };
      header?: never;
      path: {
        report_id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ReportDetailResponse'];
        };
      };
      /** @description No report has this ID or v1 number in this country. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request does not match the schema. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The operation could not be completed. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The simulation service has the report but cannot read back its stored result. */
      502: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The simulation service or the v2 database is unavailable. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
  list_report_runs_v2_reports__report_id__runs_get: {
    parameters: {
      query: {
        /** @description Supported PolicyEngine country ID */
        country_id: 'us' | 'uk';
      };
      header?: never;
      path: {
        report_id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ReportRunListResponse'];
        };
      };
      /** @description No economy report has this ID in this country. A household report does not list its runs; its newest run is in the report itself. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request does not match the schema. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The operation could not be completed. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The simulation service or the v2 database is unavailable. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
  run_report_v2_reports__report_id__runs_post: {
    parameters: {
      query: {
        /** @description Supported PolicyEngine country ID */
        country_id: 'us' | 'uk';
      };
      header?: never;
      path: {
        report_id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['EconomyReportRunRequest'];
      };
    };
    responses: {
      /** @description Successful Response */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ReportRunDetailResponse'];
        };
      };
      /** @description No report has this ID or v1 number in this country. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request body exceeds 16 KiB. */
      413: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request does not match the schema; the country does not have economy reports (such as a household-only country) or household calculations; the household has no default year; or the simulation service cannot run the report (for example, no such region or dataset in the current catalog version, or a policy changing a parameter that version lacks); the message says which. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The operation could not be completed. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The simulation service or the v2 database is unavailable. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
  get_shared_report_v2_shared_reports__association_id__get: {
    parameters: {
      query: {
        /** @description Supported PolicyEngine country ID */
        country_id: 'us' | 'uk';
      };
      header?: never;
      path: {
        association_id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['SharedUserReportDetailResponse'];
        };
      };
      /** @description No saved report has this ID in this country. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The ID or the query does not match the schema. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The operation could not be completed. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description User authentication, persistence or the simulation service is unavailable. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
  list_model_versions_v2_tax_benefit_model_versions_get: {
    parameters: {
      query: {
        /** @description Zero-based result offset */
        offset?: number;
        /** @description Maximum number of returned resources */
        limit?: number;
        /** @description Supported PolicyEngine country ID */
        country_id: 'us' | 'uk';
        policyengine_version?: string | null;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          /** @description Strong validator: a hash of the uncompressed response body, so a gzip-encoded response carries the same tag. */
          ETag?: string;
          /** @description public, with max-age 86400 when the request names policyengine_version and 300 otherwise; current parameter values expire at the next UTC midnight. */
          'Cache-Control'?: string;
          /** @description Origin, Accept-Encoding: caches keep responses apart by origin and by compression; a 304 carries the same value. */
          Vary?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['MetadataModelVersionPageResponse'];
        };
      };
      /** @description Not modified: If-None-Match names the current ETag. No body is sent. */
      304: {
        headers: {
          /** @description Strong validator: a hash of the uncompressed response body, so a gzip-encoded response carries the same tag. */
          ETag?: string;
          /** @description public, with max-age 86400 when the request names policyengine_version and 300 otherwise; current parameter values expire at the next UTC midnight. */
          'Cache-Control'?: string;
          /** @description Origin, Accept-Encoding: caches keep responses apart by origin and by compression; a 304 carries the same value. */
          Vary?: string;
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description The requested catalog resource is absent. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The dormant v2 metadata resources support GET only. */
      405: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The query parameters do not match the resource schema, for example an unknown parameter or a malformed PolicyEngine.py version. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The resource query failed internally. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The initialized v2 catalog is unavailable. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
  get_model_version_v2_tax_benefit_model_versions__version_id__get: {
    parameters: {
      query: {
        /** @description Supported PolicyEngine country ID */
        country_id: 'us' | 'uk';
        policyengine_version?: string | null;
      };
      header?: never;
      path: {
        version_id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          /** @description Strong validator: a hash of the uncompressed response body, so a gzip-encoded response carries the same tag. */
          ETag?: string;
          /** @description public, with max-age 86400 when the request names policyengine_version and 300 otherwise; current parameter values expire at the next UTC midnight. */
          'Cache-Control'?: string;
          /** @description Origin, Accept-Encoding: caches keep responses apart by origin and by compression; a 304 carries the same value. */
          Vary?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['MetadataModelVersionDetailResponse'];
        };
      };
      /** @description Not modified: If-None-Match names the current ETag. No body is sent. */
      304: {
        headers: {
          /** @description Strong validator: a hash of the uncompressed response body, so a gzip-encoded response carries the same tag. */
          ETag?: string;
          /** @description public, with max-age 86400 when the request names policyengine_version and 300 otherwise; current parameter values expire at the next UTC midnight. */
          'Cache-Control'?: string;
          /** @description Origin, Accept-Encoding: caches keep responses apart by origin and by compression; a 304 carries the same value. */
          Vary?: string;
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description The requested catalog resource is absent. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The dormant v2 metadata resources support GET only. */
      405: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The query parameters do not match the resource schema, for example an unknown parameter or a malformed PolicyEngine.py version. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The resource query failed internally. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The initialized v2 catalog is unavailable. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
  list_models_v2_tax_benefit_models_get: {
    parameters: {
      query: {
        /** @description Zero-based result offset */
        offset?: number;
        /** @description Maximum number of returned resources */
        limit?: number;
        /** @description Supported PolicyEngine country ID */
        country_id: 'us' | 'uk';
        policyengine_version?: string | null;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          /** @description Strong validator: a hash of the uncompressed response body, so a gzip-encoded response carries the same tag. */
          ETag?: string;
          /** @description public, with max-age 86400 when the request names policyengine_version and 300 otherwise; current parameter values expire at the next UTC midnight. */
          'Cache-Control'?: string;
          /** @description Origin, Accept-Encoding: caches keep responses apart by origin and by compression; a 304 carries the same value. */
          Vary?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['MetadataModelPageResponse'];
        };
      };
      /** @description Not modified: If-None-Match names the current ETag. No body is sent. */
      304: {
        headers: {
          /** @description Strong validator: a hash of the uncompressed response body, so a gzip-encoded response carries the same tag. */
          ETag?: string;
          /** @description public, with max-age 86400 when the request names policyengine_version and 300 otherwise; current parameter values expire at the next UTC midnight. */
          'Cache-Control'?: string;
          /** @description Origin, Accept-Encoding: caches keep responses apart by origin and by compression; a 304 carries the same value. */
          Vary?: string;
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description The requested catalog resource is absent. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The dormant v2 metadata resources support GET only. */
      405: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The query parameters do not match the resource schema, for example an unknown parameter or a malformed PolicyEngine.py version. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The resource query failed internally. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The initialized v2 catalog is unavailable. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
  get_model_by_country_v2_tax_benefit_models_by_country__country_id__get: {
    parameters: {
      query?: {
        policyengine_version?: string | null;
      };
      header?: never;
      path: {
        country_id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          /** @description Strong validator: a hash of the uncompressed response body, so a gzip-encoded response carries the same tag. */
          ETag?: string;
          /** @description public, with max-age 86400 when the request names policyengine_version and 300 otherwise; current parameter values expire at the next UTC midnight. */
          'Cache-Control'?: string;
          /** @description Origin, Accept-Encoding: caches keep responses apart by origin and by compression; a 304 carries the same value. */
          Vary?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['MetadataModelSelectionResponse'];
        };
      };
      /** @description Not modified: If-None-Match names the current ETag. No body is sent. */
      304: {
        headers: {
          /** @description Strong validator: a hash of the uncompressed response body, so a gzip-encoded response carries the same tag. */
          ETag?: string;
          /** @description public, with max-age 86400 when the request names policyengine_version and 300 otherwise; current parameter values expire at the next UTC midnight. */
          'Cache-Control'?: string;
          /** @description Origin, Accept-Encoding: caches keep responses apart by origin and by compression; a 304 carries the same value. */
          Vary?: string;
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description The country in the path is not supported. Query parameters are checked first: an invalid one, including the PolicyEngine.py version, returns 422. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The requested catalog resource is absent. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The dormant v2 metadata resources support GET only. */
      405: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The query parameters do not match the resource schema, for example an unknown parameter or a malformed PolicyEngine.py version. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The resource query failed internally. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The initialized v2 catalog is unavailable. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
  get_model_v2_tax_benefit_models__model_id__get: {
    parameters: {
      query: {
        /** @description Supported PolicyEngine country ID */
        country_id: 'us' | 'uk';
        policyengine_version?: string | null;
      };
      header?: never;
      path: {
        model_id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          /** @description Strong validator: a hash of the uncompressed response body, so a gzip-encoded response carries the same tag. */
          ETag?: string;
          /** @description public, with max-age 86400 when the request names policyengine_version and 300 otherwise; current parameter values expire at the next UTC midnight. */
          'Cache-Control'?: string;
          /** @description Origin, Accept-Encoding: caches keep responses apart by origin and by compression; a 304 carries the same value. */
          Vary?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['MetadataModelDetailResponse'];
        };
      };
      /** @description Not modified: If-None-Match names the current ETag. No body is sent. */
      304: {
        headers: {
          /** @description Strong validator: a hash of the uncompressed response body, so a gzip-encoded response carries the same tag. */
          ETag?: string;
          /** @description public, with max-age 86400 when the request names policyengine_version and 300 otherwise; current parameter values expire at the next UTC midnight. */
          'Cache-Control'?: string;
          /** @description Origin, Accept-Encoding: caches keep responses apart by origin and by compression; a 304 carries the same value. */
          Vary?: string;
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description The requested catalog resource is absent. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The dormant v2 metadata resources support GET only. */
      405: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The query parameters do not match the resource schema, for example an unknown parameter or a malformed PolicyEngine.py version. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The resource query failed internally. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The initialized v2 catalog is unavailable. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
  get_user_households_v2_user_households_get: {
    parameters: {
      query: {
        /** @description Zero-based result offset */
        offset?: number;
        /** @description Maximum number of returned resources */
        limit?: number;
        /** @description Supported PolicyEngine country ID */
        country_id: 'us' | 'uk';
        household_id?: string | null;
        legacy_household_id?: number | null;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['UserHouseholdPageResponse'];
        };
      };
      /** @description The supplied references or countries contradict each other. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description A valid bearer access token, or a canonical UUID in the PolicyEngine-Unauthenticated-User header, is required; that UUID may not name a signed-in account. The response carries WWW-Authenticate: Bearer. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description Machine (client-credentials) principals are not permitted, and unauthenticated users cannot edit account details. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The record does not exist or belongs to another user. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The change conflicts with stored state, such as a record maintained by the v1 saved-policy mirror. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request body exceeds 256 KiB. */
      413: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request does not match the schema, or a referenced v1 artifact or linked record does not exist. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The operation could not be completed. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description User authentication or persistence is unavailable. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
  create_user_household_v2_user_households_post: {
    parameters: {
      query: {
        /** @description Supported PolicyEngine country ID */
        country_id: 'us' | 'uk';
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['UserHouseholdCreateRequest'];
      };
    };
    responses: {
      /** @description Successful Response */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['UserHouseholdDetailResponse'];
        };
      };
      /** @description The supplied references or countries contradict each other. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description A valid bearer access token, or a canonical UUID in the PolicyEngine-Unauthenticated-User header, is required; that UUID may not name a signed-in account. The response carries WWW-Authenticate: Bearer. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description Machine (client-credentials) principals are not permitted, and unauthenticated users cannot edit account details. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The record does not exist or belongs to another user. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The change conflicts with stored state, such as a record maintained by the v1 saved-policy mirror. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request body exceeds 256 KiB. */
      413: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request does not match the schema, or a referenced v1 artifact or linked record does not exist. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The operation could not be completed. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description User authentication or persistence is unavailable. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
  get_user_household_v2_user_households__association_id__get: {
    parameters: {
      query: {
        /** @description Supported PolicyEngine country ID */
        country_id: 'us' | 'uk';
      };
      header?: never;
      path: {
        association_id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['UserHouseholdDetailResponse'];
        };
      };
      /** @description The supplied references or countries contradict each other. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description A valid bearer access token, or a canonical UUID in the PolicyEngine-Unauthenticated-User header, is required; that UUID may not name a signed-in account. The response carries WWW-Authenticate: Bearer. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description Machine (client-credentials) principals are not permitted, and unauthenticated users cannot edit account details. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The record does not exist or belongs to another user. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The change conflicts with stored state, such as a record maintained by the v1 saved-policy mirror. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request body exceeds 256 KiB. */
      413: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request does not match the schema, or a referenced v1 artifact or linked record does not exist. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The operation could not be completed. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description User authentication or persistence is unavailable. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
  delete_user_household_route_v2_user_households__association_id__delete: {
    parameters: {
      query: {
        /** @description Supported PolicyEngine country ID */
        country_id: 'us' | 'uk';
      };
      header?: never;
      path: {
        association_id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful Response */
      204: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description The supplied references or countries contradict each other. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description A valid bearer access token, or a canonical UUID in the PolicyEngine-Unauthenticated-User header, is required; that UUID may not name a signed-in account. The response carries WWW-Authenticate: Bearer. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description Machine (client-credentials) principals are not permitted, and unauthenticated users cannot edit account details. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The record does not exist or belongs to another user. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The change conflicts with stored state, such as a record maintained by the v1 saved-policy mirror. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request body exceeds 256 KiB. */
      413: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request does not match the schema, or a referenced v1 artifact or linked record does not exist. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The operation could not be completed. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description User authentication or persistence is unavailable. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
  patch_user_household_route_v2_user_households__association_id__patch: {
    parameters: {
      query: {
        /** @description Supported PolicyEngine country ID */
        country_id: 'us' | 'uk';
      };
      header?: never;
      path: {
        association_id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['UserHouseholdPatchRequest'];
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['UserHouseholdDetailResponse'];
        };
      };
      /** @description The supplied references or countries contradict each other. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description A valid bearer access token, or a canonical UUID in the PolicyEngine-Unauthenticated-User header, is required; that UUID may not name a signed-in account. The response carries WWW-Authenticate: Bearer. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description Machine (client-credentials) principals are not permitted, and unauthenticated users cannot edit account details. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The record does not exist or belongs to another user. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The change conflicts with stored state, such as a record maintained by the v1 saved-policy mirror. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request body exceeds 256 KiB. */
      413: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request does not match the schema, or a referenced v1 artifact or linked record does not exist. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The operation could not be completed. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description User authentication or persistence is unavailable. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
  get_user_policies_v2_user_policies_get: {
    parameters: {
      query: {
        /** @description Zero-based result offset */
        offset?: number;
        /** @description Maximum number of returned resources */
        limit?: number;
        /** @description Supported PolicyEngine country ID */
        country_id: 'us' | 'uk';
        policy_id?: string | null;
        legacy_policy_id?: number | null;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['UserPolicyPageResponse'];
        };
      };
      /** @description The supplied references or countries contradict each other. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description A valid bearer access token, or a canonical UUID in the PolicyEngine-Unauthenticated-User header, is required; that UUID may not name a signed-in account. The response carries WWW-Authenticate: Bearer. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description Machine (client-credentials) principals are not permitted, and unauthenticated users cannot edit account details. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The record does not exist or belongs to another user. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The change conflicts with stored state, such as a record maintained by the v1 saved-policy mirror. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request body exceeds 256 KiB. */
      413: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request does not match the schema, or a referenced v1 artifact or linked record does not exist. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The operation could not be completed. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description User authentication or persistence is unavailable. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
  create_user_policy_v2_user_policies_post: {
    parameters: {
      query: {
        /** @description Supported PolicyEngine country ID */
        country_id: 'us' | 'uk';
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['UserPolicyCreateRequest'];
      };
    };
    responses: {
      /** @description Successful Response */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['UserPolicyDetailResponse'];
        };
      };
      /** @description The supplied references or countries contradict each other. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description A valid bearer access token, or a canonical UUID in the PolicyEngine-Unauthenticated-User header, is required; that UUID may not name a signed-in account. The response carries WWW-Authenticate: Bearer. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description Machine (client-credentials) principals are not permitted, and unauthenticated users cannot edit account details. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The record does not exist or belongs to another user. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The change conflicts with stored state, such as a record maintained by the v1 saved-policy mirror. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request body exceeds 256 KiB. */
      413: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request does not match the schema, or a referenced v1 artifact or linked record does not exist. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The operation could not be completed. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description User authentication or persistence is unavailable. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
  get_user_policy_v2_user_policies__association_id__get: {
    parameters: {
      query: {
        /** @description Supported PolicyEngine country ID */
        country_id: 'us' | 'uk';
      };
      header?: never;
      path: {
        association_id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['UserPolicyDetailResponse'];
        };
      };
      /** @description The supplied references or countries contradict each other. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description A valid bearer access token, or a canonical UUID in the PolicyEngine-Unauthenticated-User header, is required; that UUID may not name a signed-in account. The response carries WWW-Authenticate: Bearer. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description Machine (client-credentials) principals are not permitted, and unauthenticated users cannot edit account details. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The record does not exist or belongs to another user. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The change conflicts with stored state, such as a record maintained by the v1 saved-policy mirror. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request body exceeds 256 KiB. */
      413: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request does not match the schema, or a referenced v1 artifact or linked record does not exist. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The operation could not be completed. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description User authentication or persistence is unavailable. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
  delete_user_policy_route_v2_user_policies__association_id__delete: {
    parameters: {
      query: {
        /** @description Supported PolicyEngine country ID */
        country_id: 'us' | 'uk';
      };
      header?: never;
      path: {
        association_id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful Response */
      204: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description The supplied references or countries contradict each other. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description A valid bearer access token, or a canonical UUID in the PolicyEngine-Unauthenticated-User header, is required; that UUID may not name a signed-in account. The response carries WWW-Authenticate: Bearer. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description Machine (client-credentials) principals are not permitted, and unauthenticated users cannot edit account details. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The record does not exist or belongs to another user. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The change conflicts with stored state, such as a record maintained by the v1 saved-policy mirror. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request body exceeds 256 KiB. */
      413: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request does not match the schema, or a referenced v1 artifact or linked record does not exist. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The operation could not be completed. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description User authentication or persistence is unavailable. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
  patch_user_policy_route_v2_user_policies__association_id__patch: {
    parameters: {
      query: {
        /** @description Supported PolicyEngine country ID */
        country_id: 'us' | 'uk';
      };
      header?: never;
      path: {
        association_id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['UserPolicyPatchRequest'];
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['UserPolicyDetailResponse'];
        };
      };
      /** @description The supplied references or countries contradict each other. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description A valid bearer access token, or a canonical UUID in the PolicyEngine-Unauthenticated-User header, is required; that UUID may not name a signed-in account. The response carries WWW-Authenticate: Bearer. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description Machine (client-credentials) principals are not permitted, and unauthenticated users cannot edit account details. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The record does not exist or belongs to another user. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The change conflicts with stored state, such as a record maintained by the v1 saved-policy mirror. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request body exceeds 256 KiB. */
      413: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request does not match the schema, or a referenced v1 artifact or linked record does not exist. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The operation could not be completed. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description User authentication or persistence is unavailable. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
  get_user_reports_v2_user_reports_get: {
    parameters: {
      query: {
        /** @description Zero-based result offset */
        offset?: number;
        /** @description Maximum number of returned resources */
        limit?: number;
        /** @description Supported PolicyEngine country ID */
        country_id: 'us' | 'uk';
        legacy_report_id?: number | null;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['UserReportPageResponse'];
        };
      };
      /** @description The supplied references or countries contradict each other. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description A valid bearer access token, or a canonical UUID in the PolicyEngine-Unauthenticated-User header, is required; that UUID may not name a signed-in account. The response carries WWW-Authenticate: Bearer. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description Machine (client-credentials) principals are not permitted, and unauthenticated users cannot edit account details. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The record does not exist or belongs to another user. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The change conflicts with stored state, such as a record maintained by the v1 saved-policy mirror. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request body exceeds 256 KiB. */
      413: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request does not match the schema, or a referenced v1 artifact, v2 report or simulation, or linked record does not exist. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The operation could not be completed. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description User authentication, persistence or the simulation service is unavailable. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
  create_user_report_v2_user_reports_post: {
    parameters: {
      query: {
        /** @description Supported PolicyEngine country ID */
        country_id: 'us' | 'uk';
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['UserReportCreateRequest'];
      };
    };
    responses: {
      /** @description Successful Response */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['UserReportDetailResponse'];
        };
      };
      /** @description The supplied references or countries contradict each other. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description A valid bearer access token, or a canonical UUID in the PolicyEngine-Unauthenticated-User header, is required; that UUID may not name a signed-in account. The response carries WWW-Authenticate: Bearer. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description Machine (client-credentials) principals are not permitted, and unauthenticated users cannot edit account details. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The record does not exist or belongs to another user. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The change conflicts with stored state, such as a record maintained by the v1 saved-policy mirror. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request body exceeds 256 KiB. */
      413: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request does not match the schema, or a referenced v1 artifact, v2 report or simulation, or linked record does not exist. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The operation could not be completed. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The simulation service has the v2 report but cannot read it back. */
      502: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description User authentication, persistence or the simulation service is unavailable. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
  get_user_report_v2_user_reports__association_id__get: {
    parameters: {
      query: {
        /** @description Supported PolicyEngine country ID */
        country_id: 'us' | 'uk';
      };
      header?: never;
      path: {
        association_id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['UserReportDetailResponse'];
        };
      };
      /** @description The supplied references or countries contradict each other. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description A valid bearer access token, or a canonical UUID in the PolicyEngine-Unauthenticated-User header, is required; that UUID may not name a signed-in account. The response carries WWW-Authenticate: Bearer. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description Machine (client-credentials) principals are not permitted, and unauthenticated users cannot edit account details. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The record does not exist or belongs to another user. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The change conflicts with stored state, such as a record maintained by the v1 saved-policy mirror. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request body exceeds 256 KiB. */
      413: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request does not match the schema, or a referenced v1 artifact, v2 report or simulation, or linked record does not exist. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The operation could not be completed. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description User authentication, persistence or the simulation service is unavailable. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
  delete_user_report_route_v2_user_reports__association_id__delete: {
    parameters: {
      query: {
        /** @description Supported PolicyEngine country ID */
        country_id: 'us' | 'uk';
      };
      header?: never;
      path: {
        association_id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful Response */
      204: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description The supplied references or countries contradict each other. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description A valid bearer access token, or a canonical UUID in the PolicyEngine-Unauthenticated-User header, is required; that UUID may not name a signed-in account. The response carries WWW-Authenticate: Bearer. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description Machine (client-credentials) principals are not permitted, and unauthenticated users cannot edit account details. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The record does not exist or belongs to another user. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The change conflicts with stored state, such as a record maintained by the v1 saved-policy mirror. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request body exceeds 256 KiB. */
      413: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request does not match the schema, or a referenced v1 artifact, v2 report or simulation, or linked record does not exist. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The operation could not be completed. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description User authentication, persistence or the simulation service is unavailable. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
  patch_user_report_route_v2_user_reports__association_id__patch: {
    parameters: {
      query: {
        /** @description Supported PolicyEngine country ID */
        country_id: 'us' | 'uk';
      };
      header?: never;
      path: {
        association_id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['UserReportPatchRequest'];
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['UserReportDetailResponse'];
        };
      };
      /** @description The supplied references or countries contradict each other. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description A valid bearer access token, or a canonical UUID in the PolicyEngine-Unauthenticated-User header, is required; that UUID may not name a signed-in account. The response carries WWW-Authenticate: Bearer. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description Machine (client-credentials) principals are not permitted, and unauthenticated users cannot edit account details. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The record does not exist or belongs to another user. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The change conflicts with stored state, such as a record maintained by the v1 saved-policy mirror. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request body exceeds 256 KiB. */
      413: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request does not match the schema, or a referenced v1 artifact, v2 report or simulation, or linked record does not exist. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The operation could not be completed. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The simulation service has the v2 report but cannot read it back. */
      502: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description User authentication, persistence or the simulation service is unavailable. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
  get_user_simulations_v2_user_simulations_get: {
    parameters: {
      query: {
        /** @description Zero-based result offset */
        offset?: number;
        /** @description Maximum number of returned resources */
        limit?: number;
        /** @description Supported PolicyEngine country ID */
        country_id: 'us' | 'uk';
        legacy_simulation_id?: number | null;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['UserSimulationPageResponse'];
        };
      };
      /** @description The supplied references or countries contradict each other. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description A valid bearer access token, or a canonical UUID in the PolicyEngine-Unauthenticated-User header, is required; that UUID may not name a signed-in account. The response carries WWW-Authenticate: Bearer. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description Machine (client-credentials) principals are not permitted, and unauthenticated users cannot edit account details. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The record does not exist or belongs to another user. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The change conflicts with stored state, such as a record maintained by the v1 saved-policy mirror. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request body exceeds 256 KiB. */
      413: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request does not match the schema, or a referenced v1 artifact, v2 report or simulation, or linked record does not exist. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The operation could not be completed. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description User authentication, persistence or the simulation service is unavailable. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
  create_user_simulation_v2_user_simulations_post: {
    parameters: {
      query: {
        /** @description Supported PolicyEngine country ID */
        country_id: 'us' | 'uk';
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['UserSimulationCreateRequest'];
      };
    };
    responses: {
      /** @description Successful Response */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['UserSimulationDetailResponse'];
        };
      };
      /** @description The supplied references or countries contradict each other. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description A valid bearer access token, or a canonical UUID in the PolicyEngine-Unauthenticated-User header, is required; that UUID may not name a signed-in account. The response carries WWW-Authenticate: Bearer. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description Machine (client-credentials) principals are not permitted, and unauthenticated users cannot edit account details. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The record does not exist or belongs to another user. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The change conflicts with stored state, such as a record maintained by the v1 saved-policy mirror. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request body exceeds 256 KiB. */
      413: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request does not match the schema, or a referenced v1 artifact, v2 report or simulation, or linked record does not exist. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The operation could not be completed. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description User authentication, persistence or the simulation service is unavailable. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
  get_user_simulation_v2_user_simulations__association_id__get: {
    parameters: {
      query: {
        /** @description Supported PolicyEngine country ID */
        country_id: 'us' | 'uk';
      };
      header?: never;
      path: {
        association_id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['UserSimulationDetailResponse'];
        };
      };
      /** @description The supplied references or countries contradict each other. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description A valid bearer access token, or a canonical UUID in the PolicyEngine-Unauthenticated-User header, is required; that UUID may not name a signed-in account. The response carries WWW-Authenticate: Bearer. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description Machine (client-credentials) principals are not permitted, and unauthenticated users cannot edit account details. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The record does not exist or belongs to another user. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The change conflicts with stored state, such as a record maintained by the v1 saved-policy mirror. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request body exceeds 256 KiB. */
      413: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request does not match the schema, or a referenced v1 artifact, v2 report or simulation, or linked record does not exist. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The operation could not be completed. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description User authentication, persistence or the simulation service is unavailable. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
  delete_user_simulation_route_v2_user_simulations__association_id__delete: {
    parameters: {
      query: {
        /** @description Supported PolicyEngine country ID */
        country_id: 'us' | 'uk';
      };
      header?: never;
      path: {
        association_id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful Response */
      204: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description The supplied references or countries contradict each other. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description A valid bearer access token, or a canonical UUID in the PolicyEngine-Unauthenticated-User header, is required; that UUID may not name a signed-in account. The response carries WWW-Authenticate: Bearer. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description Machine (client-credentials) principals are not permitted, and unauthenticated users cannot edit account details. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The record does not exist or belongs to another user. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The change conflicts with stored state, such as a record maintained by the v1 saved-policy mirror. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request body exceeds 256 KiB. */
      413: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request does not match the schema, or a referenced v1 artifact, v2 report or simulation, or linked record does not exist. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The operation could not be completed. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description User authentication, persistence or the simulation service is unavailable. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
  patch_user_simulation_route_v2_user_simulations__association_id__patch: {
    parameters: {
      query: {
        /** @description Supported PolicyEngine country ID */
        country_id: 'us' | 'uk';
      };
      header?: never;
      path: {
        association_id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['UserSimulationPatchRequest'];
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['UserSimulationDetailResponse'];
        };
      };
      /** @description The supplied references or countries contradict each other. */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description A valid bearer access token, or a canonical UUID in the PolicyEngine-Unauthenticated-User header, is required; that UUID may not name a signed-in account. The response carries WWW-Authenticate: Bearer. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description Machine (client-credentials) principals are not permitted, and unauthenticated users cannot edit account details. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The record does not exist or belongs to another user. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The change conflicts with stored state, such as a record maintained by the v1 saved-policy mirror. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request body exceeds 256 KiB. */
      413: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request does not match the schema, or a referenced v1 artifact, v2 report or simulation, or linked record does not exist. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The operation could not be completed. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description User authentication, persistence or the simulation service is unavailable. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
  list_variables_v2_variables_get: {
    parameters: {
      query: {
        /** @description Zero-based result offset */
        offset?: number;
        /** @description Maximum number of returned resources */
        limit?: number;
        /** @description Supported PolicyEngine country ID */
        country_id: 'us' | 'uk';
        policyengine_version?: string | null;
        /** @description Case-insensitive substring of the name, label or description */
        search?: string | null;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          /** @description Strong validator: a hash of the uncompressed response body, so a gzip-encoded response carries the same tag. */
          ETag?: string;
          /** @description public, with max-age 86400 when the request names policyengine_version and 300 otherwise; current parameter values expire at the next UTC midnight. */
          'Cache-Control'?: string;
          /** @description Origin, Accept-Encoding: caches keep responses apart by origin and by compression; a 304 carries the same value. */
          Vary?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['MetadataVariablePageResponse'];
        };
      };
      /** @description Not modified: If-None-Match names the current ETag. No body is sent. */
      304: {
        headers: {
          /** @description Strong validator: a hash of the uncompressed response body, so a gzip-encoded response carries the same tag. */
          ETag?: string;
          /** @description public, with max-age 86400 when the request names policyengine_version and 300 otherwise; current parameter values expire at the next UTC midnight. */
          'Cache-Control'?: string;
          /** @description Origin, Accept-Encoding: caches keep responses apart by origin and by compression; a 304 carries the same value. */
          Vary?: string;
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description The requested catalog resource is absent. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The dormant v2 metadata resources support GET only. */
      405: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The query parameters do not match the resource schema, for example an unknown parameter or a malformed PolicyEngine.py version. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The resource query failed internally. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The initialized v2 catalog is unavailable. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
  get_variable_v2_variables__variable_id__get: {
    parameters: {
      query: {
        /** @description Supported PolicyEngine country ID */
        country_id: 'us' | 'uk';
        policyengine_version?: string | null;
      };
      header?: never;
      path: {
        variable_id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          /** @description Strong validator: a hash of the uncompressed response body, so a gzip-encoded response carries the same tag. */
          ETag?: string;
          /** @description public, with max-age 86400 when the request names policyengine_version and 300 otherwise; current parameter values expire at the next UTC midnight. */
          'Cache-Control'?: string;
          /** @description Origin, Accept-Encoding: caches keep responses apart by origin and by compression; a 304 carries the same value. */
          Vary?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['MetadataVariableDetailResponse'];
        };
      };
      /** @description Not modified: If-None-Match names the current ETag. No body is sent. */
      304: {
        headers: {
          /** @description Strong validator: a hash of the uncompressed response body, so a gzip-encoded response carries the same tag. */
          ETag?: string;
          /** @description public, with max-age 86400 when the request names policyengine_version and 300 otherwise; current parameter values expire at the next UTC midnight. */
          'Cache-Control'?: string;
          /** @description Origin, Accept-Encoding: caches keep responses apart by origin and by compression; a 304 carries the same value. */
          Vary?: string;
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description The requested catalog resource is absent. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The dormant v2 metadata resources support GET only. */
      405: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The query parameters do not match the resource schema, for example an unknown parameter or a malformed PolicyEngine.py version. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The resource query failed internally. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The initialized v2 catalog is unavailable. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
}
