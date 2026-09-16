# Launch.io Architecture Deep Dive

This repo is a small deployment platform in-progress: it authenticates a GitHub user, selects a repo, builds it into a Docker image, runs the resulting container, and exposes it locally on port 3000. The goal is not just “deploy a repo” but to understand the entire infra chain behind that flow: OAuth, JWT auth, GitHub repo cloning, buildpack-like packaging, Docker image creation, and container orchestration.

This document explains the mental model behind the system so you can build more infrastructure products, not just copy a few working API routes.

---

## 1. What this app is doing at a high level

The system is effectively:

1. User logs into GitHub
2. App stores GitHub account data + tokens
3. User picks a repo
4. App clones the repo
5. It runs a build system that decides how to package the app
6. It builds a Docker image
7. It starts a container from that image
8. The app becomes reachable on a local port

That is the core of platform engineering: turn an arbitrary codebase into a runnable service.

The key idea: deployment is not “pushing code to a server.” It is really “turning source code into a runtime artifact that can be started deterministically in a container.”

---

## 2. The repository structure

At a high level:

- `client/` – Next.js frontend for the web app UI
- `server/` – Go API server
- `server/internal/auth/` – OAuth and JWT auth
- `server/internal/project/` – repo selection and deployment orchestration
- `server/internal/buildEngine/` – clone + build into Docker image
- `server/internal/orchestrator/` – create and run the final container
- `server/internal/db/` – Postgres queries and migrations
- `server/internal/config/` – app config

The important architectural split is:

- app logic lives in Go
- container runtime lives in Docker
- package build logic lives in Railpack
- user-facing actions are triggered via HTTP endpoints

---

## 3. The user journey and request lifecycle

### 3.1 GitHub login

The first important boundary is GitHub OAuth.

The flow looks like this:

- Browser hits `/auth/github/login`
- Server redirects to GitHub OAuth
- GitHub redirects back to `/auth/github/callback`
- App exchanges the code for GitHub access tokens
- App stores user + repo access info in the database
- App issues local JWT access + refresh tokens for the API

This is important because it separates two trust domains:

- GitHub identity / repo access
- Local app identity / authorization

The app never trusts the browser with GitHub credentials directly. It only uses a GitHub-issued code and then exchanges it on the backend.

### 3.2 Project creation

When the user selects a repo, the backend stores metadata such as:

- repo full name
- clone URL
- default branch
- owner relation
- project record tied to user ID

This matters because deployment is not just “take a repo string.” You need a persistent record of:

- who owns it
- what branch is default
- what GitHub repo to clone
- what deployment history belongs to that project

### 3.3 Deployment request

The deploy endpoint is this shape:

- `POST /projects/:id/deploy`
- requires a JWT in the `Authorization` header
- checks ownership of the project
- creates a deployment row
- marks status as `queued` then `building`
- builds the project into a Docker image
- starts a container from that image
- marks status as `running`

This is a very important infra design pattern:

- do not treat deploy as fire-and-forget
- record state in the database
- build can be slow and should be observable
- container startup is a separate operation from image build

---

## 4. Where the build actually happens

The build logic is in `server/internal/buildEngine/build.go`.

The build flow is roughly:

1. Validate repo and selected branch
2. Generate a unique image tag
3. Clone repo to temp directory
4. Ensure BuildKit is available
5. Run `railpack build`
6. Command returns a built image tag
7. That image tag is saved on the deployment record
8. Orchestrator creates a container using that image

This is the most important part of any deployment platform: from source to runnable artifact.

### Why not just `docker build` directly?

Because a generic platform must support many app types:

- Node.js apps
- Next.js apps
- Python apps
- Go apps
- static sites
- monorepos
- frameworks with custom install steps

A plain `docker build` needs a Dockerfile. But many repos do not include one. This is where tools like Railpack step in: they inspect the project and infer a suitable build pipeline.

Railpack is effectively a generic builder that asks, “What kind of app is this?” and then builds the right runtime image accordingly.

---

## 5. Railpack: the missing layer between source and container

Railpack is the tool that makes this app feel like a platform rather than a toy script.

Conceptually:

- it detects the app type
- installs dependencies
- runs the correct build command
- packages the compiled output into an OCI image
- allows the platform to launch the result with Docker

The build flow here is not manually writing Dockerfiles per project. Instead, the system calls Railpack, which provides the abstraction layer.

### 5.1 Why Railpack matters

Without Railpack, you would need:

- per-framework Dockerfiles
- custom package install logic
- build system knowledge for each language
- manual handling of env vars and runtime commands

That is exactly the kind of complexity that collapses a platform into a brittle system. Railpack reduces the need for app-specific custom logic.

### 5.2 What Railpack is doing under the hood

At a high level, Railpack is doing something like this:

- inspect repo files
- look for `package.json`, `requirements.txt`, `go.mod`, frameworks, lockfiles, etc.
- detect language and runtime
- install dependencies in a build container
- run build steps like `npm run build`, `next build`, `go build`, etc.
- copy only the runtime output into the final image
- set default command for execution

