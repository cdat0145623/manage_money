# Brownfield Discovery: Mobile report month-filter overflow

## Metadata

```text
Created: 2026-11-04
Feature: Báo cáo & phân bổ mobile month filters
Subject: Current report filter layout and iOS overflow evidence
Source Spec: SPEC.md
Status: Discovery
```

## 1. Feature Scope

Investigate the mobile `Từ`/`Đến` month filters on the Báo cáo & phân bổ page. The supplied iPhone screenshot shows each visible month control extending to the right viewport edge after the controls were moved to separate rows. The task is to identify the existing layout path and the smallest compatible fix.

## 2. Domain Concepts

- Report mode: `spent` or `allocated`.
- Report range: inclusive `from` and `to` calendar months.
- Report grouping: channel, tag, or expense kind.
- Allocation status: all, future, active, or ended.
- Mobile responsive layout: report filters must fit the viewport without page-level horizontal scrolling.

## 3. Existing System Map

```text
App
└── main.main-content
    └── ReportsPage (src/App.tsx)
        ├── PageHeader + shared MonthPicker
        ├── report-switch
        ├── report-toolbar
        │   ├── label + input[type=month] (from)
        │   ├── label + input[type=month] (to)
        │   ├── select (group)
        │   ├── select (status)
        │   └── input (description query)
        └── report stats and report-grid
```

## 4. Database Findings

Not relevant to this presentation-only defect. Reports consume the existing `Data` object and calculate filtered values in the client. No database schema or API contract is involved in the failing layout.

## 5. Backend Findings

Not relevant to this presentation-only defect. No request, mutation, or server-side calculation is needed to render the month controls.

## 6. Existing Similar Implementations

| Existing implementation | Location | Similarity | Reuse potential | Notes |
|---|---|---|---|---|
| Shared header month picker | `src/App.tsx`, `MonthPicker()` | Uses `input[type=month]` for the selected report month | Pattern only | Its input is visually hidden and is not the overflowing visible range control. |
| Expense filters | `src/App.tsx`, `ExpensesPage()` and `src/style.css` `.filters` | Responsive filter grid and full-width search input | Pattern only | It does not contain visible month inputs. |
| Report range filters | `src/App.tsx`, `ReportsPage()` | Exact failing path | Extend | The two labels contain direct text nodes plus visible month inputs. |

## 7. Frontend/UI Findings

- `ReportsPage` is defined in `src/App.tsx` around line 871.
- The visible range controls are two labels around lines 948–967:
  - `<label className="range-filter">Từ <input type="month" ... /></label>`
  - `<label className="range-filter">Đến <input type="month" ... /></label>`
- The report toolbar also contains the group select, status select, and description search input.
- The shared `MonthPicker` around lines 170–214 also contains `input[type=month]`, but `src/style.css` positions that input absolutely, sets opacity to zero, and reduces it to `1px`; it is not the visible control in the screenshot.
- Desktop/base `.report-toolbar` is a wrapping flex container (`src/style.css` around lines 574–580).
- Base report labels are flex rows (`src/style.css` around lines 937–943).
- Mobile `.report-toolbar` is changed to a two-column grid, while `.range-filter` spans both columns (`src/style.css` around lines 1309–1315).
- Mobile labels were changed to `display: grid` with `min-width: 0`; report inputs/selects use `width: 100%`, `min-width: 0`, `max-width: 100%`, and `box-sizing: border-box` (`src/style.css` around lines 1317–1333).
- The label text is a direct anonymous grid item. There is no explicit wrapper around `Từ` or `Đến`.

## 8. API Findings

No API is involved in the visual defect. No request or response was observed.

## 9. Business Rules

```text
Rule: The report range is inclusive and is represented by from/to YYYY-MM values.
Evidence: ReportsPage filters and totals use `from` and `to` in `src/App.tsx`.
Enforced at: Client state and report calculations.
Feature relevance: The fix must preserve the existing values and change only layout.
```

