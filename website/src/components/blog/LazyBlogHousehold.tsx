"use client";

import dynamic from "next/dynamic";

/**
 * BlogHousehold, loaded only on pages that have a ```household block. It
 * still renders on the server, so the default example's table is in the
 * initial HTML for readers without JavaScript.
 */
export const LazyBlogHousehold = dynamic(() =>
  import("./BlogHousehold").then((m) => m.BlogHousehold),
);
