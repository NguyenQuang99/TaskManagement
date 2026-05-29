import { describe, expect, it } from "vitest";
import { mapFirebaseError } from "./mapFirebaseError.js";

describe("mapFirebaseError", () => {
  it("maps auth/invalid-credential", () => {
    expect(mapFirebaseError({ code: "auth/invalid-credential" })).toBe(
      "Invalid email or password."
    );
  });

  it("maps permission-denied", () => {
    expect(mapFirebaseError({ code: "permission-denied" })).toBe(
      "You do not have permission to do this."
    );
  });

  it("returns fallback for unknown codes", () => {
    expect(mapFirebaseError({ code: "auth/unknown-code" })).toBe(
      "Something went wrong. Please try again."
    );
  });
});
