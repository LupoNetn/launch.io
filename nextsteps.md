# Launch.io Next Steps

This document is the working roadmap for taking Launch.io from a local deployment prototype to a production-grade infrastructure product, while using the project to become a stronger software engineer.

The goal is not to jump directly to Kubernetes, multi-region infrastructure, or a complex queue. The goal is to make each layer understandable, testable, observable, secure, and reliable before adding the next layer.

---

## 1. Current System

The current backend proves this local deployment path:

```text
GitHub OAuth
-> JWT authentication
-> repository selection
-> project and domain records
-> shallow Git clone
-> Railpack detection and build
-> BuildKit image build
-> Docker container creation
-> dynamic host port
-> proxy mapping
-> reverse proxy on port 8000
-> local hostname via /etc/hosts
-> deployed application
```

The current components are:

- `client/` - Next.js marketing/frontend surface
- `server/cmd/server/` - API and process startup
- `server/internal/auth/` - GitHub OAuth and local JWTs
- `server/internal/project/` - project selection and deployment transaction
- `server/internal/buildEngine/` - Git clone, BuildKit setup, and Railpack build
- `server/internal/orchestrator/` - Docker container lifecycle
- `server/internal/proxy/` - hostname lookup and reverse proxying
- `server/internal/db/` - migrations, queries, models, deployment logs

The project is currently a local, synchronous deployment platform. That is a valid foundation, but it is not yet a production hosting platform.

---

## 2. The Core Mental Model

Keep this pipeline clear:

```text
Source code
-> build plan
-> build execution
-> immutable artifact
-> runtime container
-> health check
-> routing
-> user traffic
```

Each component has a separate job:

- GitHub stores source code.
- Railpack detects how source should be built.
- BuildKit executes the image build.
- A Docker image is the packaged artifact.
- A Docker container is a running process created from the image.
- The database stores deployment and routing state.
- The reverse proxy selects a project based on the hostname.
- DNS directs a hostname toward the proxy.

Do not mentally collapse these into “Docker deploys the app.” Each boundary has different failure modes and security concerns.

---

## 3. What Works Locally

The local smoke-test path is meaningful when all of these are true:

1. The Go API starts and connects to Postgres.
2. GitHub OAuth produces a valid local JWT.
3. The selected project has clone metadata.
4. Git can clone the repository.
5. Railpack is installed.
6. Docker is running.
7. BuildKit can start.
8. Railpack creates an image.
9. Docker starts the resulting container.
10. A host port is assigned and persisted.
11. A proxy mapping exists.
12. A domain row exists.
13. `/etc/hosts` or real DNS resolves the hostname.
14. The reverse proxy forwards traffic to the assigned port.

A successful API response alone is not enough. A real proof includes:

```bash
go test ./...
curl -i http://localhost:8080/health
docker images
docker ps -a
docker logs <container>
curl -i http://localhost:8000
curl -i -H 'Host: <project-domain>' http://localhost:8000
```

---

## 4. Immediate Engineering Priorities

Work in this order.

### Phase 1: Make the current prototype reliable

Before adding public infrastructure:

- add tests for core deployment behavior
- improve error handling
- add deployment status and detail queries
- add health checks
- fix proxy mapping lifecycle
- add startup dependency checks
- remove secrets from tracked files
- add structured logs and request IDs
- document repeatable local setup

### Phase 2: Make deployments asynchronous

The current deploy request waits for cloning, building, image creation, and container startup. This is fragile for HTTP clients and prevents a good user experience.

Target flow:

```text
POST /projects/:id/deploy
-> create queued deployment
-> return deployment ID

worker:
-> claim deployment
-> clone
-> build
-> start container
-> health check
-> update status
```

The API should not own a long-running build request.

### Phase 3: Build deployment observability

Add APIs for:

```text
GET /projects/:id/deployments
GET /projects/:id/deployments/:deploymentId
GET /projects/:id/deployments/:deploymentId/logs
```

Later choose one live log mechanism:

- polling for the simplest first version
- Server-Sent Events for one-way live logs
- WebSockets when two-way interaction is actually needed
- a message broker when multiple workers and replicas exist

The database should remain the durable source of truth. Live delivery should not be the only place logs exist.

### Phase 4: Add a real deployment dashboard

The client should be able to:

