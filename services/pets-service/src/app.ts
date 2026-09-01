import express, { type NextFunction, type Request, type Response } from "express";
import { collectDefaultMetrics, Counter, Registry } from "prom-client";

type Pet = { id: number; name: string; species: string };

export function createApp() {
  const app = express();
  const pets: Pet[] = [
    { id: 1, name: "Milo", species: "dog" },
    { id: 2, name: "Luna", species: "cat" }
  ];
  const registry = new Registry();
  collectDefaultMetrics({ register: registry, prefix: "pets_" });
  const requests = new Counter({
    name: "pets_http_requests_total",
    help: "Total HTTP requests handled by the pets service",
    labelNames: ["method", "route", "status"] as const,
    registers: [registry]
  });

  app.use(express.json());
  app.use((req, res, next) => {
    const startedAt = Date.now();
    res.on("finish", () => {
      requests.inc({ method: req.method, route: req.route?.path ?? req.path, status: String(res.statusCode) });
      console.log(JSON.stringify({
        level: "info",
        service: "pets-service",
        method: req.method,
        path: req.path,
        status: res.statusCode,
        durationMs: Date.now() - startedAt,
        requestId: req.header("x-request-id") ?? null
      }));
    });
    next();
  });

  app.get("/health", (_req, res) => res.json({ status: "ok", service: "pets-service" }));
  app.get("/pets", (_req, res) => res.json({ data: pets }));
  app.post("/pets", (req, res) => {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const species = typeof req.body.species === "string" ? req.body.species.trim().toLowerCase() : "";

    if (!name || !species) {
      return res.status(400).json({
        error: { code: "INVALID_PET", message: "Name and species are required" }
      });
    }

    const pet: Pet = { id: Math.max(...pets.map((item) => item.id)) + 1, name, species };
    pets.push(pet);
    return res.status(201).location(`/pets/${pet.id}`).json({ data: pet });
  });
  app.get("/pets/:id", (req, res) => {
    const pet = pets.find((item) => item.id === Number(req.params.id));
    if (!pet) return res.status(404).json({ error: { code: "PET_NOT_FOUND", message: "Pet not found" } });
    return res.json({ data: pet });
  });
  app.get("/metrics", async (_req, res) => {
    res.type(registry.contentType).send(await registry.metrics());
  });
  app.use((_req, res) => res.status(404).json({ error: { code: "ROUTE_NOT_FOUND", message: "Route not found" } }));
  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error(error);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Unexpected server error" } });
  });
  return app;
}
