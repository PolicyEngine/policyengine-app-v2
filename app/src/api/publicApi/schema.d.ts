/**
 * Generated from src/api/publicApi/openapi.json by scripts/public-api-client.ts.
 * Do not edit: run `bun run public-api:generate` (or `public-api:refresh`).
 */

export interface paths {
  '/v2/me': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Read the current user
     * @description For a bearer access token, returns the PolicyEngine user, creating it on the first call with primary_country set from country_id. For the PolicyEngine-Unauthenticated-User header, returns the browser's unauthenticated user, or 404 before its first saved record; reading never creates one. latest_type_change is the user's most recent type change until it is dismissed, else null.
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
  '/v2/me/invitations/accept': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Accept an admin's email invitation with its token
     * @description Signed-in users only. A user with no account yet gets one, with primary_country from country_id. The signed-in user's email is read from Auth0 first and never stored; then the token, the inviting admin, the email's verification and its match with the invited address are checked, in that order, and each refusal names its code. On success the user gets the invited type, unless they already have it or a higher one, the invitation is marked accepted, and a type change is recorded and emailed to the user.
     */
    post: operations['accept_invitation_v2_me_invitations_accept_post'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v2/me/type-changes/{type_change_id}/dismiss': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Dismiss the notice of a type change
     * @description Signed-in users only. GET /v2/me then stops reporting the change as latest_type_change. Dismissing it again changes nothing.
     */
    post: operations['dismiss_type_change_v2_me_type_changes__type_change_id__dismiss_post'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v2/admin/users': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * List signed-in users, newest first
     * @description Admins only. With email, lists only users with an email address containing it, ignoring case; every character matches itself. The search covers stored emails and, with Auth0 user profiles configured, Auth0 emails: an Auth0 email matches when it contains the text, or, for fewer than three characters, starts with it. Auth0's search is eventually consistent, so a just-changed email may be missing. Text with < or >, which no email address holds, is refused (422), and so is text that more than 200 Auth0 users match: enter more of it. When Auth0 can't answer the search, the response is 503. Each user's email, first_name and last_name are read from Auth0 for this request and never stored; when Auth0 has none, or can't answer, the stored values are returned. Unauthenticated users are never listed.
     */
    get: operations['list_users_v2_admin_users_get'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v2/admin/users/{user_id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Read one signed-in user
     * @description Admins only. An unauthenticated user's ID is not found (404). Each user's email, first_name and last_name are read from Auth0 for this request and never stored; when Auth0 has none, or can't answer, the stored values are returned.
     */
    get: operations['get_user_v2_admin_users__user_id__get'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    /**
     * Change a signed-in user's type
     * @description Admins only. Records the change in the user's type history. Setting the type the user already has changes and records nothing, whatever expected_user_type is. Otherwise expected_user_type, the user's type as the admin last read it, must still be the stored type: when it differs, the change is refused (409) and nothing is written. Only the type is compared, so a type changed and changed back since the read is not detected. Demoting the last admin is refused (409) too. The change is committed before the response's email and names are read; Each user's email, first_name and last_name are read from Auth0 for this request and never stored; when Auth0 has none, or can't answer, the stored values are returned.
     */
    patch: operations['change_user_type_v2_admin_users__user_id__patch'];
    trace?: never;
  };
  '/v2/admin/users/{user_id}/user-type-changes': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Read a signed-in user's recorded type changes, newest first
     * @description Admins only. changed_by_email is the admin's email, read from Auth0 for this request and never stored; when Auth0 has none, or can't answer, it is the stored one.
     */
    get: operations['list_user_type_changes_v2_admin_users__user_id__user_type_changes_get'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v2/admin/invitations': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * List open invitations, newest first
     * @description Admins only. Lists the invitations that are neither accepted nor revoked, expired ones included (expired is true).
     */
    get: operations['list_invitations_v2_admin_invitations_get'];
    put?: never;
    /**
     * Invite an email address to become an author or admin
     * @description Admins only. Creates the invitation and emails its link to the address; an open invitation to the same address, compared ignoring case, is revoked first, so its link stops working. The email is sent through Postmark after the invitation commits, and retried a few times; when every attempt fails, or Postmark isn't configured, the invitation stays open with last_sent_at null and last_send_error naming why. The link is valid for 7 days. The response is 201 even when the send failed.
     */
    post: operations['create_invitation_v2_admin_invitations_post'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v2/admin/invitations/{invitation_id}/resend': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Email an open invitation again with a new link
     * @description Admins only. Gives the invitation a new link, so the earlier one stops working, and a new 7-day expiry, makes the caller its inviting admin, and emails it again. An expired invitation can be resent. The email is sent through Postmark after the invitation commits, and retried a few times; when every attempt fails, or Postmark isn't configured, the invitation stays open with last_sent_at null and last_send_error naming why. The link is valid for 7 days.
     */
    post: operations['resend_invitation_v2_admin_invitations__invitation_id__resend_post'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v2/admin/invitations/{invitation_id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    /**
     * Revoke an open invitation
     * @description Admins only. The invitation's link stops working.
     */
    delete: operations['revoke_invitation_v2_admin_invitations__invitation_id__delete'];
    options?: never;
    head?: never;
    patch?: never;
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
     * @description Requires a bearer access token or the PolicyEngine-Unauthenticated-User header; the owner is taken from that credential. Names a detailed-save report (report_id), which must be stored in the country (404 otherwise), or a v1 report output (legacy_report_id), checked in the v1 database; naming both is refused with 400, since v1 report numbers are not connected to detailed-save reports. An optional user_policy_id must name the same user's saved policy in the same country.
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
     * @description Requires a bearer access token or the PolicyEngine-Unauthenticated-User header; the owner is taken from that credential. Names a detailed-save simulation (simulation_id), which must be of the country's model (404 otherwise), or a v1 simulation (legacy_simulation_id), checked in the v1 database; naming both is refused with 400.
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
  '/v2/reports': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * List chosen economy reports
     * @description Lists the country's economy reports among the report_id values (at most 25), in the order named and once each, with their newest runs but without results, read in one query. Unknown reports, other countries' and reports of other kinds are left out.
     */
    get: operations['list_reports_v2_reports_get'];
    put?: never;
    /**
     * Create an economy report
     * @description Checks that the country has economy reports and stores each named policy, and that the running catalog version has every parameter those policies set, then has the simulation service create the report, its two simulations and their runs on its default worker's PolicyEngine.py version, and start the run. Answers the report as stored, with its pending run; read it again to follow the run. A created report that cannot be read back answers 502 with its report_id, and one whose run the simulation service failed before answering 503 answers 503 with its report_id.
     */
    post: operations['create_report_v2_reports_post'];
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
     * Read an economy report
     * @description Returns the report, its newest run whatever its status and versions, the versions the Public API runs now, and, once the newest run has succeeded, its result in today's economy result format. A report with no run, such as one migrated from v1, answers its definition with no result; reading starts no run.
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
  '/v2/simulations': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Create an economy simulation
     * @description Checks that the country has economy calculations and stores the named policy, and that the running catalog version has every parameter it sets, then has the simulation service create the simulation and its first run on its default worker's PolicyEngine.py version, and start the run. Answers the simulation as stored, with its pending run. A created simulation that cannot be read back answers 502 with its simulation_id, and one whose run the simulation service failed before answering 503 answers 503 with its simulation_id.
     */
    post: operations['create_simulation_v2_simulations_post'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v2/simulations/{simulation_id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Read a simulation
     * @description Returns the simulation, its newest run whatever its year, status and versions, and the versions the Public API runs now. A simulation belongs to the country whose model its catalog version is of; reading starts no run.
     */
    get: operations['get_simulation_v2_simulations__simulation_id__get'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
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
     * AdminInvitationItem
     * @description An invitation as admins see it.
     *
     *     ``invited_by_user_id`` is the admin who created or last resent it, null
     *     once that account is deleted. ``expired`` says ``expires_at`` has passed:
     *     it can't be accepted, but it can be resent. ``last_sent_at`` is when
     *     Postmark accepted the email with the current link, null when the last
     *     send failed or wasn't tried; ``last_send_error`` then names why, as a
     *     short identifier such as ``not_configured``, ``timeout``, ``http_500``
     *     or ``postmark_406`` (an address Postmark suppresses).
     */
    AdminInvitationItem: {
      /**
       * Id
       * Format: uuid
       */
      id: string;
      /** Email */
      email: string;
      /**
       * User Type
       * @enum {string}
       */
      user_type: 'author' | 'admin';
      /** Invited By User Id */
      invited_by_user_id: string | null;
      /**
       * Created At
       * Format: date-time
       */
      created_at: string;
      /**
       * Expires At
       * Format: date-time
       */
      expires_at: string;
      /** Expired */
      expired: boolean;
      /** Last Sent At */
      last_sent_at: string | null;
      /** Last Send Error */
      last_send_error: string | null;
    };
    /**
     * AdminInvitationPageResponse
     * @description Success response holding one page of open invitations.
     */
    AdminInvitationPageResponse: {
      /**
       * Status
       * @default ok
       * @constant
       */
      status: 'ok';
      /** Message */
      message?: null;
      result: components['schemas']['AdminInvitationPageResult'];
    };
    /**
     * AdminInvitationPageResult
     * @description One page of open invitations, newest first.
     */
    AdminInvitationPageResult: {
      /** Items */
      items: components['schemas']['AdminInvitationItem'][];
      /** Offset */
      offset: number;
      /** Limit */
      limit: number;
      /** Has More */
      has_more: boolean;
    };
    /**
     * AdminInvitationResponse
     * @description Success response holding one invitation.
     */
    AdminInvitationResponse: {
      /**
       * Status
       * @default ok
       * @constant
       */
      status: 'ok';
      /** Message */
      message?: null;
      result: components['schemas']['AdminInvitationResult'];
    };
    /**
     * AdminInvitationResult
     * @description Result holding one invitation in ``item``.
     */
    AdminInvitationResult: {
      item: components['schemas']['AdminInvitationItem'];
    };
    /**
     * AdminUserItem
     * @description A signed-in user as admins see it.
     *
     *     With Auth0 user profile settings, ``email``, ``first_name`` and
     *     ``last_name`` are read from Auth0 for each request and never stored: the
     *     user's sign-in identities from the users' Auth0 tenant are looked up, the
     *     most recently seen first, and a verified email comes before an unverified
     *     one. Where Auth0 has no value, or can't answer, the stored value is
     *     returned: the email of the most recently seen of the user's identities
     *     that has one, else the user's own, and the user's stored names. When
     *     neither has a first or last name, Auth0's full name, if it isn't an
     *     email address, is the first name. ``last_seen_at`` is when the user's
     *     most recently seen identity was last seen.
     */
    AdminUserItem: {
      /**
       * Id
       * Format: uuid
       */
      id: string;
      /**
       * User Type
       * @enum {string}
       */
      user_type: 'standard' | 'author' | 'admin';
      /** Email */
      email: string | null;
      /** First Name */
      first_name: string | null;
      /** Last Name */
      last_name: string | null;
      /** Primary Country */
      primary_country: string | null;
      /**
       * Created At
       * Format: date-time
       */
      created_at: string;
      /** Last Seen At */
      last_seen_at: string | null;
    };
    /**
     * AdminUserPageResponse
     * @description The response for a page of signed-in users.
     */
    AdminUserPageResponse: {
      /**
       * Status
       * @default ok
       * @constant
       */
      status: 'ok';
      /** Message */
      message?: null;
      result: components['schemas']['AdminUserPageResult'];
    };
    /**
     * AdminUserPageResult
     * @description One page of signed-in users, newest first.
     */
    AdminUserPageResult: {
      /** Items */
      items: components['schemas']['AdminUserItem'][];
      /** Offset */
      offset: number;
      /** Limit */
      limit: number;
      /** Has More */
      has_more: boolean;
    };
    /**
     * AdminUserResponse
     * @description The response for one signed-in user.
     */
    AdminUserResponse: {
      /**
       * Status
       * @default ok
       * @constant
       */
      status: 'ok';
      /** Message */
      message?: null;
      result: components['schemas']['AdminUserResult'];
    };
    /**
     * AdminUserResult
     * @description One signed-in user.
     */
    AdminUserResult: {
      item: components['schemas']['AdminUserItem'];
    };
    /**
     * AgePoverty
     * @description Poverty rates for children, adults, seniors and everyone.
     */
    AgePoverty: {
      child: components['schemas']['BaselineReformValue'];
      adult: components['schemas']['BaselineReformValue'];
      senior: components['schemas']['BaselineReformValue'];
      all: components['schemas']['BaselineReformValue'];
    };
    /**
     * BaselineReformValue
     * @description A measure's value under the baseline and under the reform.
     */
    BaselineReformValue: {
      /** Baseline */
      baseline: number;
      /** Reform */
      reform: number;
    };
    /**
     * BudgetaryImpact
     * @description The reform's headline budget effect in the simulated year.
     *
     *     Impacts are reform minus baseline totals in the country's currency;
     *     ``budgetary_impact`` is ``tax_revenue_impact`` minus
     *     ``benefit_spending_impact``, and ``state_tax_revenue_impact`` is US state
     *     income tax (0 for the UK). ``households`` is the weighted number of
     *     households and ``baseline_net_income`` their total baseline net income.
     */
    BudgetaryImpact: {
      /** Tax Revenue Impact */
      tax_revenue_impact: number;
      /** State Tax Revenue Impact */
      state_tax_revenue_impact: number;
      /** Benefit Spending Impact */
      benefit_spending_impact: number;
      /** Budgetary Impact */
      budgetary_impact: number;
      /** Households */
      households: number;
      /** Baseline Net Income */
      baseline_net_income: number;
    };
    /**
     * CliffImpact
     * @description Exposure to tax-benefit cliffs under the baseline and under the reform.
     */
    CliffImpact: {
      baseline: components['schemas']['CliffImpactInSimulation'];
      reform: components['schemas']['CliffImpactInSimulation'];
    };
    /**
     * CliffImpactInSimulation
     * @description Net income lost to a small earnings rise, and the share of adults on a cliff.
     */
    CliffImpactInSimulation: {
      /** Cliff Gap */
      cliff_gap: number;
      /** Cliff Share */
      cliff_share: number;
    };
    /**
     * CongressionalDistrictImpact
     * @description The reform's impact in one US congressional district.
     *
     *     ``district`` is the state and two-digit number, such as ``"CA-12"``; an
     *     at-large district is ``01``. The percentages are the shares of people
     *     whose household net income rises, falls or stays the same.
     */
    CongressionalDistrictImpact: {
      /** District */
      district: string;
      /** Average Household Income Change */
      average_household_income_change: number;
      /** Relative Household Income Change */
      relative_household_income_change: number;
      /** Winner Percentage */
      winner_percentage: number;
      /** Loser Percentage */
      loser_percentage: number;
      /** No Change Percentage */
      no_change_percentage: number;
      /** Population */
      population: number;
    };
    /**
     * CongressionalDistrictImpacts
     * @description The reform's impact in each congressional district of a US state report.
     */
    CongressionalDistrictImpacts: {
      /** Districts */
      districts: components['schemas']['CongressionalDistrictImpact'][];
    };
    /**
     * ConstituencyImpact
     * @description The reform's impact in one UK parliamentary constituency.
     */
    ConstituencyImpact: {
      /** Average Household Income Change */
      average_household_income_change: number;
      /** Relative Household Income Change */
      relative_household_income_change: number;
      /** Population */
      population: number;
      /** Disclosure Tier */
      disclosure_tier: ('reported' | 'approximate') | null;
      /** Average Household Income Change Lower */
      average_household_income_change_lower: number | null;
      /** Average Household Income Change Upper */
      average_household_income_change_upper: number | null;
      /** Relative Household Income Change Lower */
      relative_household_income_change_lower: number | null;
      /** Relative Household Income Change Upper */
      relative_household_income_change_upper: number | null;
      /** Constituency Code */
      constituency_code: string;
      /** Constituency Name */
      constituency_name: string;
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
     * CreatedReportUnreadableResponse
     * @description The 502 answer when the created report cannot be read back.
     *
     *     The simulation service created ``report_id``, so the caller reads it
     *     with ``GET /v2/reports/{report_id}`` rather than submitting it again.
     */
    CreatedReportUnreadableResponse: {
      /**
       * Status
       * @default error
       * @constant
       */
      status: 'error';
      /** Message */
      message: string;
      /**
       * Report Id
       * Format: uuid
       */
      report_id: string;
    };
    /**
     * CreatedSimulationUnreadableResponse
     * @description The 502 answer when the created simulation cannot be read back.
     *
     *     The simulation service created ``simulation_id``, so the caller reads it
     *     with ``GET /v2/simulations/{simulation_id}`` rather than submitting it
     *     again.
     */
    CreatedSimulationUnreadableResponse: {
      /**
       * Status
       * @default error
       * @constant
       */
      status: 'error';
      /** Message */
      message: string;
      /**
       * Simulation Id
       * Format: uuid
       */
      simulation_id: string;
    };
    /**
     * DecileChange
     * @description The change in average household net income in each decile, ``"1"`` to ``"10"``.
     *
     *     ``average`` is the absolute change and ``relative`` the change as a
     *     fraction of the decile's baseline average.
     */
    DecileChange: {
      /** Average */
      average: {
        [key: string]: number;
      };
      /** Relative */
      relative: {
        [key: string]: number;
      };
    };
    /**
     * DeploymentResponse
     * @description The policyengine.py version this revision serves, and since when.
     *
     *     ``policyengine_version_live_since`` is when this .py version first went
     *     live: redeploys that keep the version keep the date. It is null on a
     *     revision deployed before the deploy recorded it, outside Cloud Run, or
     *     when the version the deploy dated is not the installed one.
     */
    DeploymentResponse: {
      /** Policyengine Version */
      policyengine_version: string;
      /** Policyengine Version Live Since */
      policyengine_version_live_since: string | null;
      /** Revision */
      revision: string | null;
    };
    /**
     * EconomyResult
     * @description A report run's single-year economy result, in the format the app reads.
     *
     *     ``model_version`` is the country package version the run used, and
     *     ``data_version`` the data release. ``spm_provenance`` is the baseline's
     *     and reform's SPM calculation receipts the simulation service stored, as
     *     the Public API's ``SPMComparisonProvenance`` (serialized, as the Public
     *     API serializes it elsewhere, with package names as its runtime version
     *     keys), or null. ``wealth_decile`` and ``intra_wealth_decile`` are UK-only;
     *     ``poverty_by_race`` and ``congressional_district_impact`` US-only; the
     *     constituency and local-authority impacts are UK-only and null when the
     *     run did not compute them. ``labor_supply_response`` and ``cliff_impact``
     *     are null when the run did not compute them.
     */
    EconomyResult: {
      spm_provenance: components['schemas']['SPMComparisonProvenance'] | null;
      /** Model Version */
      model_version: string;
      /** Data Version */
      data_version: string;
      budget: components['schemas']['BudgetaryImpact'];
      /** Detailed Budget */
      detailed_budget: {
        [key: string]: components['schemas']['ProgramBudget'];
      };
      decile: components['schemas']['DecileChange'];
      inequality: components['schemas']['InequalityChange'];
      poverty: components['schemas']['PovertyByAge'];
      poverty_by_gender: components['schemas']['PovertyByGender'];
      poverty_by_race: components['schemas']['PovertyByRace'] | null;
      intra_decile: components['schemas']['IntraDecileShares'];
      wealth_decile: components['schemas']['DecileChange'] | null;
      intra_wealth_decile: components['schemas']['IntraDecileShares'] | null;
      labor_supply_response: components['schemas']['LaborSupplyResponse'] | null;
      /** Constituency Impact */
      constituency_impact: components['schemas']['ConstituencyImpact'][] | null;
      /** Local Authority Impact */
      local_authority_impact: components['schemas']['LocalAuthorityImpact'][] | null;
      congressional_district_impact: components['schemas']['CongressionalDistrictImpacts'] | null;
      cliff_impact: components['schemas']['CliffImpact'] | null;
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
     * GenderPoverty
     * @description Poverty rates for males and females.
     */
    GenderPoverty: {
      male: components['schemas']['BaselineReformValue'];
      female: components['schemas']['BaselineReformValue'];
    };
    /**
     * HealthNotReadyResponse
     * @description Health-check result while warmup runs or the configuration is invalid.
     */
    HealthNotReadyResponse: {
      /**
       * Status
       * @constant
       */
      status: 'not_ready';
    };
    /**
     * HealthResponse
     * @description Health-check result showing that the API has warmed up and can serve requests.
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
     * HouseholdCalculationErrorItem
     * @description Why a calculation failed.
     *
     *     ``code`` is the household function's error code: ``invalid_inputs``,
     *     with ``input_errors`` naming each input the country model does not
     *     recognize; ``invalid_household``; ``invalid_spm_selection``, with
     *     ``spm_error``; ``bundle_mismatch``; or ``calculation_failed``. It is null
     *     when the calculation failed for another reason, such as a household
     *     function that raised or was cancelled; ``message`` is then the job's
     *     one-line error, such as ``household_function_error: …`` or
     *     ``household_function_cancelled: …``, and submitting again may succeed.
     */
    HouseholdCalculationErrorItem: {
      /** Code */
      code: string | null;
      /** Message */
      message: string;
      /** Input Errors */
      input_errors: {
        [key: string]: components['schemas']['JsonValue'];
      }[];
      /** Spm Error */
      spm_error: {
        [key: string]: components['schemas']['JsonValue'];
      } | null;
    };
    /**
     * HouseholdCalculationItem
     * @description A household calculation and its outcome.
     *
     *     ``status`` moves from ``pending`` through ``running`` to ``succeeded``,
     *     with ``result``, or ``failed``, with ``error``. ``catalog_version_id``,
     *     ``country_package_version`` and ``policyengine_version`` are those the
     *     calculation runs with.
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
      /** Country Package Version */
      country_package_version: string;
      /** Policyengine Version */
      policyengine_version: string;
      /**
       * Status
       * @enum {string}
       */
      status: 'pending' | 'running' | 'succeeded' | 'failed';
      /**
       * Created At
       * Format: date-time
       */
      created_at: string;
      /** Started At */
      started_at: string | null;
      /** Completed At */
      completed_at: string | null;
      result: components['schemas']['HouseholdCalculationOutputItem'] | null;
      error: components['schemas']['HouseholdCalculationErrorItem'] | null;
    };
    /**
     * HouseholdCalculationOutputItem
     * @description A succeeded calculation's household.
     *
     *     ``household`` is the stored household in the situation shape (people and
     *     groups keyed by their record IDs) with each calculated value filled in by
     *     period. ``warnings`` lists inputs the country model ignored. In the US,
     *     ``spm_config`` is the SPM selection the calculation applied and
     *     ``spm_provenance`` its receipt; both are null elsewhere.
     */
    HouseholdCalculationOutputItem: {
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
     * HouseholdCalculationRequest
     * @description A stored household to calculate under a stored policy, or current law.
     *
     *     ``household_id`` and ``policy_id`` name records of ``country_id`` stored
     *     through ``/v2/households`` and ``/v2/policies``; without ``policy_id`` the
     *     household is calculated under current law, for the household's
     *     ``default_year``. Each group in ``axes`` varies its inputs together across
     *     ``count`` points; several groups form a grid of at most 10,000 points.
     *     ``add_missing_variables`` adds every variable the household lacks before
     *     calculating. ``spm`` selects the SPM forecast scenario and geography for
     *     a US household. Each submission starts a new calculation.
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
      /** Spm */
      spm?: components['schemas']['SPMSelection'];
    };
    /**
     * HouseholdCalculationResponse
     * @description Success response holding one calculation.
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
      result: components['schemas']['HouseholdCalculationResult'];
    };
    /**
     * HouseholdCalculationResult
     * @description Result holding one calculation in ``item``.
     */
    HouseholdCalculationResult: {
      item: components['schemas']['HouseholdCalculationItem'];
    };
    /**
     * HouseholdCalculationSubmittedItem
     * @description A calculation the simulation service accepted.
     *
     *     Poll ``GET /v2/household-calculations/{calculation_id}`` until ``status``
     *     is ``succeeded`` or ``failed``. ``year`` is the household's default year,
     *     which is calculated.
     */
    HouseholdCalculationSubmittedItem: {
      /**
       * Calculation Id
       * Format: uuid
       */
      calculation_id: string;
      /**
       * Status
       * @enum {string}
       */
      status: 'pending' | 'running' | 'succeeded' | 'failed';
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
    };
    /**
     * HouseholdCalculationSubmittedResponse
     * @description Success response holding the accepted calculation.
     */
    HouseholdCalculationSubmittedResponse: {
      /**
       * Status
       * @default ok
       * @constant
       */
      status: 'ok';
      /** Message */
      message?: null;
      result: components['schemas']['HouseholdCalculationSubmittedResult'];
    };
    /**
     * HouseholdCalculationSubmittedResult
     * @description Result holding the accepted calculation in ``item``.
     */
    HouseholdCalculationSubmittedResult: {
      item: components['schemas']['HouseholdCalculationSubmittedItem'];
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
     * InequalityChange
     * @description The Gini coefficient and the top 10% and top 1% income shares.
     */
    InequalityChange: {
      gini: components['schemas']['BaselineReformValue'];
      top_10_pct_share: components['schemas']['BaselineReformValue'];
      top_1_pct_share: components['schemas']['BaselineReformValue'];
    };
    /**
     * IntraDecileShares
     * @description Shares of people in each decile who gain or lose, by size of the change.
     *
     *     ``deciles`` lists each category's share for deciles 1 to 10 in order, and
     *     ``all`` is each category's mean over those deciles.
     */
    IntraDecileShares: {
      /** Deciles */
      deciles: {
        [key: string]: number[];
      };
      /** All */
      all: {
        [key: string]: number;
      };
    };
    /**
     * InvitationAcceptRequest
     * @description The token from an invitation's link, from its ``#token=`` fragment.
     */
    InvitationAcceptRequest: {
      /** Token */
      token: string;
    };
    /**
     * InvitationAcceptanceItem
     * @description The user's type after accepting an invitation, and before.
     *
     *     ``type_changed`` is false when the user already had the invited type or a
     *     higher one: an invitation never lowers a type.
     */
    InvitationAcceptanceItem: {
      /**
       * User Type
       * @enum {string}
       */
      user_type: 'standard' | 'author' | 'admin';
      /**
       * Previous User Type
       * @enum {string}
       */
      previous_user_type: 'standard' | 'author' | 'admin';
      /** Type Changed */
      type_changed: boolean;
    };
    /**
     * InvitationAcceptanceResponse
     * @description Success response holding an accepted invitation's outcome.
     */
    InvitationAcceptanceResponse: {
      /**
       * Status
       * @default ok
       * @constant
       */
      status: 'ok';
      /** Message */
      message?: null;
      result: components['schemas']['InvitationAcceptanceResult'];
    };
    /**
     * InvitationAcceptanceResult
     * @description Result holding the accepted invitation's outcome in ``item``.
     */
    InvitationAcceptanceResult: {
      item: components['schemas']['InvitationAcceptanceItem'];
    };
    /**
     * InvitationCreateRequest
     * @description The address an admin invites, and the type the invitation grants.
     *
     *     ``email`` is stripped of surrounding whitespace and must be one address:
     *     an @ with text on both sides and no whitespace, < or >.
     */
    InvitationCreateRequest: {
      /** Email */
      email: string;
      /**
       * User Type
       * @enum {string}
       */
      user_type: 'author' | 'admin';
    };
    JsonValue: unknown;
    /**
     * LaborSupplyDecileValues
     * @description Income- and substitution-effect responses by income decile number.
     */
    LaborSupplyDecileValues: {
      /** Income */
      income: {
        [key: string]: number;
      };
      /** Substitution */
      substitution: {
        [key: string]: number;
      };
    };
    /**
     * LaborSupplyDeciles
     * @description Labour supply responses by decile: per household, and relative to earnings.
     */
    LaborSupplyDeciles: {
      average: components['schemas']['LaborSupplyDecileValues'];
      relative: components['schemas']['LaborSupplyDecileValues'];
    };
    /**
     * LaborSupplyHours
     * @description Total weekly hours under the baseline and reform, and the change's effects.
     */
    LaborSupplyHours: {
      /** Baseline */
      baseline: number;
      /** Reform */
      reform: number;
      /** Change */
      change: number;
      /** Income Effect */
      income_effect: number;
      /** Substitution Effect */
      substitution_effect: number;
    };
    /**
     * LaborSupplyRelativeResponse
     * @description Income- and substitution-effect responses relative to baseline earnings.
     */
    LaborSupplyRelativeResponse: {
      /** Income */
      income: number;
      /** Substitution */
      substitution: number;
    };
    /**
     * LaborSupplyResponse
     * @description The behavioural labour supply response to the reform.
     *
     *     ``income_lsr`` and ``substitution_lsr`` are the earnings changes from the
     *     two effects, and ``total_change`` their sum.
     */
    LaborSupplyResponse: {
      /** Substitution Lsr */
      substitution_lsr: number;
      /** Income Lsr */
      income_lsr: number;
      relative_lsr: components['schemas']['LaborSupplyRelativeResponse'];
      /** Total Change */
      total_change: number;
      /** Revenue Change */
      revenue_change: number;
      decile: components['schemas']['LaborSupplyDeciles'];
      hours: components['schemas']['LaborSupplyHours'];
    };
    /**
     * LatestTypeChangeItem
     * @description The user's most recent type change, from ``previous_user_type``.
     */
    LatestTypeChangeItem: {
      /**
       * Id
       * Format: uuid
       */
      id: string;
      /**
       * Previous User Type
       * @enum {string}
       */
      previous_user_type: 'standard' | 'author' | 'admin';
      /**
       * User Type
       * @enum {string}
       */
      user_type: 'standard' | 'author' | 'admin';
      /**
       * Changed At
       * Format: date-time
       */
      changed_at: string;
    };
    /**
     * LocalAuthorityImpact
     * @description The reform's impact in one UK local authority.
     */
    LocalAuthorityImpact: {
      /** Average Household Income Change */
      average_household_income_change: number;
      /** Relative Household Income Change */
      relative_household_income_change: number;
      /** Population */
      population: number;
      /** Disclosure Tier */
      disclosure_tier: ('reported' | 'approximate') | null;
      /** Average Household Income Change Lower */
      average_household_income_change_lower: number | null;
      /** Average Household Income Change Upper */
      average_household_income_change_upper: number | null;
      /** Relative Household Income Change Lower */
      relative_household_income_change_lower: number | null;
      /** Relative Household Income Change Upper */
      relative_household_income_change_upper: number | null;
      /** Local Authority Code */
      local_authority_code: string;
      /** Local Authority Name */
      local_authority_name: string;
    };
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
     *     ``user_type`` says which: ``unauthenticated``, or the signed-in user's
     *     stored type, ``standard``, ``author`` or ``admin``, where each type has
     *     every permission of the types before it. An unauthenticated user has no
     *     primary country, and only a signed-in user can set its names or primary
     *     country.
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
      user_type: 'unauthenticated' | 'standard' | 'author' | 'admin';
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
     * MeReadResponse
     * @description Success response holding the current user and their latest type change.
     */
    MeReadResponse: {
      /**
       * Status
       * @default ok
       * @constant
       */
      status: 'ok';
      /** Message */
      message?: null;
      result: components['schemas']['MeReadResult'];
    };
    /**
     * MeReadResult
     * @description The current user, and their most recent type change until it is dismissed.
     *
     *     ``latest_type_change`` is null when the user's type never changed, when
     *     its most recent change was dismissed, and for an unauthenticated user.
     */
    MeReadResult: {
      item: components['schemas']['MeItem'];
      latest_type_change: components['schemas']['LatestTypeChangeItem'] | null;
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
     *     them (any country but the US, or a bundle without certified SPM
     *     support) is not available, and both are null. ``available`` is null
     *     while catalog publication has not recorded the version's availability,
     *     because the simulation service didn't serve its PolicyEngine.py version
     *     or its versions couldn't be read: whether it offers SPM settings is not
     *     known yet.
     */
    MetadataSPMAvailability: {
      /** Available */
      available: boolean | null;
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
     * PackageVersionsItem
     * @description A country package version and the PolicyEngine.py version beside it.
     */
    PackageVersionsItem: {
      /** Country Package Version */
      country_package_version: string;
      /** Policyengine Version */
      policyengine_version: string;
    };
    /**
     * PolicyChoice
     * @description A simulation's stored policy and dynamic; neither means current law.
     */
    PolicyChoice: {
      /** Policy Id */
      policy_id?: string | null;
      /** Dynamic Id */
      dynamic_id?: string | null;
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
      /**
       * Missing Parameters
       * @description The parameter paths this policy sets that the current tax-benefit model (the catalog of the running PolicyEngine.py version) no longer has, sorted; empty when it has them all. Null when that catalog is not published, so nothing could be checked. A policy with missing parameters cannot be run on the current model.
       */
      missing_parameters: string[] | null;
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
     * PovertyByAge
     * @description Poverty and deep poverty rates by age group.
     *
     *     In the US these are the SPM poverty and deep SPM poverty rates; in the UK,
     *     relative and absolute poverty before housing costs.
     */
    PovertyByAge: {
      poverty: components['schemas']['AgePoverty'];
      deep_poverty: components['schemas']['AgePoverty'];
    };
    /**
     * PovertyByGender
     * @description Poverty and deep poverty rates by gender.
     */
    PovertyByGender: {
      poverty: components['schemas']['GenderPoverty'];
      deep_poverty: components['schemas']['GenderPoverty'];
    };
    /**
     * PovertyByRace
     * @description US poverty rates by race; there is no deep poverty breakdown.
     */
    PovertyByRace: {
      poverty: components['schemas']['RacePoverty'];
    };
    /**
     * ProgramBudget
     * @description One program's baseline and reform totals, and reform minus baseline.
     *
     *     ``is_tax`` says whether the program is a tax or a benefit, and is null for
     *     results stored before the flag was recorded.
     */
    ProgramBudget: {
      /** Baseline */
      baseline: number;
      /** Reform */
      reform: number;
      /** Difference */
      difference: number;
      /** Is Tax */
      is_tax: boolean | null;
    };
    /**
     * RacePoverty
     * @description US poverty rates by race and ethnicity.
     */
    RacePoverty: {
      white: components['schemas']['BaselineReformValue'];
      black: components['schemas']['BaselineReformValue'];
      hispanic: components['schemas']['BaselineReformValue'];
      other: components['schemas']['BaselineReformValue'];
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
     * ReportCreateRequest
     * @description An economy report to create; ``country_id`` must match the query's.
     *
     *     Each simulation's empty object is current law. No field names a
     *     PolicyEngine.py version: the simulation service runs its default
     *     worker's.
     */
    ReportCreateRequest: {
      /**
       * Kind
       * @constant
       */
      kind: 'economy';
      /** Label */
      label: string;
      /** Description */
      description?: string | null;
      /**
       * Year
       * @description The year
       */
      year: number;
      /** Region Code */
      region_code: string;
      /** Dataset Name */
      dataset_name?: string | null;
      baseline: components['schemas']['PolicyChoice'];
      reform: components['schemas']['PolicyChoice'];
      /**
       * Include Cliffs
       * @default false
       */
      include_cliffs: boolean;
      /** Spm */
      spm?: components['schemas']['SPMSelection'];
      /**
       * Country Id
       * @description Supported PolicyEngine country ID
       * @enum {string}
       */
      country_id: 'us' | 'uk';
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
     * @description Result holding one report in ``item``.
     */
    ReportDetailResult: {
      item: components['schemas']['ReportItem'];
    };
    /**
     * ReportItem
     * @description An economy report with its newest run's result.
     *
     *     ``result`` is the single-year economy result, in the format the app reads
     *     today, once the newest run has succeeded, and null otherwise.
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
       * Kind
       * @constant
       */
      kind: 'economy';
      /** Label */
      label: string;
      /** Description */
      description: string | null;
      /** Year */
      year: number | null;
      /** Region Code */
      region_code: string | null;
      /** Dataset Name */
      dataset_name: string | null;
      baseline_simulation: components['schemas']['ReportSimulationItem'] | null;
      reform_simulation: components['schemas']['ReportSimulationItem'] | null;
      /** Options */
      options: {
        [key: string]: components['schemas']['JsonValue'];
      };
      /**
       * Created At
       * Format: date-time
       */
      created_at: string;
      /**
       * Status
       * @enum {string}
       */
      status: 'not_run' | 'pending' | 'running' | 'succeeded' | 'failed';
      run: components['schemas']['ReportRunItem'] | null;
      current_versions: components['schemas']['PackageVersionsItem'];
      result: components['schemas']['EconomyResult'] | null;
    };
    /**
     * ReportListResponse
     * @description Success response holding the listed reports.
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
     * @description The listed reports in ``items``, in the order named, without results.
     */
    ReportListResult: {
      /** Items */
      items: components['schemas']['ReportSummaryItem'][];
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
     * ReportRunItem
     * @description One calculation of a report, on one country package and .py version.
     *
     *     ``status`` is ``pending``, ``running``, ``succeeded`` or ``failed``, and
     *     ``error_message`` says why a failed run failed. ``trigger`` is
     *     ``initial`` for the run the report's creation started.
     */
    ReportRunItem: {
      /**
       * Id
       * Format: uuid
       */
      id: string;
      /**
       * Status
       * @enum {string}
       */
      status: 'pending' | 'running' | 'succeeded' | 'failed';
      /**
       * Trigger
       * @enum {string}
       */
      trigger: 'initial' | 'manual' | 'system';
      /** Country Package Version */
      country_package_version: string;
      /** Policyengine Version */
      policyengine_version: string;
      /**
       * Baseline Simulation Run Id
       * Format: uuid
       */
      baseline_simulation_run_id: string;
      /** Reform Simulation Run Id */
      reform_simulation_run_id: string | null;
      /** Error Message */
      error_message: string | null;
      /**
       * Created At
       * Format: date-time
       */
      created_at: string;
      /** Started At */
      started_at: string | null;
      /** Completed At */
      completed_at: string | null;
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
     * ReportSimulationItem
     * @description A simulation a report compares; a null policy or dynamic is current law.
     */
    ReportSimulationItem: {
      /**
       * Id
       * Format: uuid
       */
      id: string;
      /** Policy Id */
      policy_id: string | null;
      /** Dynamic Id */
      dynamic_id: string | null;
    };
    /**
     * ReportSummaryItem
     * @description An economy report comparing a baseline and a reform simulation.
     *
     *     ``status`` is the newest run's, or ``not_run`` for a report with no run.
     *     ``run`` is the newest run, whatever its status and versions;
     *     ``current_versions`` are the versions the Public API runs now, so a
     *     newest run on other versions is out of date. ``options`` are the options
     *     the report was created with.
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
       * Kind
       * @constant
       */
      kind: 'economy';
      /** Label */
      label: string;
      /** Description */
      description: string | null;
      /** Year */
      year: number | null;
      /** Region Code */
      region_code: string | null;
      /** Dataset Name */
      dataset_name: string | null;
      baseline_simulation: components['schemas']['ReportSimulationItem'] | null;
      reform_simulation: components['schemas']['ReportSimulationItem'] | null;
      /** Options */
      options: {
        [key: string]: components['schemas']['JsonValue'];
      };
      /**
       * Created At
       * Format: date-time
       */
      created_at: string;
      /**
       * Status
       * @enum {string}
       */
      status: 'not_run' | 'pending' | 'running' | 'succeeded' | 'failed';
      run: components['schemas']['ReportRunItem'] | null;
      current_versions: components['schemas']['PackageVersionsItem'];
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
     * SPMComparisonProvenance
     * @description Compact baseline and reform receipts for a society-wide result.
     */
    SPMComparisonProvenance: {
      /**
       * Schema Version
       * @constant
       */
      schema_version: 'canonical-spm-comparison-v2';
      baseline: components['schemas']['SPMExecutionProvenance'];
      reform: components['schemas']['SPMExecutionProvenance'];
    };
    /**
     * SPMExecutionProvenance
     * @description One shared compact receipt and the executions that produced it.
     */
    SPMExecutionProvenance: {
      receipt: components['schemas']['SPMProvenance'];
      /** Execution Count */
      execution_count: number;
    };
    /**
     * SPMProvenance
     * @description Compact public receipt for one canonical SPM execution.
     */
    SPMProvenance: {
      /**
       * Schema Version
       * @constant
       */
      schema_version: 'canonical-spm-provenance-v2';
      /** Forecast Id */
      forecast_id: string;
      /** Forecast Sha256 */
      forecast_sha256: string;
      /** Scenario */
      scenario: string;
      /**
       * Geography Kind
       * @enum {string}
       */
      geography_kind: 'county' | 'national' | 'metro';
      /** Geography Id */
      geography_id: string | null;
      /** County Vintage */
      county_vintage: string;
      /** As Of */
      as_of: string | null;
      /** Years */
      years: string[];
      runtime_versions: components['schemas']['SPMRuntimeVersions'];
    };
    /**
     * SPMRuntimeVersions
     * @description Package versions required to reproduce one certified SPM execution.
     */
    SPMRuntimeVersions: {
      /** Policyengine */
      policyengine: string;
      /** Policyengine-Core */
      'policyengine-core': string;
      /** Policyengine-Us */
      'policyengine-us': string;
      /** Spm-Calculator */
      'spm-calculator': string;
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
     *     ``report_id`` is the detailed-save report it shows, and
     *     ``legacy_report_id`` the v1 report output; one of them is set.
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
     * SimulationCreateRequest
     * @description An economy simulation to create; ``country_id`` must match the query's.
     *
     *     No field names a PolicyEngine.py version: the simulation service runs its
     *     default worker's.
     */
    SimulationCreateRequest: {
      /** Policy Id */
      policy_id?: string | null;
      /** Dynamic Id */
      dynamic_id?: string | null;
      /**
       * Kind
       * @constant
       */
      kind: 'economy';
      /**
       * Year
       * @description The year
       */
      year: number;
      /** Region Code */
      region_code: string;
      /** Dataset Name */
      dataset_name?: string | null;
      /**
       * Country Id
       * @description Supported PolicyEngine country ID
       * @enum {string}
       */
      country_id: 'us' | 'uk';
    };
    /**
     * SimulationDetailResponse
     * @description Success response holding one simulation.
     */
    SimulationDetailResponse: {
      /**
       * Status
       * @default ok
       * @constant
       */
      status: 'ok';
      /** Message */
      message?: null;
      result: components['schemas']['SimulationDetailResult'];
    };
    /**
     * SimulationDetailResult
     * @description Result holding one simulation in ``item``.
     */
    SimulationDetailResult: {
      item: components['schemas']['SimulationItem'];
    };
    /**
     * SimulationItem
     * @description A simulation, its newest run and the versions the Public API runs now.
     *
     *     A null ``policy_id`` or ``dynamic_id`` is current law. An economy
     *     simulation names its region and dataset, a household simulation its
     *     household. ``status`` is the newest run's, or ``not_run``; a newest run
     *     on other versions than ``current_versions`` is out of date.
     */
    SimulationItem: {
      /**
       * Id
       * Format: uuid
       */
      id: string;
      /** Country Id */
      country_id: string;
      /**
       * Kind
       * @enum {string}
       */
      kind: 'economy' | 'household';
      /** Policy Id */
      policy_id: string | null;
      /** Dynamic Id */
      dynamic_id: string | null;
      /** Household Id */
      household_id: string | null;
      /** Year */
      year: number | null;
      /** Region Code */
      region_code: string | null;
      /** Dataset Name */
      dataset_name: string | null;
      /**
       * Created At
       * Format: date-time
       */
      created_at: string;
      /**
       * Status
       * @enum {string}
       */
      status: 'not_run' | 'pending' | 'running' | 'succeeded' | 'failed';
      run: components['schemas']['SimulationRunItem'] | null;
      current_versions: components['schemas']['PackageVersionsItem'];
    };
    /**
     * SimulationRunItem
     * @description One calculation of a simulation, for one year on one package version pair.
     */
    SimulationRunItem: {
      /**
       * Id
       * Format: uuid
       */
      id: string;
      /** Year */
      year: number;
      /**
       * Status
       * @enum {string}
       */
      status: 'pending' | 'running' | 'succeeded' | 'failed';
      /** Country Package Version */
      country_package_version: string;
      /** Policyengine Version */
      policyengine_version: string;
      /** Error Message */
      error_message: string | null;
      /**
       * Created At
       * Format: date-time
       */
      created_at: string;
      /** Started At */
      started_at: string | null;
      /** Completed At */
      completed_at: string | null;
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
     * UnavailableAfterReportCreatedResponse
     * @description The 503 answer when the simulation service failed a new report's run.
     *
     *     The message gives the service's status and code. ``report_id`` names the
     *     report, which ``GET /v2/reports/{report_id}`` reads with its failed run.
     */
    UnavailableAfterReportCreatedResponse: {
      /**
       * Status
       * @default error
       * @constant
       */
      status: 'error';
      /** Message */
      message: string;
      /**
       * Report Id
       * Format: uuid
       */
      report_id: string;
    };
    /**
     * UnavailableAfterSimulationCreatedResponse
     * @description The 503 answer when the simulation service failed a new simulation's run.
     *
     *     The message gives the service's status and code. ``simulation_id`` names
     *     the simulation, which ``GET /v2/simulations/{simulation_id}`` reads with
     *     its failed run.
     */
    UnavailableAfterSimulationCreatedResponse: {
      /**
       * Status
       * @default error
       * @constant
       */
      status: 'error';
      /** Message */
      message: string;
      /**
       * Simulation Id
       * Format: uuid
       */
      simulation_id: string;
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
     *     ``report_id`` is the detailed-save report it shows, and
     *     ``legacy_report_id`` the v1 report output; one of them is set, and only
     *     saved reports the production migration wrote hold both. ``user_policy_id`` is
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
     *     ``simulation_id`` is the detailed-save simulation it saves, and
     *     ``legacy_simulation_id`` the v1 simulation; one of them is set, and only
     *     saved simulations the production migration wrote hold both. Associations
     *     can be renamed or deleted, and pointed at another simulation of the same
     *     country through the reference they hold: another detailed-save simulation
     *     through ``simulation_id``, another v1 simulation through
     *     ``legacy_simulation_id``. An update that would leave both set is refused,
     *     and the simulation's own kind (economy or household) is not checked.
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
     * UserTypeChangeItem
     * @description One recorded change of a signed-in user's type.
     *
     *     ``source`` is ``admin_route`` for a change an admin made through these
     *     routes, named by ``changed_by_user_id`` and ``changed_by_email``,
     *     ``invitation`` for one the user made by accepting an admin's email
     *     invitation, which names that admin, and ``script`` for one the type
     *     script made, which names no admin. ``changed_by_user_id`` is also null
     *     once that admin's account is deleted.
     *     ``changed_by_email`` is read from Auth0 like an admin user item's email,
     *     else stored.
     */
    UserTypeChangeItem: {
      /**
       * Id
       * Format: uuid
       */
      id: string;
      /**
       * User Id
       * Format: uuid
       */
      user_id: string;
      /**
       * Previous User Type
       * @enum {string}
       */
      previous_user_type: 'standard' | 'author' | 'admin';
      /**
       * New User Type
       * @enum {string}
       */
      new_user_type: 'standard' | 'author' | 'admin';
      /** Changed By User Id */
      changed_by_user_id: string | null;
      /** Changed By Email */
      changed_by_email: string | null;
      /**
       * Source
       * @enum {string}
       */
      source: 'admin_route' | 'invitation' | 'script';
      /**
       * Created At
       * Format: date-time
       */
      created_at: string;
    };
    /**
     * UserTypeChangeListResponse
     * @description The response for a signed-in user's recorded type changes.
     */
    UserTypeChangeListResponse: {
      /**
       * Status
       * @default ok
       * @constant
       */
      status: 'ok';
      /** Message */
      message?: null;
      result: components['schemas']['UserTypeChangeListResult'];
    };
    /**
     * UserTypeChangeListResult
     * @description A signed-in user's recorded type changes, newest first.
     */
    UserTypeChangeListResult: {
      /** Items */
      items: components['schemas']['UserTypeChangeItem'][];
    };
    /**
     * UserTypePatchRequest
     * @description The signed-in type an admin gives a user, and the type the admin last read.
     *
     *     expected_user_type is the user's type as the admin last read it. When the
     *     request would change the type and the stored type differs from
     *     expected_user_type, the change is refused (409) and nothing is written.
     *     When the user already has user_type, nothing changes (200), whatever
     *     expected_user_type is. Only the type is compared: a type changed and
     *     changed back since the read is not detected.
     */
    UserTypePatchRequest: {
      /**
       * User Type
       * @enum {string}
       */
      user_type: 'standard' | 'author' | 'admin';
      /**
       * Expected User Type
       * @enum {string}
       */
      expected_user_type: 'standard' | 'author' | 'admin';
    };
    /**
     * V2CodedErrorResponse
     * @description An error that also names its reason with a stable ``code``.
     *
     *     Clients choose what to do from ``code``, not from ``message``, which is
     *     for people and may change.
     */
    V2CodedErrorResponse: {
      /**
       * Status
       * @default error
       * @constant
       */
      status: 'error';
      /** Message */
      message: string;
      /** Code */
      code: string;
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
    /**
     * V2MissingParametersErrorResponse
     * @description A refused calculation whose policy sets parameters the catalog lacks.
     *
     *     ``missing_parameters`` names each parameter the policy sets that the
     *     running catalog version does not have, sorted; the calculation would
     *     otherwise run without those values.
     */
    V2MissingParametersErrorResponse: {
      /**
       * Status
       * @default error
       * @constant
       */
      status: 'error';
      /** Message */
      message: string;
      /**
       * Code
       * @default missing_parameters
       * @constant
       */
      code: 'missing_parameters';
      /** Missing Parameters */
      missing_parameters: string[];
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
          'application/json': components['schemas']['MeReadResponse'];
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
      /** @description The caller is the last admin; make another user an admin first. Nothing was deleted. */
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
  accept_invitation_v2_me_invitations_accept_post: {
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
        'application/json': components['schemas']['InvitationAcceptRequest'];
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['InvitationAcceptanceResponse'];
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
      /** @description A valid bearer access token is required; the unauthenticated-user header alone can't accept an invitation. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description code email_mismatch: the signed-in user's verified email isn't the invited address, compared whole and ignoring case. The invitation stays open. A machine (client-credentials) principal is also refused with 403, without a code. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json':
            | components['schemas']['V2CodedErrorResponse']
            | components['schemas']['V2ErrorResponse'];
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
      /** @description code inviter_not_admin: the admin who sent the invitation is no longer an admin. code email_not_verified: Auth0 has no verified email for the signed-in user yet; try again once it is verified. A conflict with stored state is also 409, without a code. */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json':
            | components['schemas']['V2CodedErrorResponse']
            | components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The token can't be accepted. code invitation_not_found: no invitation has it, including a link replaced by a resend; invitation_revoked: it was revoked or replaced by a newer invitation; invitation_expired; invitation_accepted. */
      410: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2CodedErrorResponse'];
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
      /** @description code auth0_unavailable: the signed-in user's email couldn't be read from Auth0; try again shortly. Persistence being unavailable is also 503, without a code. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json':
            | components['schemas']['V2CodedErrorResponse']
            | components['schemas']['V2ErrorResponse'];
        };
      };
    };
  };
  dismiss_type_change_v2_me_type_changes__type_change_id__dismiss_post: {
    parameters: {
      query: {
        /** @description Supported PolicyEngine country ID */
        country_id: 'us' | 'uk';
      };
      header?: never;
      path: {
        type_change_id: string;
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
      /** @description The signed-in user has no type change with this ID. */
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
  list_users_v2_admin_users_get: {
    parameters: {
      query?: {
        /** @description Zero-based result offset */
        offset?: number;
        /** @description Maximum number of returned resources */
        limit?: number;
        email?: string | null;
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
          'application/json': components['schemas']['AdminUserPageResponse'];
        };
      };
      /** @description A valid bearer access token is required. The response carries WWW-Authenticate: Bearer. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description Only admins may use these routes. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description No signed-in user has this ID. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The user's type is no longer the expected one, or the change would leave no admin. */
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
      /** @description The request does not match the schema, or an email search's text holds < or >, or more than 200 Auth0 users match it. */
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
      /** @description User authentication or persistence is unavailable, or, for an email search, users' emails can't be read from Auth0. */
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
  get_user_v2_admin_users__user_id__get: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        user_id: string;
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
          'application/json': components['schemas']['AdminUserResponse'];
        };
      };
      /** @description A valid bearer access token is required. The response carries WWW-Authenticate: Bearer. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description Only admins may use these routes. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description No signed-in user has this ID. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The user's type is no longer the expected one, or the change would leave no admin. */
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
      /** @description The request does not match the schema, or an email search's text holds < or >, or more than 200 Auth0 users match it. */
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
      /** @description User authentication or persistence is unavailable, or, for an email search, users' emails can't be read from Auth0. */
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
  change_user_type_v2_admin_users__user_id__patch: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        user_id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['UserTypePatchRequest'];
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['AdminUserResponse'];
        };
      };
      /** @description A valid bearer access token is required. The response carries WWW-Authenticate: Bearer. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description Only admins may use these routes. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description No signed-in user has this ID. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The user's type is no longer the expected one, or the change would leave no admin. */
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
      /** @description The request does not match the schema, or an email search's text holds < or >, or more than 200 Auth0 users match it. */
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
      /** @description User authentication or persistence is unavailable, or, for an email search, users' emails can't be read from Auth0. */
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
  list_user_type_changes_v2_admin_users__user_id__user_type_changes_get: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        user_id: string;
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
          'application/json': components['schemas']['UserTypeChangeListResponse'];
        };
      };
      /** @description A valid bearer access token is required. The response carries WWW-Authenticate: Bearer. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description Only admins may use these routes. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description No signed-in user has this ID. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The user's type is no longer the expected one, or the change would leave no admin. */
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
      /** @description The request does not match the schema, or an email search's text holds < or >, or more than 200 Auth0 users match it. */
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
      /** @description User authentication or persistence is unavailable, or, for an email search, users' emails can't be read from Auth0. */
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
  list_invitations_v2_admin_invitations_get: {
    parameters: {
      query?: {
        /** @description Zero-based result offset */
        offset?: number;
        /** @description Maximum number of returned resources */
        limit?: number;
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
          'application/json': components['schemas']['AdminInvitationPageResponse'];
        };
      };
      /** @description A valid bearer access token is required. The response carries WWW-Authenticate: Bearer. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description Only admins may use these routes. */
      403: {
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
  create_invitation_v2_admin_invitations_post: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['InvitationCreateRequest'];
      };
    };
    responses: {
      /** @description Successful Response */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['AdminInvitationResponse'];
        };
      };
      /** @description A valid bearer access token is required. The response carries WWW-Authenticate: Bearer. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description Only admins may use these routes. */
      403: {
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
  resend_invitation_v2_admin_invitations__invitation_id__resend_post: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        invitation_id: string;
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
          'application/json': components['schemas']['AdminInvitationResponse'];
        };
      };
      /** @description A valid bearer access token is required. The response carries WWW-Authenticate: Bearer. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description Only admins may use these routes. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description No open invitation has this ID: it is unknown, accepted or revoked. */
      404: {
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
  revoke_invitation_v2_admin_invitations__invitation_id__delete: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        invitation_id: string;
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
      /** @description A valid bearer access token is required. The response carries WWW-Authenticate: Bearer. */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description Only admins may use these routes. */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description No open invitation has this ID: it is unknown, accepted or revoked. */
      404: {
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
          'application/json': components['schemas']['HouseholdCalculationSubmittedResponse'];
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
      /** @description The request does not match the schema; the country does not offer household calculations; the household has no default year; the policy sets parameters the running catalog version does not have (code missing_parameters, which names them); or the simulation service refuses the caller's data, with its reason in the message. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json':
            | components['schemas']['V2MissingParametersErrorResponse']
            | components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The calculation failed unexpectedly, or a succeeded calculation's stored result cannot be read. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The simulation service accepted the calculation, so its job exists, but its answer cannot be read; it failed (500); it answered a status the Public API does not expect, such as 200, a redirect, 408, 409 or 501; its answer was lost after the submission may have reached it; or a proxy in front of it answered 502, 504, or a 503 without the simulation service's code, in its place. In each case it may have created the job, and no route finds a job without its ID. Submit the household calculation again; if the first request went through, this creates a second job. The message gives the simulation service's status and code, or what came in place of its answer. */
      502: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description No job of the submission will run: the simulation service cannot be reached, or the Public API has no URL or credentials for it; it refuses a household, policy or catalog version the Public API has already checked (400); its authentication, routing, body-size or rate limits refuse the request; it answers its own 503, naming its code, because it is not configured, cannot read its manifest or database, or Modal refused the call; or it refuses in a shape the Public API cannot read. Or v2 storage is unavailable. Of the simulation service's answers, the message gives the reason only for a 400, otherwise only its status and code. */
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
      /** @description The request does not match the schema. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The calculation failed unexpectedly, or a succeeded calculation's stored result cannot be read. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The simulation service or v2 storage is unavailable. */
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
  list_reports_v2_reports_get: {
    parameters: {
      query: {
        /** @description Supported PolicyEngine country ID */
        country_id: 'us' | 'uk';
        /** @description A report to list; repeat the key for each report */
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
      /** @description The v2 database or the simulation service is unavailable. */
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
  create_report_v2_reports_post: {
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
        'application/json': components['schemas']['ReportCreateRequest'];
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
      /** @description A policy the report names is not stored in the country. */
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
      /** @description The request does not match the schema; the country has no economy reports (such as a household-only country); a policy the report names sets parameters the running catalog version does not have (code missing_parameters, which names them; the baseline's policy is checked first); or the simulation service cannot run the report: its 422, or its 400 for a region, dataset or dynamic it does not have. The message says which; for the simulation service's refusal, it gives the service's code, when it gave one, and its reason, but not its status. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json':
            | components['schemas']['V2MissingParametersErrorResponse']
            | components['schemas']['V2ErrorResponse'];
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
      /** @description The simulation service may have created the report, but its answer does not say so. The answer was lost after the request may have reached it, or a proxy in front of it answered 502 or 504 in its place: the message says the service may have received the request, but its answer was lost. Or it failed (500), answered 503 in a shape the Public API cannot read or naming only another record, or answered a status the Public API does not expect, which its route may answer after writing rows: the message says it may have created the report, but failed, with its status and code but not its reason. Either message asks the caller to submit the report again, which creates a second report if the first request went through. Or it created the report, but its answer cannot be read. Or it created the report, but the report cannot be read back: the answer gives its report_id, to read with GET /v2/reports/{report_id} rather than submitting it again. */
      502: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json':
            | components['schemas']['V2ErrorResponse']
            | components['schemas']['CreatedReportUnreadableResponse'];
        };
      };
      /** @description The simulation service created nothing: it cannot be reached or is not configured; it answered a readable 503 naming no record, and the message gives its status and code; it answered a 400 naming no region, dataset or dynamic of the caller's (such as a catalog version missing while a release deploys), and the message gives its code and reason; it answered 400 or 422 in a shape the Public API cannot read; or it answered 401, 403, 404, 405, 413 or 429, which are sent before its route runs. Or the v2 database, or the catalog the policies are checked against, cannot be read. Or the service created the report, then Modal refused the run's call and the service failed the run: its 503 named the report, with its status and code, and the answer gives its report_id. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json':
            | components['schemas']['V2ErrorResponse']
            | components['schemas']['UnavailableAfterReportCreatedResponse'];
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
      /** @description No report has this ID in this country. */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The request does not match the schema, or the report is a household report or a budget window, which this route does not read yet. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The newest run succeeded but its stored result cannot be read, or the operation could not be completed. */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['V2ErrorResponse'];
        };
      };
      /** @description The v2 database or the simulation service is unavailable. */
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
  create_simulation_v2_simulations_post: {
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
        'application/json': components['schemas']['SimulationCreateRequest'];
      };
    };
    responses: {
      /** @description Successful Response */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['SimulationDetailResponse'];
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
      /** @description The policy the simulation names is not stored in the country. */
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
      /** @description The request does not match the schema; the country has no economy calculations; the policy sets parameters the running catalog version does not have (code missing_parameters, which names them); or the simulation service cannot run the simulation: its 422, or its 400 for a region, dataset or dynamic it does not have. The message says which; for the simulation service's refusal, it gives the service's code, when it gave one, and its reason, but not its status. */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json':
            | components['schemas']['V2MissingParametersErrorResponse']
            | components['schemas']['V2ErrorResponse'];
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
      /** @description The simulation service may have created the simulation, but its answer does not say so. The answer was lost after the request may have reached it, or a proxy in front of it answered 502 or 504 in its place: the message says the service may have received the request, but its answer was lost. Or it failed (500), answered 503 in a shape the Public API cannot read or naming only another record, or answered a status the Public API does not expect, which its route may answer after writing rows: the message says it may have created the simulation, but failed, with its status and code but not its reason. Either message asks the caller to submit the simulation again, which creates a second simulation if the first request went through. Or it created the simulation, but its answer cannot be read. Or it created the simulation, but the simulation cannot be read back: the answer gives its simulation_id, to read with GET /v2/simulations/{simulation_id} rather than submitting it again. */
      502: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json':
            | components['schemas']['V2ErrorResponse']
            | components['schemas']['CreatedSimulationUnreadableResponse'];
        };
      };
      /** @description The simulation service created nothing: it cannot be reached or is not configured; it answered a readable 503 naming no record, and the message gives its status and code; it answered a 400 naming no region, dataset or dynamic of the caller's (such as a catalog version missing while a release deploys), and the message gives its code and reason; it answered 400 or 422 in a shape the Public API cannot read; or it answered 401, 403, 404, 405, 413 or 429, which are sent before its route runs. Or the v2 database, or the catalog the policy is checked against, cannot be read. Or the service created the simulation, then Modal refused the run's call and the service failed the run: its 503 named the simulation, with its status and code, and the answer gives its simulation_id. */
      503: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json':
            | components['schemas']['V2ErrorResponse']
            | components['schemas']['UnavailableAfterSimulationCreatedResponse'];
        };
      };
    };
  };
  get_simulation_v2_simulations__simulation_id__get: {
    parameters: {
      query: {
        /** @description Supported PolicyEngine country ID */
        country_id: 'us' | 'uk';
      };
      header?: never;
      path: {
        simulation_id: string;
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
          'application/json': components['schemas']['SimulationDetailResponse'];
        };
      };
      /** @description No simulation of this country's model has this ID. */
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
      /** @description The v2 database or the simulation service is unavailable. */
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
      /** @description The requested catalog resource is absent. A catalog version other than the running one that catalog publication pruned (it removed the version's current-law parameter values, parameter tree and parameter search file, which return when that PolicyEngine.py version is installed again) also returns 404, with Cache-Control: no-store and a message naming the country and version. */
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
      /** @description The initialized v2 catalog is unavailable, or the catalog version has no parameter tree (publication writes trees only for the versions it publishes and for the installed version with catalog format 2); the message then names the version. If catalog pruning removed the data of the running PolicyEngine.py version, which a request without policyengine_version selects, it also returns 503, with Cache-Control: no-store and a message naming the country and version. */
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
      /** @description The requested catalog resource is absent. A catalog version other than the running one that catalog publication pruned (it removed the version's current-law parameter values, parameter tree and parameter search file, which return when that PolicyEngine.py version is installed again) also returns 404, with Cache-Control: no-store and a message naming the country and version. */
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
      /** @description The initialized v2 catalog is unavailable, or the catalog version has no parameter search file: only catalog format 2 versions that publication has published, or run with installed, since search files were added have one. The message then names the version. If catalog pruning removed the data of the running PolicyEngine.py version, which a request without policyengine_version selects, it also returns 503, with Cache-Control: no-store and a message naming the country and version. */
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
      /** @description The requested catalog resource is absent. A catalog version other than the running one that catalog publication pruned (it removed the version's current-law parameter values, parameter tree and parameter search file, which return when that PolicyEngine.py version is installed again) also returns 404, with Cache-Control: no-store and a message naming the country and version. */
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
      /** @description The initialized v2 catalog is unavailable. If catalog pruning removed the data of the running PolicyEngine.py version, which a request without policyengine_version selects, it also returns 503, with Cache-Control: no-store and a message naming the country and version. */
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
      /** @description The requested catalog resource is absent. A catalog version other than the running one that catalog publication pruned (it removed the version's current-law parameter values, parameter tree and parameter search file, which return when that PolicyEngine.py version is installed again) also returns 404, with Cache-Control: no-store and a message naming the country and version. */
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
      /** @description The initialized v2 catalog is unavailable. If catalog pruning removed the data of the running PolicyEngine.py version, which a request without policyengine_version selects, it also returns 503, with Cache-Control: no-store and a message naming the country and version. */
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
      /** @description The requested catalog resource is absent. A catalog version other than the running one that catalog publication pruned (it removed the version's current-law parameter values, parameter tree and parameter search file, which return when that PolicyEngine.py version is installed again) also returns 404, with Cache-Control: no-store and a message naming the country and version. */
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
      /** @description The initialized v2 catalog is unavailable. If catalog pruning removed the data of the running PolicyEngine.py version, which a request without policyengine_version selects, it also returns 503, with Cache-Control: no-store and a message naming the country and version. */
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
      /** @description The requested catalog resource is absent. A catalog version other than the running one that catalog publication pruned (it removed the version's current-law parameter values, parameter tree and parameter search file, which return when that PolicyEngine.py version is installed again) also returns 404, with Cache-Control: no-store and a message naming the country and version. */
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
      /** @description The initialized v2 catalog is unavailable. If catalog pruning removed the data of the running PolicyEngine.py version, which a request without policyengine_version selects, it also returns 503, with Cache-Control: no-store and a message naming the country and version. */
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