- log in with GitHub
- list repositories
- select a repository
- start a deployment
- see deployment status
- view build logs
- see the assigned URL
- inspect failures
- redeploy
- roll back

The current frontend is primarily a landing page. The product workflow still needs to be built.

### Phase 5: Make deployments immutable

The current orchestrator replaces the project container. Move toward:

```text
Deployment A -> image A -> container A
Deployment B -> image B -> container B
production alias -> points to A or B
```

Never destroy the currently live deployment before the replacement is healthy.

This enables:

- zero-downtime releases
- rollback
- preview deployments
- deployment-specific URLs
- safer failed builds

### Phase 6: Make routing durable

Current routing is based on:

```text
hostname -> project -> active proxy mapping -> host port
```

A stronger model is:

```text
hostname/alias -> deployment -> runtime target
```

Add explicit concepts for:

- deployment URL
- production alias
- preview alias
- active deployment
- target port or network address
- health state
- expiration time for previews

When a deployment becomes healthy, switch the alias atomically.

### Phase 7: Add webhooks

OAuth answers who the user is and what repositories they can access. Webhooks answer when a repository changes.

Target flow:

```text
GitHub push event
-> verify signature
-> identify project
-> create deployment
-> enqueue worker job
-> build
-> health check
-> update alias
```

Security requirements:

- verify GitHub webhook signatures
- reject replayed or malformed events
- use idempotency keys
- do not trust repository or branch values from an unverified request

---

## 5. Production-Grade Architecture

A reasonable first production architecture is:

```text
Browser
   |
   v
TLS reverse proxy / load balancer
   |
   +--> API service
   |
   +--> deployed app runtime

API service
   |
   +--> Postgres
   +--> job queue
   +--> object storage
   +--> build workers
   +--> runtime/orchestrator
```

### API service

Responsibilities:

- authentication
- authorization
- project management
- deployment creation
- deployment status queries
- webhook handling
- domain management

The API should create state and enqueue work. It should not perform long builds in request handlers.

### Worker service

Responsibilities:

- claim jobs
- clone source
- run builds
- persist logs
- create artifacts
- start runtimes
- perform health checks
- update status
- retry recoverable failures

Workers need leases and cancellation. A crashed worker must not leave a deployment permanently stuck in `building`.

### Queue

A queue provides:

- backpressure
- retries
- concurrency control
- worker distribution
- delayed jobs
- failure isolation

You can start with Postgres-backed jobs, then move to Redis, NATS, RabbitMQ, or a managed queue when the need is real.

Do not add a distributed queue merely because production systems use one. Add it when multiple workers, retries, or workload isolation require it.

### Artifact storage

Images and build artifacts should eventually live in a registry or object store rather than depending only on one Docker host.

Learn:

- OCI image registries
- image tags versus immutable digests
- content-addressable storage
- retention policies
- artifact cleanup
- image signing and provenance

Use immutable image digests for deployment references. Tags such as `latest` are mutable and unsafe as the source of truth for rollback.

### Runtime

The current Docker runtime is suitable for learning and local hosting. Later options include:

- Docker on a dedicated VM
- containerd
- Kubernetes
- Nomad
- managed container services

Learn Docker thoroughly before adopting Kubernetes. Kubernetes does not remove the underlying concepts; it adds more control-plane behavior around them.

---

## 6. Docker and BuildKit Study Plan

### Docker concepts

Learn and practice:

- images
- layers
- containers
- namespaces
- cgroups
- volumes
- networks
- port publishing
- environment variables
- health checks
- resource limits
- restart policies
- container signals
- graceful shutdown

Useful experiments:

```bash
docker run --rm --name demo-nginx -p 8000:80 nginx
curl http://localhost:8000
docker ps
docker inspect demo-nginx
docker logs demo-nginx
docker exec -it demo-nginx sh
```

Understand why this is different:

```text
docker image = packaged filesystem and metadata
docker container = process created from the image
```

### BuildKit concepts

BuildKit is the build engine. It is not the application runtime.

Learn:

- build contexts
- build stages
- layer caching
- cache exporters
- parallel build steps
- frontend syntax
- OCI output
- rootless versus privileged builds
- provenance and SBOM generation

In this project:

```text
Railpack decides the build plan
BuildKit executes the build plan
Docker stores and runs the resulting image
```

The `moby/buildkit` container is a builder service. The deployed application container is a separate runtime container.

