# Self-service: onboard another API

This project treats gateway configuration as code. A product team can propose a service and route through a pull request instead of asking a gateway administrator to enter configuration manually.

## Required information

- A unique service and route name
- An internal service URL
- A public path beginning with `/api/`
- Connection and response timeouts
- Authentication requirements
- An initial rate limit
- A health endpoint and metrics endpoint
- An OpenAPI contract

## Example declaration

Add an entry under `services` in `infra/kong/kong.yml`:

```yaml
- name: example-service
  url: http://example-service:3003/resources
  connect_timeout: 3000
  read_timeout: 5000
  write_timeout: 5000
  retries: 2
  routes:
    - name: example-api
      paths: ["/api/resources"]
      strip_path: true
  plugins:
    - name: key-auth
    - name: rate-limiting
      config:
        minute: 20
        policy: local
```

Then add the service to `compose.yml`, document its contract under `openapi/`, run the tests, and execute `scripts/smoke-test.ps1`.

## Review checklist

- The public route does not collide with an existing route.
- Credentials are never committed to production configuration.
- Timeouts and retries are bounded.
- Retried operations are safe or idempotent.
- Logs propagate `X-Request-ID`.
- Metrics do not contain sensitive or high-cardinality labels.
- Failure responses do not expose internal details.

