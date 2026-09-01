import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";

describe("pets service", () => {
  it("reports its health", async () => {
    const response = await request(createApp()).get("/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok", service: "pets-service" });
  });

  it("returns a consistent not-found error", async () => {
    const response = await request(createApp()).get("/pets/999");
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("PET_NOT_FOUND");
  });
});