Important production concern: the current BuildKit setup uses `--privileged`. That is acceptable for a controlled local experiment, but build isolation and tenant security must be designed carefully before accepting arbitrary public repositories.

### Railpack concepts

Learn how source detection works:

- language detection
- framework detection
- lockfile selection
- dependency installation
- build commands
- runtime commands
- cache reuse
- monorepo behavior
- environment variable handling

Test Railpack against intentionally different repositories and record what it detects. Detection failures are product behavior, not just tooling problems.

---

## 7. Networking and Visibility

Local visibility currently looks like:

```text
/etc/hosts
-> 127.0.0.1
-> reverse proxy :8000
-> database hostname lookup
-> assigned host port
-> app container
```

This is not public hosting.

Public visibility requires:

```text
public DNS
-> public IP or load balancer
-> TLS termination
-> reverse proxy
-> private runtime network
-> app container
```

Learn:

- DNS A and CNAME records
- wildcard DNS
- HTTP Host header
- TLS certificates
- SNI
- reverse proxy upstreams
- private versus published ports
- Docker bridge networks
- service discovery
- load balancing

A production design should avoid exposing every application container directly to the public network. Prefer:

```text
proxy on public network
app containers on private network
```

The proxy should route to container names or private addresses, not arbitrary public host ports, when the runtime supports it.

---

## 8. Database and State Improvements

Deployment systems are state machines. Make the states explicit and valid.

A useful state model is:

```text
queued
-> preparing
-> building
-> starting
-> health_checking
-> ready
-> failed
-> cancelled
```

Add rules for valid transitions. Record:

- started time
- finished time
- commit SHA
- branch
- image digest
- container ID
- error message
- failure phase
- deployment URL

### Transaction boundaries

Use transactions where multiple records must change together. For example:

- creating a deployment and its initial state
- activating a new alias and deactivating an old alias
- updating a mapping after a successful health check

Do not assume a sequence of independent queries is atomic.

### Idempotency

Retries are inevitable. A repeated request should not create uncontrolled duplicate work.

Learn and apply:

- idempotency keys
- unique database constraints
- upserts
- job deduplication
- retry-safe state transitions

### Cleanup

Define cleanup policies for:

- old deployments
- old containers
- unused images
- stale proxy mappings
- build directories
- deployment logs
- expired preview URLs

A platform that never cleans up eventually fails from its own history.

---

## 9. Security Work Before Public Users

The current `.env` contains credentials. Treat any exposed credential as compromised.

Before public deployment:

- rotate GitHub client secrets
- rotate database credentials
- remove secrets from tracked files
- use environment injection or a secret manager
- never log access tokens
- never return GitHub tokens to the browser unnecessarily
- use secure, appropriate cookies for browser sessions
- validate all IDs and input values
- rate-limit auth and deployment endpoints
- enforce project ownership everywhere
- verify webhook signatures
- restrict container capabilities
- apply CPU, memory, process, and disk limits
- isolate tenants on networks
- protect the Docker socket

The Docker socket is effectively powerful host access. Never expose it to arbitrary application code or untrusted containers without understanding the consequences.

### Build security

A public build system executes untrusted code. Assume a repository can:

- consume all CPU
- consume all memory
- fill the disk
- run forever
- attempt network attacks
- inspect mounted credentials
- exploit privileged build access
- produce malicious artifacts

Build workers need:

- timeouts
- resource limits
- isolated temporary directories
- restricted credentials
- controlled network access
- cleanup on every exit path
- audit logs

---

## 10. Reliability and Observability

### Health checks

Starting a container is not the same as serving a healthy app.

Use a readiness flow:

```text
container starts
-> process port opens
-> HTTP health endpoint responds
-> deployment becomes ready
-> alias switches
```

If health checks fail:

- keep the old deployment live
- mark the new deployment failed
- retain useful logs
- make rollback easy

### Logging

Use structured logs with:

- request ID
- deployment ID
- project ID
- worker ID
- phase
- duration
- error type

Never depend only on terminal logs. Persist deployment logs and retain enough metadata to investigate failures.

### Metrics

Track:

- deployment success rate
- build duration
- queue wait time
- image build cache hit rate
- container startup duration
- health-check duration
- proxy response latency
- 4xx and 5xx rates
- disk usage
- memory usage
- active containers

