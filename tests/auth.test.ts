import { describe, expect, it } from "vitest";

import {
  hashPassword,
  verifyPassword,
} from "@/lib/auth";

describe("authentication", () => {
  it("hashes passwords and verifies the correct password", async () => {
    const password = "StrongPassword123!";
    const hash = await hashPassword(password);

    expect(hash).not.toBe(password);
    expect(await verifyPassword(password, hash)).toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("StrongPassword123!");

    expect(
      await verifyPassword("WrongPassword123!", hash)
    ).toBe(false);
  });

  it("generates different password hashes for the same password", async () => {
    const password = "StrongPassword123!";

    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);

    expect(hash1).not.toBe(hash2);

    expect(await verifyPassword(password, hash1)).toBe(true);
    expect(await verifyPassword(password, hash2)).toBe(true);
  });
});
