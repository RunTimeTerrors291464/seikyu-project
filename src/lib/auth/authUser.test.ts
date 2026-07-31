import { describe, expect, it } from "vitest";

import {
  USER_ROLE_ADMIN,
  USER_ROLE_CASHIER,
  USER_ROLE_MANAGER,
} from "@/features/admin/services/adminUsers.service";
import {
  defaultHomePathForRoles,
  normalizeAuthUser,
  userMayAccessPath,
} from "@/lib/auth/authUser";

describe("normalizeAuthUser", () => {
  it("accepts numeric roles array from the API", () => {
    const user = normalizeAuthUser({
      id: "1",
      username: "manager",
      roles: [USER_ROLE_MANAGER],
    });

    expect(user).toEqual({
      id: "1",
      username: "manager",
      roles: [USER_ROLE_MANAGER],
    });
  });

  it("returns null when required fields are missing", () => {
    expect(normalizeAuthUser({ username: "no-id" })).toBeNull();
  });
});

describe("defaultHomePathForRoles", () => {
  it("prefers admin, then manager, then cashier", () => {
    expect(defaultHomePathForRoles([USER_ROLE_CASHIER])).toBe(
      "/cashier/new-selling",
    );
    expect(defaultHomePathForRoles([USER_ROLE_MANAGER])).toBe(
      "/manager/product-inventory",
    );
    expect(defaultHomePathForRoles([USER_ROLE_ADMIN])).toBe("/admin/dashboard");
    expect(
      defaultHomePathForRoles([
        USER_ROLE_CASHIER,
        USER_ROLE_MANAGER,
        USER_ROLE_ADMIN,
      ]),
    ).toBe("/admin/dashboard");
  });

  it("restores the cashier invoice list when the feature flag is disabled", () => {
    expect(defaultHomePathForRoles([USER_ROLE_CASHIER], false)).toBe(
      "/cashier/selling",
    );
  });
});

describe("userMayAccessPath", () => {
  it("allows admins into every area", () => {
    expect(userMayAccessPath([USER_ROLE_ADMIN], "/manager/invoices/import")).toBe(
      true,
    );
    expect(userMayAccessPath([USER_ROLE_ADMIN], "/cashier/selling")).toBe(true);
  });

  it("blocks cashiers from manager routes", () => {
    expect(userMayAccessPath([USER_ROLE_CASHIER], "/manager/product-inventory")).toBe(
      false,
    );
  });

  it("blocks managers from cashier routes", () => {
    expect(userMayAccessPath([USER_ROLE_MANAGER], "/cashier/selling")).toBe(false);
  });
});