### Tracing

Later, add traces across:

```text
HTTP request
-> DB query
-> queue job
-> clone
-> Railpack
-> BuildKit
-> Docker
-> health check
```

Tracing matters when a deployment is slow but each individual component appears healthy.

---

## 11. Testing Strategy

The current project has compile coverage but almost no behavior tests. Add tests in layers.

### Unit tests

Test pure logic:

- hostname generation
- deployment state transitions
- input validation
- authorization decisions
- retry classification
- port parsing

### Service tests

Test project service behavior with a database test strategy:

- project ownership
- domain creation
- failed build status
- failed container startup status
- proxy mapping creation
- duplicate deployment handling

Prefer a real Postgres test database or disposable container when SQL behavior matters. Avoid mocks that only prove a mock was called.

### HTTP tests

Test:

- unauthenticated requests
- invalid JWTs
- forbidden project access
- missing projects
- deploy response behavior
- health endpoint
- proxy host routing

### Integration tests

Run real components where practical:

```text
API
+ Postgres
+ Docker
+ BuildKit
+ sample repository
```

Keep a tiny fixture repository for repeatable builds. Do not make every test clone a large external project.

### Failure tests

Intentionally test:

- invalid branch
- inaccessible repository
- missing Railpack
- unavailable Docker daemon
- BuildKit failure
- app that exits immediately
- app that listens on the wrong port
- port exhaustion
- database disconnect
- client cancellation
- disk exhaustion

Infrastructure confidence comes from testing failure, not only success.

---

## 12. API and Product Roadmap

### Current API direction

Keep the API small and explicit:

```text
GET  /health
GET  /auth/github/login
GET  /auth/github/callback
POST /auth/refresh
GET  /auth/me
GET  /projects/list-repo
POST /projects/
POST /projects/:id/deploy
```

Next useful endpoints:

```text
GET    /projects
GET    /projects/:id
GET    /projects/:id/deployments
GET    /projects/:id/deployments/:deploymentId
GET    /projects/:id/deployments/:deploymentId/logs
POST   /projects/:id/deploy
POST   /projects/:id/rollback
POST   /webhooks/github
GET    /projects/:id/domains
POST   /projects/:id/domains
DELETE /projects/:id/domains/:domainId
```

Keep authorization checks at the service boundary, not only in handlers.

### Client roadmap

Build the actual control plane UI:

1. GitHub sign-in.
2. Repository picker.
3. Project list.
4. Project detail page.
5. Deploy button.
6. Deployment status timeline.
7. Build log viewer.
8. Live URL display.
9. Redeploy and rollback controls.
10. Domain settings.
11. Environment variable settings.
12. Usage and resource information.

The landing page can remain, but the core product should become the first usable screen for an authenticated user.

---

## 13. Suggested Milestones

### Milestone A: Reliable local platform

Definition of done:

- documented setup works on a clean machine
- test project deploys repeatedly
- failures update deployment state
- container health is checked
- proxy routes by hostname
- old mappings are cleaned up
- no secrets are committed

### Milestone B: Observable platform

Definition of done:

- deployment list and detail APIs exist
- deployment logs are queryable
- client displays status and failure reason
- request IDs and deployment IDs appear in logs
- resource usage is visible

### Milestone C: Async platform

Definition of done:

- API returns quickly with a deployment ID
- workers process deployments
- jobs retry safely
- stuck jobs are recoverable
- clients poll or stream status
- deployment cancellation works

### Milestone D: Safe release platform

Definition of done:

- deployments are immutable
- old production deployment remains live during build
- health check gates activation
- aliases switch atomically
- rollback is one action
- preview URLs work

### Milestone E: Public platform

Definition of done:

- real DNS and TLS
- webhook-triggered deployments
- secret management
- build isolation
- resource limits
- abuse protection
- backups and recovery
- monitoring and alerting
- documented incident procedures

---

## 14. How to Become a Better Engineer Through This Project

Do not only ask, “Does it work?” Ask:

- What happens when it fails halfway through?
- Who owns this state?
- Is this operation safe to retry?
- What does the user see while it runs?
- How can I prove this behavior in a test?
- What happens if the process crashes here?
- What data must survive a restart?
- What is the security boundary?
- How will this behave with ten projects instead of one?
- Which assumption is currently hidden in the code?

### Practice reading code paths

