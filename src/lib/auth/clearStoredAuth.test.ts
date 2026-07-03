import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ACCESS_TOKEN_COOKIE,
  USER_ROLES_COOKIE,
} from "@/lib/auth/authCookies";
import { clearStoredAuth } from "@/lib/auth/clearStoredAuth";

describe("clearStoredAuth", () => {
  let storage: Record<string, string>;
  let cookieJar: string;
  let cookieWrites: string[];

  beforeEach(() => {
    storage = {};
    cookieJar = `${ACCESS_TOKEN_COOKIE}=expired-token; path=/; SameSite=Lax`;
    cookieWrites = [];

    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storage[key] ?? null,
      setItem: (key: string, value: string) => {
        storage[key] = value;
      },
      removeItem: (key: string) => {
        delete storage[key];
      },
    });

    vi.stubGlobal("document", {
      get cookie() {
        return cookieJar;
      },
      set cookie(value: string) {
        cookieWrites.push(value);
        cookieJar = value;
      },
    });

    vi.stubGlobal("window", {
      location: { protocol: "http:" },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("removes access, refresh, and user keys from localStorage", () => {
    storage.access_token = "access";
    storage.refresh_token = "refresh";
    storage.user = '{"id":"1"}';
    storage.unrelated = "keep";

    clearStoredAuth();

    expect(storage.access_token).toBeUndefined();
    expect(storage.refresh_token).toBeUndefined();
    expect(storage.user).toBeUndefined();
    expect(storage.unrelated).toBe("keep");
  });

  it("expires auth cookies used by middleware", () => {
    clearStoredAuth();

    expect(
      cookieWrites.some((entry) => entry.includes(`${ACCESS_TOKEN_COOKIE}=`)),
    ).toBe(true);
    expect(
      cookieWrites.some((entry) => entry.includes(`${USER_ROLES_COOKIE}=`)),
    ).toBe(true);
    expect(
      cookieWrites.some((entry) => entry.includes("expires=Thu, 01 Jan 1970")),
    ).toBe(true);
  });
});