This is very similar to Buildpacks and Nixpacks concepts: it is building a deployment image from source without requiring the project author to write a custom Dockerfile.

### 5.3 Why BuildKit matters here

The system explicitly ensures BuildKit is available before running Railpack. This matters because modern Docker image builds are no longer just a CLI call; they rely on a build engine that understands layer caching, multi-stage builds, efficient context transfer, and execution isolation.

BuildKit gives you:

- faster builds via caching
- better layer reuse
- support for complex build graphs
- containerized build execution
- less brittle image creation

If BuildKit is missing or the daemon is incompatible, the deploy pipeline breaks even if the app source is fine.

---

## 6. Docker image creation in this repo

This repo creates a final image using Railpack, then starts a container from it.

The orchestrator is in `server/internal/orchestrator/orchestrator.go`.

### 6.1 Why container orchestration is separate from build

This is a very good separation of concerns:

- build engine creates an image
- orchestrator creates and starts a container from that image

This is the same pattern used by real infra systems:

- build pipeline produces artifact
- runtime layer handles lifecycle

This separation makes troubleshooting easier. If the `railpack build` step succeeds but the container fails to start, you know the error is in runtime configuration, not source build logic.

### 6.2 Container creation details in this repo

The code does the following:

- names the container `launchio-<projectID>`
- removes any existing container with the same name
- sets environment variable `PORT=3000`
- exposes port 3000 on the container
- binds host port 3000 to container port 3000
- adds labels for project ID and deployment ID

That is a classic runtime contract:

- app listens on port 3000
- host forwards traffic from port 3000 to the container
- labels help identify deployment ownership for debugging and cleanup

### 6.3 Why binding to 0.0.0.0 matters

The host port mapping uses `0.0.0.0`, which means the container is accessible from the host network namespace. This is important in local smoke tests and dev environments because it ensures the port is reachable externally from the machine rather than only on loopback or a bridge interface.

This is also a foundational concept in container networking: containers are isolated, and you need explicit port publishing rules to make services reachable.

---

## 7. The database layer: why it matters more than it looks

The app stores:

- users
- GitHub OAuth data
- projects
- deployments
- deployment logs
- image tags
- status transitions

This matters because deployment systems are state machines.

A deployment is not just “done or not done.” It transitions through states like:

- queued
- building
- failed
- running

Without a database, you lose traceability of what happened and when. That is a critical part of infra reliability.

### 7.1 Why deployment logs are important

The build callback writes log lines from Railpack output into the database. That makes the deployment visible and debuggable.

This is extremely important in platform work:

- builds fail in nondeterministic ways
- build output is your source of truth
- logs must be stored and queryable

Without logs, infra debugging becomes guesswork.

---

## 8. Auth and JWT design

The backend uses JWTs with separate access and refresh tokens.

Important details:

- access token expiry is intentionally short
- refresh token lasts longer
- access tokens are used for protected endpoints
- refresh token is used to mint a new access token when it expires

In this repo, the access token expiry is set to 1 hour, which is great for testing because it reduces friction during development and avoids stale credentials causing frustration.

### Why short-lived access tokens matter

From an infra perspective, short-lived access tokens are good because:

- reduce blast radius of token leakage
- force revalidation of identity
- make old sessions easier to revoke

For a real product, you also want:

- refresh token rotation
- revocation lists / token tables
- session invalidation options

---

## 9. Why the deploy request is synchronous in this repo

This is a critical design decision.

The deploy endpoint currently calls the entire flow directly and returns only after the build and container run are complete.

This means:

- the request blocks for a long time
- the client waits for the deployment to finish
- the server’s `WriteTimeout` must be high enough
- there is no queue or background worker yet

This is a good local smoke-test architecture but not a production deployment platform design.

### 9.1 Why the write timeout matters

Initially, the app could hit empty replies because the server timeout was too short for long build tasks. This is a very common infra gotcha.

A deploy request can take tens of seconds or minutes. If the server writes a response too early or closes the connection due to timeout, the client sees a truncated response or an empty body.

This is exactly why a robust deployment system eventually needs:

- async job queue
- polling endpoint or WebSockets for status
- separate worker service
- background job persistence

---

## 10. Key edge cases and failure modes

This is where the real learning happens.

### 10.1 OAuth redirect mismatch

A common production issue is hitting the wrong callback URL. In this repo, GitHub OAuth had to point to the Codespaces-forwarded URL, not localhost.

This is the same thing you will face in production with:

- staging hostnames
- preview environments
- custom domains
- Vercel / Netlify / Cloudflare / ingress routing

The rule is simple:

- the redirect URI in GitHub must match what the app expects exactly
- `localhost` and forwarded dev URLs are different

### 10.2 Token expiration

If the access token expires, all protected API routes return 401. This can be painful during testing if you are not reauthenticating or refreshing the token correctly.

