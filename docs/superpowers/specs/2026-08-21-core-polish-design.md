# Core Polish Design

## Goal

Improve the existing Electron + Next.js interview project manager so it is strong enough to present as a resume project before adding online AI API integration.

This phase focuses on five areas:

- More robust AI response parsing and validation.
- Lightweight automated tests for the core parser and exporter.
- Basic analysis history management and re-run flow.
- Better project search, filtering, and sorting.
- Clear recovery behavior for failed and empty states.

API-based AI analysis is intentionally out of scope for this phase.

## Scope

### 1. Import Parsing Robustness

The parser will continue to accept the current JSON schema, but it should handle common real-world pasted AI output:

- Raw JSON.
- JSON wrapped in markdown fences.
- Extra explanation before or after the JSON object.
- Clear validation errors for missing or incorrectly typed fields.

The parser will not call AI or attempt semantic repair. It will only extract, parse, validate, and report actionable errors.

### 2. Automated Tests

Add a lightweight test setup using Node's built-in `node:test` runner. This avoids adding a full test framework.

Initial tests will cover:

- Successful parsing of valid AI response JSON.
- Parsing JSON wrapped in markdown code fences.
- Failure behavior for missing required fields.
- Export text containing actual project and analysis values.

### 3. Analysis History and Re-run Flow

Project detail will support selecting among existing analysis records instead of always showing only the latest one.

Behavior:

- Load all analyses for a project.
- Show a compact analysis history selector.
- Selecting an analysis updates overview, tech stack, files, questions, and resume highlights.
- Re-run uses the existing import page to create a new analysis version.
- Delete analysis is supported, with confirmation.

This avoids complex in-place editing for now while still giving users version control over generated analysis results.

### 4. Search, Filter, Sort

The dashboard will keep the current text search and add:

- Filter: all projects, analyzed projects, unanalyzed projects.
- Sort: recently updated, created time, name.
- Project cards will show whether an analysis exists.

The API can attach analysis status to projects, or the dashboard can fetch summaries separately. Prefer a small API summary shape to avoid repeated client requests.

### 5. Failure Recovery and Empty States

Improve user-facing recovery paths:

- Dashboard load failure shows an error with retry.
- Import failure keeps pasted content and lets the user go back.
- Export with no analysis shows a clear empty state instead of a misleading document.
- Delete failures show an error instead of silently doing nothing.
- Analysis history empty state points users to import analysis.

## Architecture

Keep the current structure:

- Database access remains in `src/lib/repositories`.
- API routes remain in `src/app/api`.
- UI state stays in page/components.
- Parser and export logic remain pure modules where possible.

Add only small new helpers where they reduce duplication:

- Repository functions for analysis summaries and deleting analyses.
- API routes for listing/deleting project analyses.
- Test fixtures for parser/export tests.

## Data Flow

Dashboard:

1. `GET /api/projects` returns projects with analysis status.
2. Client applies search/filter/sort locally.
3. Delete actions report success or visible failure.

Project detail:

1. Load project.
2. Load analysis list for project.
3. Load selected analysis with nested data.
4. Tabs render selected analysis.
5. Delete selected analysis refreshes the list.

Import:

1. User copies prompt and pastes AI JSON.
2. Parser extracts and validates JSON.
3. Valid analysis is inserted in one database transaction.
4. Preview shows saved analysis and links back to project detail.

Export:

1. Export uses selected or latest analysis.
2. If no analysis exists, return a clear message and the page displays empty state.

## Error Handling

Errors should be specific enough for users to recover:

- Validation errors name the missing/invalid field.
- API failures return consistent `{ error, details? }` JSON.
- UI catches failed fetches and provides retry or back actions.
- Database mutations are transactional where nested records are involved.

## Testing

Add `npm test` using a small Node test runner setup.

Because source files use TypeScript and path aliases, tests may run against compiled output after `npm run build`, or use a small test-specific loader if needed. Prefer the simplest reliable approach for this project.

Minimum verification:

- `npm test`
- `npm run build`

