import { describe, expect, it } from "vitest";
import {
  AUTO_PICK_ALLOWED_WHEN,
  USER_SELECTION_JSON_META,
  validateUserPickGate,
} from "./user-pick-policy.js";

describe("validateUserPickGate", () => {
  it("accepts userConfirmed", () => {
    expect(
      validateUserPickGate({ userConfirmed: true }, "select_palette")
    ).toBeNull();
  });

  it("accepts userDelegatedPick", () => {
    expect(
      validateUserPickGate({ userDelegatedPick: true }, "select_logo")
    ).toBeNull();
  });

  it("rejects when neither flag is set", () => {
    const err = validateUserPickGate({}, "select_palette");
    expect(err).toContain("userConfirmed");
    expect(err).toContain("userDelegatedPick");
  });
});

describe("USER_SELECTION_JSON_META", () => {
  it("documents default forbid with delegation exception", () => {
    expect(USER_SELECTION_JSON_META.autoPickForbidden).toBe(true);
    expect(USER_SELECTION_JSON_META.autoPickAllowedWhen).toBe(
      AUTO_PICK_ALLOWED_WHEN
    );
  });
});
