import { describe, expect, it } from "vitest";

import {
  USER_ROLE_ADMIN,
  USER_ROLE_MANAGER,
} from "@/features/admin/services/adminUsers.service";
import { parseUserRolesCookie } from "@/lib/auth/authCookies";

describe("parseUserRolesCookie", () => {
  it("parses encoded role arrays", () => {
    const encoded = encodeURIComponent(
      JSON.stringify([USER_ROLE_ADMIN, USER_ROLE_MANAGER]),
    );

    expect(parseUserRolesCookie(encoded)).toEqual([
      USER_ROLE_ADMIN,
      USER_ROLE_MANAGER,
    ]);
  });

  it("filters unknown role codes", () => {
    const encoded = encodeURIComponent(JSON.stringify([USER_ROLE_ADMIN, 99]));

    expect(parseUserRolesCookie(encoded)).toEqual([USER_ROLE_ADMIN]);
  });

  it("returns an empty array for invalid values", () => {
    expect(parseUserRolesCookie(undefined)).toEqual([]);
    expect(parseUserRolesCookie("not-json")).toEqual([]);
  });
});
