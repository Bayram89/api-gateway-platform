import express, { type NextFunction, type Request, type Response } from "express";
import { collectDefaultMetrics, Counter, Registry } from "prom-client";

const appointments = [
  { id: 101, petId: 1, date: "2026-09-10", reason: "Annual check-up" },
  { id: 102, petId: 2, date: "2026-09-12", reason: "Vaccination" }
];

export function createApp() {
  const app = express();
  const registry = new Registry();
  collectDefaultMetrics({ register: registry, prefix: "appointments_" });
  const requests = new Counter({
    name: "appointments_http_requests_total",
    help: "Total HTTP requests handled by the appointments service",
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
        service: "appointments-service",
        method: req.method,
        path: req.path,
        status: res.statusCode,
        durationMs: Date.now() - startedAt,
        requestId: req.header("x-request-id") ?? null
      }));
    });
    next();
  });

  app.get("/health", (_req, res) => res.json({ status: "ok", service: "appointments-service" }));
  app.get("/appointments", (req, res) => {
    const petId = req.query.petId ? Number(req.query.petId) : undefined;
    const data = petId ? appointments.filter((item) => item.petId === petId) : appointments;
    res.json({ data });
  });
  app.get("/metrics", async (_req, res) => res.type(registry.contentType).send(await registry.metrics()));
  app.use((_req, res) => res.status(404).json({ error: { code: "ROUTE_NOT_FOUND", message: "Route not found" } }));
  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error(error);
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Unexpected server error" } });
  });
  return app;
}

