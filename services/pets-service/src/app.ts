import express, { type NextFunction, type Request, type Response } from "express";
import { collectDefaultMetrics, Counter, Registry } from "prom-client";

const pets = [
  { id: 1, name: "Milo", species: "dog" },
  { id: 2, name: "Luna", species: "cat" }
];

export function createApp() {
  const app = express();
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

