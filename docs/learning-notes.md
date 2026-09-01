# Learning notes

This page records the concepts and troubleshooting observations from building and running the project. It is intentionally written as a learning journal rather than production guidance.

## What I learned

- An API gateway gives clients one entry point while backend services can remain internal.
- Authentication and rate limiting can be applied before a request reaches a backend service.
- An `X-Request-ID` helps connect one gateway request with the corresponding service log.
- Prometheus collects numeric time-series data; Grafana queries and visualizes that data.
- A healthy gateway does not mean every upstream service is healthy.
- Retries can help with temporary connection failures, but they must be limited because they can add traffic and make clients wait longer.
- Docker `COPY` paths are resolved from the selected build context, not from the directory containing the Dockerfile.

## Problems encountered

### Docker build context

The first image build failed because both Dockerfiles tried to copy `package.json`, `tsconfig.json`, and `src` as though the individual service directory were the Docker build context. Docker Compose actually set the repository root as the context.

The Dockerfiles were corrected to use paths such as:

```dockerfile
COPY services/pets-service/package.json ./
COPY services/pets-service/src ./src
```

After rebuilding, both service containers started and passed their health checks.

### Testing an upstream failure

The appointments container was stopped while Kong and the pets service remained running:

- `/api/appointments` returned `503 Service Unavailable`.
- `/api/pets` continued returning `200 OK`.
- Restarting the appointments container restored its route to `200 OK`.

This demonstrated that the gateway can remain available even when one upstream service fails. It also showed why service-level health and metrics matter.

### Confirming the rate limit

Repeated calls to the pets route initially returned `200 OK`. After the configured quota was reached, Kong returned `429 Too Many Requests`. Restarting Kong reset the demonstration's local counter, which is one limitation of using the `local` rate-limit policy.

## Questions I am continuing to explore

- Which HTTP operations are safe to retry, and when can a retry cause duplicate work?
- How would OAuth 2.0 or OpenID Connect replace the demonstration API key?
- Which metrics are most useful for detecting a slow or failing upstream service?
- How would the design change if Kong and each service had multiple instances?

