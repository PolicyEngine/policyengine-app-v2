/**
 * Saved-work stores (policies, households, simulations, reports, reforms,
 * flagship report records): every member is an async method.
 */
export type AsyncStore<Store> = {
  [Method in keyof Store]: (...args: never[]) => Promise<unknown>;
};

/**
 * Every method of a store, each listed once. The type requires them all,
 * so a store gaining a method fails to compile until it is listed here.
 */
export type StoreMethods<Store> = { readonly [Method in keyof Store]-?: true };

/**
 * A store whose every call first waits for `resolve` — the store for the
 * sign-in session once it has been restored (see
 * useAssociationBackendResolver) — and then forwards to it. Until the
 * session settles, which store applies is unknown, so nothing is read or
 * written: a signed-in user's save never lands in this browser, and a
 * signed-out visitor's waits only for the restore.
 */
export function deferredStore<Store extends AsyncStore<Store>>(
  resolve: () => Promise<Store>,
  methods: StoreMethods<Store>
): Store {
  const forwarders: Partial<Record<keyof Store, unknown>> = {};
  // `methods` names every method of Store (see StoreMethods), so the
  // object built here has the full Store shape.
  for (const method of Object.keys(methods) as Array<keyof Store>) {
    forwarders[method] = async (...args: unknown[]) => {
      const store = await resolve();
      const operation: unknown = store[method];
      return Reflect.apply(operation as (...operationArgs: unknown[]) => unknown, store, args);
    };
  }
  return forwarders as Store;
}