In a real product, do not let users manually copy tokens around. Use refresh flow or secure cookie/session architecture depending on app type.

### 10.3 Port collisions

If a container is already using port 3000, the deploy flow can fail or behave unexpectedly. This is why the orchestrator removes existing containers with the same name before creating a new one.

In a larger platform, you would also need:

- port allocation logic
- reserved port management
- network partitioning
- health checks

### 10.4 BuildKit missing or incompatible

This repo requires BuildKit to be available. If it is missing, Railpack cannot build the image reliably.

This is a classic infra pattern: the platform depends on system components outside the app itself.

The platform should eventually:

- validate dependencies on startup
- provide clear install instructions
- expose surfaces for compatibility problems

### 10.5 Build context size and repo complexity

If your repo is huge or includes build artifacts, the clone/build step can become slow or heavy. A production platform has to manage:

- shallow clones
- selective artifact extraction
- caching conventions
- large monorepo strategies
- build cache persistence

### 10.6 Docker daemon access

The server interacts with the Docker daemon via the Docker client. This assumes the app is running on a machine with a valid Docker socket and privileges.

That means the platform is tightly coupled to Docker. For real multi-tenant infra, you would eventually offload this to:

- remote builders
- Kubernetes
- containerd orchestration
- runner pools

---

## 11. Why this is a good local infra prototype

Even though it is simple, this flow demonstrates the exact core of platform engineering:

- auth
- repo metadata
- build abstraction
- artifact generation
- runtime orchestration
- logs + state

This is the backbone of modern app deployment systems. The real differences between toy projects and production infra are not the core principles; they are the operational depth:

- async jobs
- queues
- caching
- observability
- security
- data durability
- autoscaling
- multi-tenancy
- network isolation
- rollback systems

---

## 12. What to learn next if you want to build bigger infra products

Here are the most important areas to master:

### 12.1 Docker internals

Learn:

- Docker daemon architecture
- image layers
- container runtime
- networking mode
- volume mounts
- container lifecycle
- cgroups and namespaces

This is essential because containers are the base unit of modern infra.

### 12.2 BuildKit and OCI

Learn:

- BuildKit internals
- cache layers
- multi-stage builds
- buildx
- OCI image spec
- provenance
- image signing

This is where deployment platforms become efficient and production-safe.

### 12.3 Buildpacks / Railpack / Nixpacks concepts

Learn:

- how source is converted into runnable artifacts
- language detection
- build phases
- dependency installation patterns
- runtime selection
- frameworks and env detection

### 12.4 Distributed systems basics

For a real deployment system, learn:

- queues and workers
- retry logic
- idempotency
- job orchestration
- status tracking
- backpressure
- failure isolation

### 12.5 Networking

Learn:

- DNS
- ingress
- reverse proxying
- TLS
- port binding
- service discovery
- domain routing
- load balancing

### 12.6 Observability

Learn:

- structured logging
- tracing
- metrics
- deployment events
- health checks
- alerting

A deployment system without observability is dangerous.

### 12.7 Security

Learn:

- secret management
- token rotation
- least privilege
- container isolation
- network policies
- mounting secrets safely
- image provenance

---

## 13. The mental model to carry forward

The big idea behind this repo is that deployment is a pipeline:

source code -> build system -> image -> runtime -> network exposure

Every stage introduces complexity:

- source code is not runnable by default
- package managers need context
- runtime needs OS + dependencies
- images must be reproducible
- containers must be started with the right config
- services must be reachable and observable

Most infra products are just this pipeline with more controls and more safety around each phase.

If you can understand how this small deployment flow works, you can build bigger systems like:

- deployment platform for teams
- GitHub app-based project deployer
- preview environment manager
- self-hosted app runner
- staging platform
- edge deployment orchestrator
- build farm infrastructure

---

## 14. Recommended next upgrades for this project

If you want to turn this repo into a real platform, the next big upgrades are:

1. async deploy workers
2. deployment polling API
3. build logs streaming
4. full Docker health checks
5. route/domain assignment
6. support for env variables per project
7. rollback to previous deployment
8. project-level secrets and registry support
9. queue-based job processing with retries
10. better resource limits and isolation for containers

These are the real differences between a local proof-of-concept and a serious infra product.

---

## 15. Final summary

This project is a perfect mini-infra system because it includes almost all the common deployment primitives in a compact form:

- OAuth user identity
- database-backed project state
- repo cloning
- build detection
- image creation with Railpack
- Docker runtime orchestration
- local port exposure
- logs and status tracking

That is the fundamental recipe for building deployment infrastructure. The challenge is not just making it “work once”; it is making it reliable, observable, secure, scalable, and operable.

The next step is not more copy-paste. The next step is learning the systems beneath it: BuildKit, container runtime, orchestration, networking, deployment state, slow-build handling, and observability.

That is how you grow from “I built a deployer” to “I understand infra products.”
