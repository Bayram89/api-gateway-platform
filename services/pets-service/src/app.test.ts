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

  it("creates a pet from valid input", async () => {
    const response = await request(createApp())
      .post("/pets")
      .send({ name: "  Bella  ", species: "DOG" });

    expect(response.status).toBe(201);
    expect(response.headers.location).toBe("/pets/3");
    expect(response.body.data).toEqual({ id: 3, name: "Bella", species: "dog" });
  });

  it("rejects a pet without a species", async () => {
    const response = await request(createApp()).post("/pets").send({ name: "Bella" });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_PET");
  });
});
