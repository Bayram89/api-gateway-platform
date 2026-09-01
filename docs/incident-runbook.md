# Incident exercise: appointments API returns 503

## Scenario

Consumers report `503 Service Unavailable` responses from `/api/appointments`, while `/api/pets` still works.

## Immediate priorities

1. Confirm impact: affected route, consumers, error rate, and start time.
2. Check Kong metrics and logs for the status code and upstream latency.
3. Use the `X-Request-ID` from a failed response to correlate gateway and service logs.
4. Check container health with `docker compose ps`.
5. Inspect recent appointment-service logs with `docker compose logs appointments-service --tail 100`.

## Reproduce locally

```powershell
docker compose stop appointments-service
Invoke-WebRequest http://localhost:8000/api/appointments -Headers @{ apikey = "demo-api-key" }
```

The gateway should return an upstream failure while the pets route remains available. This demonstrates failure isolation: one unhealthy domain service does not take down the entire API surface.

## Recover

```powershell
docker compose start appointments-service
docker compose ps
./scripts/smoke-test.ps1
```

## Follow-up questions

- Was the service unavailable, slow, or unreachable because of networking?
- Did retries increase load or help transient failures?
- Did alerts identify the problem before consumers reported it?
- Would readiness probes have prevented traffic reaching an unready instance?
- What change would prevent recurrence?

In a real incident, communicate status and ownership throughout. Restore service first, then conduct a blameless review using logs, metrics, changes, and a timeline.

