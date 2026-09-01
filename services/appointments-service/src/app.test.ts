import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";

describe("appointments service", () => {
  it("filters appointments by pet", async () => {
    const response = await request(createApp()).get("/appointments?petId=1");
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].petId).toBe(1);
  });

  it("reports its health", async () => {
    const response = await request(createApp()).get("/health");
    expect(response.body.service).toBe("appointments-service");
  });
});
