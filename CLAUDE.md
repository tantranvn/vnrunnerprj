# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the [Full Stack FastAPI Template](https://github.com/fastapi/full-stack-fastapi-template) (FastAPI + SQLModel + React) customized into **VN Runner**, a race registration/discovery platform, with an added **RBAC (Role-Based Access Control)** system.

- `backend/` — FastAPI + SQLModel + PostgreSQL (pgvector) API
- `frontend/` — React + TanStack Router/Query admin dashboard (Vite, TypeScript, Tailwind, shadcn/ui)
- `compose.yml` references a `runner-site` service (public Next.js SSR site at `domain.com`, admin dashboard at `dashboard.domain.com`) — **its directory does not currently exist in this checkout**; treat any reference to it in docs as aspirational/not-yet-scaffolded until you verify otherwise.
- The root `.env` (one level above `backend/`) is the single source of config for both Docker Compose and the backend's Pydantic `Settings` (`backend/app/core/config.py` loads `env_file="../.env"`).

## Commands

### Docker Compose (full stack, recommended for integration work)
```bash
docker compose watch            # start everything with hot reload
docker compose logs backend     # tail logs for one service
docker compose stop backend     # stop one service to run it locally instead
```
Ports: frontend `:5173`, backend `:8000` (docs at `/docs`, `/redoc`), Adminer `:8080`, Traefik UI `:8090`, MailCatcher `:1080`.

### Backend (`cd backend`)
```bash
uv sync                                   # install deps
source .venv/bin/activate
fastapi dev app/main.py                   # dev server w/ reload
bash scripts/test.sh                      # run full test suite (coverage run + report)
bash scripts/tests-start.sh               # pre-start checks + test.sh (used in CI/Docker)
pytest tests/api/routes/test_items.py     # run one file
pytest -k "test_name"                     # run by name
bash scripts/format.sh                    # ruff check --fix + ruff format
bash scripts/lint.sh                      # mypy, ty check, ruff check, ruff format --check
alembic revision --autogenerate -m "msg"  # new migration (after editing models.py)
alembic upgrade head                      # apply migrations
```
Linting is strict: `mypy` runs with `strict = true`. Ruff select set includes bugbear, comprehensions, pyupgrade, unused-args, and disallows `print()` (`T201`).

### Frontend (`cd frontend`)
```bash
bun install
bun run dev              # http://localhost:5173
bun run build            # tsc -p tsconfig.build.json && vite build
bun run lint             # biome check --write --unsafe
bun run generate-client  # regenerate src/client/ from OpenAPI spec (needs backend running)
bun run test             # bunx playwright test (needs docker compose stack up)
bun run test:ui          # playwright UI mode
```
After any backend API/schema change, regenerate the client with `bash scripts/generate-client.sh` (repo root) or `bun run generate-client`, and commit the result — do not hand-edit `frontend/src/client/`.

### Pre-commit
Uses `prek` (not the classic `pre-commit`). Install once with `uv run prek install -f` (from `backend/`). Run manually across the repo with `uv run prek run --all-files`.

## Backend Architecture

Layering: **routes → crud → models**, with cross-cutting concerns in `core/` and `services/`.

