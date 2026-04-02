import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  clearV2Mappings,
  getV2Id,
  setV2Id,
} from "@/libs/migration/idMapping";

describe("idMapping", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("setV2Id and getV2Id", () => {
    test("given v1 ID then stores and retrieves v2 UUID", () => {
      setV2Id("Policy", "sup-abc123", "550e8400-e29b-41d4-a716-446655440000");
      expect(getV2Id("Policy", "sup-abc123")).toBe(
        "550e8400-e29b-41d4-a716-446655440000",
      );
    });

    test("given different entity types then stores separately", () => {
      setV2Id("Policy", "sup-1", "uuid-policy");
      setV2Id("Household", "sup-1", "uuid-household");

      expect(getV2Id("Policy", "sup-1")).toBe("uuid-policy");
      expect(getV2Id("Household", "sup-1")).toBe("uuid-household");
    });

    test("given nonexistent mapping then returns null", () => {
      expect(getV2Id("Policy", "nonexistent")).toBeNull();
    });

    test("given overwrite then returns latest value", () => {
      setV2Id("Policy", "sup-1", "uuid-old");
      setV2Id("Policy", "sup-1", "uuid-new");

      expect(getV2Id("Policy", "sup-1")).toBe("uuid-new");
    });
  });

  describe("clearV2Mappings", () => {
    test("given entity type then clears only that type", () => {
      setV2Id("Policy", "sup-1", "uuid-p1");
      setV2Id("Household", "sup-2", "uuid-h1");

      clearV2Mappings("Policy");

      expect(getV2Id("Policy", "sup-1")).toBeNull();
      expect(getV2Id("Household", "sup-2")).toBe("uuid-h1");
    });

    test("given no entity type then clears all mappings", () => {
      setV2Id("Policy", "sup-1", "uuid-p1");
      setV2Id("Household", "sup-2", "uuid-h1");

      clearV2Mappings();

      expect(getV2Id("Policy", "sup-1")).toBeNull();
      expect(getV2Id("Household", "sup-2")).toBeNull();
    });

    test("given no mappings then does nothing", () => {
      expect(() => clearV2Mappings()).not.toThrow();
    });
  });

  describe("error handling", () => {
    test("given localStorage setItem throws then does not propagate", () => {
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("QuotaExceeded");
      });

      expect(() =>
        setV2Id("Policy", "sup-1", "uuid-1"),
      ).not.toThrow();
    });

    test("given localStorage getItem throws then returns null", () => {
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("SecurityError");
      });

      expect(getV2Id("Policy", "sup-1")).toBeNull();
    });
  });
});
