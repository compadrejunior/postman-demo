# Task Management API — Epic Taxonomy

> **Purpose:** The canonical list of business epics used to roll up project progress. Every user story's `epic:` frontmatter **must** be one of the canonical names below. The project dashboard groups all progress by these epics and maps each to a business capability + status. The generator errors on any story whose `epic:` is not on this list — this harshness is intentional, and is what prevents taxonomy sprawl as the backlog grows.
>
> **Format contract:** `generate-dashboard.mjs` parses the table below *positionally* — the four cells of each data row (`n | Epic | Capability | Status`) must appear in this order. Column headers can say anything; only the row shape matters.

## Sizing scale (T-shirt → points)

Stories are sized S/M/L/XL. Points feed effort-weighted completion % and the roadmap timeline.

| Size | Points | Rule of thumb |
|------|--------|---------------|
| **S** | 1 | Small, self-contained tweak (one field, one validation rule, one small fix) |
| **M** | 3 | A normal feature story (one endpoint, one use-case, one adapter) |
| **L** | 5 | Cross-cutting or multi-part feature (several endpoints + persistence changes) |
| **XL** | 8 | Large initiative slice (new subsystem, deep cross-layer change) |

## Canonical epics → business capability & status

| # | Canonical epic | Business capability | Status |
|---|----------------|---------------------|--------|
| 1 | Auth Enhancements | Refresh token issuance/revocation, logout | Not started |
| 2 | Task Query Enhancements | Pagination and filtering on task list endpoints | Not started |
| 3 | Docker & Deploy Infrastructure | Containerized Dev/Test/Prod environments for the API and MongoDB | In progress |
| 4 | CI Pipeline | Automated lint/test/build/image-build enforcement on every PR | In progress |
| 5 | Project Process Adoption | Local Docket-based SDLC scaffolding (5-stage flow, dashboard, epics) | In progress |

---

*Maintained by hand; the source of truth for the epic dimension of the project dashboard. Add a new row (with the next `#`) when a genuinely new epic is needed — never repurpose an existing row for unrelated work.*