- `app/models.py` — all SQLModel table + schema classes. Every resource follows the `*Base` / `*Create` / `*Update` / `*Public` / table-model / `*sPublic` (list wrapper with `data` + `count`) pattern. Never return the table model directly from an endpoint if it has sensitive fields (e.g. `hashed_password`) — use the `*Public` variant.
- `app/crud.py` — all DB access. Functions take `session: Session` as a keyword-only-style first param, use `Model.model_validate()` to build objects and `sqlmodel_update()` to patch them, and always `session.add/commit/refresh`.
- `app/api/routes/` — one router module per resource, registered in `app/api/main.py`. Route groups: core (users/roles/items/media), race management (races, race_categories, race_registrations, race_results, race_attributes), discovery/personalization (tags, profiles, provinces), CMS (cms_pages, cms_blog_posts/categories/tags, cms_menus, cms_media_folders). `private.py` is mounted only when `settings.ENVIRONMENT == "local"`.
- `app/api/deps.py` — shared dependencies: `SessionDep`, `CurrentUser`, `TokenDep`, plus RBAC helpers `AdminUser`, `RunnerUser`, `require_role(...)`, `require_any_role([...])`. Superusers (`is_superuser=True`) bypass all role checks.
- `app/core/config.py` — Pydantic `Settings`, reads root `.env`; computes CORS origins and the Postgres DSN.
- `app/core/db.py` — engine/session setup and role table initialization.
- `app/core/security.py` — Argon2/bcrypt password hashing (via `pwdlib`), JWT issuance/verification.
- `app/services/ai.py` — OpenAI/Anthropic integration: image generation (`gpt-image-2`, base64 responses) and race embedding generation (`text-embedding-3-small`, 1536 dims via pgvector).
- `app/services/cache.py` — async Redis JSON cache (`cache_get`/`cache_set`) via `redis.asyncio`.
- `app/services/media_storage.py` — media asset persistence; media is categorized as `cover`/`banner`/`gallery`.
- `app/worker.py` — ARQ background worker (Redis-backed queue). Jobs: `generate_race_embedding` (single race), `reindex_all_races` (batch-enqueues un-embedded races). Run via ARQ's CLI against `WorkerSettings`, not inline.
- `app/i18n.py` — backend-side i18n helpers (races/CMS content support multi-language translations; see `docs/MULTI_LANGUAGE_IMPLEMENTATION.md`).
- Semantic search: races are embedded (pgvector) and searched via Reciprocal Rank Fusion of text + vector search — see `SEMANTIC_SEARCH_SETUP.md` before touching `races.py` search endpoints or `worker.py` embedding jobs.

### RBAC
Four roles: `admin`, `runner`, `organizer`, `volunteer` (`RoleEnum` in `models.py`), linked to `User` via a `UserRoleLink` join table. Prefer the predefined dependencies (`AdminUser`, `require_any_role([...])`) over manual `crud.user_has_any_role()` checks in new endpoints. Full schema/design rationale is in `RBAC.md` — read it before modifying role logic.

## Frontend Architecture

- `src/client/` is **generated** (via `@hey-api/openapi-ts`) — regenerate, never hand-edit.
- `src/routes/` uses TanStack Router file-based routing. **Route files must not use `export default`** — components go in the route config: `export const Route = createFileRoute("/path")({ component: MyComponent })`, with `MyComponent` defined separately in the same file. `routeTree.gen.ts` is auto-generated from these files.
- Route layout groups: `_layout.*` (authenticated app shell), `_public.*` / `$lang._public/*` (public, language-parameterized pages), `admin/` under `_layout.admin` (admin-only). `$lang` carries the active locale through the URL.
- `src/lib/utils.ts` centralizes formatting helpers (`formatDate`, `formatDateLong`, `formatShortDate`, `toDateTimeLocalString`, `formatPrice`, `formatStatus`, `getMediaUrl`, `cn`) — use these instead of re-implementing date/price/URL formatting inline. Use `toDateTimeLocalString()` for `datetime-local` inputs, not `.toISOString().slice(0,16)`.
- i18n via `react-i18next`; translation JSON in `src/i18n/locales/` (`en.json`, `vi.json`), accessed with nested keys (e.g. `home.hero.title`) through `useTranslation()`.
- Server state goes through TanStack Query wrapping the generated client; local/UI state via React hooks. Components are organized by feature under `src/components/` (`Admin/`, `Races/`, `Media/`, `Public/`, `UserSettings/`, etc.) with shared primitives in `components/ui/` (shadcn/ui).

## Key Gotchas

1. Regenerate the frontend client after any backend schema/route change; commit the generated diff.
2. TanStack Router route files must not have a default export.
3. Always use `SessionDep`/`CurrentUser` dependencies rather than constructing sessions or decoding tokens manually.
4. Backend IDs are `uuid.UUID`, not strings — don't loosen typing on new fields.
5. `.env` lives at the repo root (not `backend/.env`); backend config reads it via a relative `../.env` path.
6. The `runner-site` service in `compose.yml`/docs is not present in this checkout — verify before assuming it exists.