```text
Rule: The app must not require horizontal zooming or page-level horizontal scrolling on mobile.
Evidence: SPEC.md mobile UI requirements and the supplied iPhone screenshot.
Enforced at: Responsive CSS and the browser viewport.
Feature relevance: The visible range controls must stay inside `.main-content` on iOS Safari as well as desktop emulation.
```

## 10. Dependency / Impact Map

```text
ReportsPage range state
└── report-toolbar DOM
    └── mobile grid
        └── range-filter label sizing
            └── visible input[type=month] width
```

Only `ReportsPage` markup and its report-toolbar responsive CSS are directly affected. The shared header `MonthPicker` and report calculations are indirect/non-impacting for this defect.

## 11. Existing Conventions

### Database

No database changes for this UI defect.

### Backend

No backend changes for this UI defect.

### Frontend

- React + TypeScript with page-local state.
- Shared CSS in `src/style.css` with base rules followed by responsive media queries.
- Native HTML controls are used instead of a component library.
- Global `box-sizing: border-box` is already present.

### Testing

- `npm run typecheck` is the existing static check.
- Vite dev server is the active hot-reload runtime; production build is unnecessary for this CSS-only change.
- Browser automation is not available in the current in-app browser backend, so the supplied real-device screenshot is the strongest reproduction evidence.

### Architecture

- Single Vite SPA; no separate web container.
- Local API is separate from the visual layout path.

## 12. Reuse Candidates

- Reuse the existing `.report-toolbar` and `.range-filter` classes.
- Keep the existing two-column grid for the group/status selects.
- Keep the existing `min-width: 0` and `box-sizing` safeguards.
- Prefer a flex-column label layout over adding a new component or dependency.

## 13. Risks and Constraints

- iOS Safari can apply intrinsic sizing and native appearance rules to `input[type=month]` differently from Chromium desktop emulation.
- The label contains an anonymous text grid item, so `display: grid` can create intrinsic track sizing that is not obvious in desktop emulation.
- The native month picker popup remains browser-controlled; only the field layout can be normalized with CSS.
- The workspace is not a Git repository (`git rev-parse --show-toplevel` reports that no `.git` directory exists); no branch/remote comparison is available.

## 14. Unknowns

### Product unknowns

- Whether the product wants a native month picker or a custom month selector is not changed by this bug fix; current implementation uses native month inputs.

### Technical unknowns

- The exact Safari computed width cannot be captured through the current browser automation backend.
- The screenshot is from the public tunnel on a real iPhone; local CSS can be compared to the public response, but the device DOM geometry must be confirmed by the user after refresh.

## 15. Discovery Summary

```text
Existing capabilities:
- ReportsPage already has the two visible month controls and responsive toolbar rules.
- Global box sizing and width constraints already exist.

Likely reusable pieces:
- Existing `.report-toolbar` and `.range-filter` rules.
- A flex-column label layout using native CSS.

Major affected areas:
- `src/App.tsx` report filter markup only if a text wrapper becomes necessary.
- Mobile `.report-toolbar label` rules in `src/style.css`.

Important constraints:
- Preserve range state and report calculations.
- Keep group/status selects in two columns.
- Avoid new packages or a custom picker for this layout defect.

Critical unknowns:
- The exact mobile browser computed width is not observable through the current browser backend. The real-device follow-up screenshot was from Chrome on iPhone; the grid-label change alone did not remove the overflow, confirming the remaining issue is specific to the native month control's rendered box.
```

## Follow-up Evidence

- The user confirmed the failing screenshot was Chrome on iPhone, not Safari.
- After the label changed from grid to flex, the month fields still reached the viewport edge while the selects and search input remained inside the content padding.
- The visible report controls therefore need an app-owned wrapper for the border and width. The native month input remains nested inside that wrapper for picker behavior.
- A regression check in `tests/report-layout.test.ts` now guards the mobile flex layout, native appearance reset, and wrapper overflow boundary.