For every feature, trace:

```text
HTTP route
-> handler
-> service
-> database query
-> external system
-> state update
-> response
```

Write this path down before changing code. It prevents fixes in the wrong layer.

### Practice designing boundaries

Separate:

- request handling
- business rules
- persistence
- external system calls
- background work
- runtime orchestration

Good boundaries make failures easier to understand.

### Practice small changes

For each feature:

1. State the behavior.
2. Identify the owner of that behavior.
3. Make the smallest change.
4. Run the narrowest useful test.
5. Inspect the real result.
6. Add failure coverage.
7. Document operational assumptions.

### Learn the fundamentals deliberately

Study these topics in parallel with implementation:

- Go interfaces, contexts, errors, and concurrency
- HTTP semantics and timeouts
- SQL transactions and indexes
- PostgreSQL isolation and migrations
- Docker images and networking
- BuildKit and OCI images
- DNS, TLS, and reverse proxies
- queues, workers, retries, and idempotency
- Linux processes, signals, namespaces, and cgroups
- observability and incident response
- threat modeling and least privilege

Do not study them only as vocabulary. Connect each concept to a real failure in this project.

---

## 15. Practical Weekly Loop

For each week, choose one production concern:

1. Read the relevant source code.
2. Build a small isolated experiment.
3. Add one improvement to Launch.io.
4. Write one test for the happy path.
5. Write one test for failure.
6. Document what you learned.
7. Run the system manually and inspect the evidence.

Example week:

- Topic: Docker port mapping.
- Experiment: run two Nginx containers on different host ports.
- Project improvement: persist and validate assigned host ports.
- Success test: both hostnames route correctly.
- Failure test: port allocation collision.
- Documentation: explain host port versus container port.

This turns the project into a deliberate engineering curriculum.

---

## 16. Production Readiness Checklist

### Source and builds

- [ ] Builds are reproducible.
- [ ] Image references use immutable digests.
- [ ] Build timeouts exist.
- [ ] Build resources are limited.
- [ ] Build secrets are isolated.
- [ ] Build directories are always cleaned.
- [ ] Failed builds preserve useful logs.

### Runtime

- [ ] Containers have CPU and memory limits.
- [ ] Containers have restart policies.
- [ ] Containers have health checks.
- [ ] Containers run with minimal privileges.
- [ ] Containers use private networks where possible.
- [ ] Old runtimes are cleaned safely.
- [ ] Rollback does not require rebuilding.

### API

- [ ] Auth and authorization are tested.
- [ ] Long jobs are asynchronous.
- [ ] Requests have timeouts.
- [ ] Operations are idempotent where needed.
- [ ] Errors are safe and actionable.
- [ ] Rate limits exist.
- [ ] Request IDs are logged.

### Database

- [ ] Migrations are repeatable and reviewed.
- [ ] Foreign keys and unique constraints exist.
- [ ] Deployment state transitions are controlled.
- [ ] Indexes support common queries.
- [ ] Backups are automated.
- [ ] Restore procedures are tested.
- [ ] Cleanup policies exist.

### Networking

- [ ] DNS is configured.
- [ ] TLS is automatic and renewed.
- [ ] Proxy routing is tested.
- [ ] Unknown hosts return safely.
- [ ] Proxy timeouts exist.
- [ ] Runtime ports are not unnecessarily public.
- [ ] Custom domain ownership is verified.

### Operations

- [ ] Metrics exist.
- [ ] Logs are centralized.
- [ ] Alerts exist.
- [ ] Disk usage is monitored.
- [ ] Worker health is monitored.
- [ ] Incident procedures are documented.
- [ ] Deployments can be paused or cancelled.

---

## 17. Final Direction

Launch.io already contains the seed of a real deployment platform:

```text
source -> build -> image -> container -> routing
```

The work ahead is turning a successful path into a reliable system:

```text
queue -> worker -> artifact -> health check -> immutable deployment -> alias -> traffic
```

Build the next layer only after the current layer is observable and testable. That discipline will improve both the product and your engineering judgment.

The most valuable next implementation is:

```text
asynchronous deployments
+ deployment status API
+ deployment detail page
+ durable build logs
+ health checks
+ rollback-safe routing
```

Once those exist, public DNS, webhooks, custom domains, and larger infrastructure will have a stable foundation to sit on.
