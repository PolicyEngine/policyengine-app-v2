import { act, render } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import SyncedAppIframe from "@/components/apps/SyncedAppIframe";

describe("SyncedAppIframe", () => {
  test("forwards parent query params into the iframe URL", () => {
    window.history.replaceState(
      null,
      "",
      "/us/california-wealth-tax?date=2025-10-17&yield=0.02",
    );

    const { container } = render(
      <SyncedAppIframe
        srcPath="/us/california-wealth-tax/embed"
        title="California wealth tax"
        initialQuery="date=2025-10-17&yield=0.02"
      />,
    );

    const iframe = container.querySelector("iframe");

    expect(iframe).not.toBeNull();
    expect(iframe?.getAttribute("src")).toBe(
      "/us/california-wealth-tax/embed?date=2025-10-17&yield=0.02",
    );
    expect(iframe?.getAttribute("allow")).toBe("clipboard-write");
  });

  test("syncs iframe query param updates back to the parent URL", () => {
    window.history.replaceState(null, "", "/us/california-wealth-tax");
    const replaceStateSpy = vi.spyOn(window.history, "replaceState");

    render(
      <SyncedAppIframe
        srcPath="/us/california-wealth-tax/embed"
        title="California wealth tax"
      />,
    );

    act(() => {
      window.dispatchEvent(
        new MessageEvent("message", {
          origin: window.location.origin,
          data: {
            type: "urlUpdate",
            params: "date=2025-10-17&yield=0.02",
          },
        }),
      );
    });

    expect(replaceStateSpy).toHaveBeenCalledWith(
      null,
      "",
      "/us/california-wealth-tax?date=2025-10-17&yield=0.02",
    );
  });
});
