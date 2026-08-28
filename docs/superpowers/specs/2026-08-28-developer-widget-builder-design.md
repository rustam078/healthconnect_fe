# Developer Widget Builder — Design

**Date:** 2026-08-28
**Status:** Draft (pending user spec review)
**Spans two repos:** `D:\HMS\healtconnectfe` (React) and `D:\HMS\healthconnect` (Spring Boot)

## 1. Goal

Give a developer a third tab in the Add-widget drawer where they can write a SQL
widget by hand, run it, see it drawn as the chart type it will actually use, and
save it to the widget library only once it renders correctly.

Today the library can only grow two ways: seeded rows, or the Ask AI tab, which
always produces a `TABLE` widget from a plain-English question. There is no way
to add a hand-written `BAR` or `LINE` widget without inserting a database row.

## 2. Who it is for

Developers. The panel shows raw SQL and raw database error messages, which is
the point — the person using it wrote the query and needs to know why it failed.

Auth does not exist yet. When Spring Security lands, this tab is hidden from
ordinary users. The design keeps that to a single decision point: the tab is
included in the drawer's tab list behind one `canCreateWidgets` flag, so wiring
it to a real role check later is a one-line change in one file.

## 3. Why nothing is saved before the preview

The obvious implementation — save the widget, then run it to see if it works —
leaves wreckage. `WidgetService.create` stores hand-built widgets as `APPROVED`,
and `WidgetService.delete` only hard-deletes rows whose status is `DRAFT`. So a
rejected widget would be soft-deleted: the row stays in the table and its `code`
stays reserved in the `uk_widget_code` unique index forever, which is exactly the
problem that produced `-2` and `-3` code suffixes in the AI flow.

Instead the query is run **without being saved**. Nothing exists in the database
until Save, so rejecting a preview costs nothing and there is nothing to delete.

## 4. Backend: one new endpoint

`POST /api/v1/widgets/dry-run`

```json
{ "sqlTemplate": "select name, count(*) from ...", "pageSize": 20 }
```

Returns the same `WidgetDataResponse` shape as `/widgets/{idOrCode}/data`, so the
frontend renders a preview with the components it already has.

**Placement:** `WidgetExecutionController` — it runs a query, it does not manage
widgets. New DTO `DryRunWidgetRequest` (`sqlTemplate` `@NotBlank`, `pageSize`
optional). New method `WidgetExecutionService.dryRun(request)`.

**Implementation:** the same pipeline a saved widget goes through, minus the
widget:

1. `SqlSafetyGuard.assertSelectOnly(sqlTemplate)` — read-only SELECT or nothing.
2. `SqlTemplateEngine.build(...)` with no filter rules and no filter values.
3. `WidgetQueryExecutor.execute(prepared, true)` — technical columns hidden, the
   same as the dashboard path, so the preview matches the board.

A template containing `{{op}}` or `:param` blanks previews fine: the engine
already replaces leftover operator blanks with `=` and binds leftover named
parameters as null.

**No execution-log row is written.** `widget_execution_log` has a widget id
column and there is no widget yet. A dry run is a developer pressing a button in
a form, not a dashboard fetch worth auditing.

**Errors are returned verbatim.** This deviates from `execute`, which replaces
real failures with *"Unable to run this widget. Please try again later."* to keep
schema details away from dashboard viewers. That message is useless to someone
debugging SQL they typed thirty seconds ago, and the caller already supplied the
query, so the response carries the real message (`Unknown column 'patinet_id' in
'field list'`). The full stack trace is still server-side only.

Errors that reach the client, all as 400s through the existing
`GlobalExceptionHandler`:

| Cause | Message the developer sees |
|---|---|
| Not a SELECT (`delete from ...`) | whatever `SqlSafetyGuard` throws |
| Empty template | `Query template is empty.` |
| Bad column / bad table / syntax error | the database's own message |

## 5. Frontend: a third tab

`src/features/dashboard/NewWidgetPanel.jsx`, added to `WidgetGallery`'s tab list
after Library and Ask AI.

**Fields**

| Field | Rules |
|---|---|
| Name | required, max 200 — the card heading |
| Code | required, max 150, unique. Auto-slugged from the name (`Active doctors` → `active-doctors`) and editable; once edited by hand it stops following the name |
| Type | `COUNT` / `TABLE` / `BAR` / `LINE` / `PIE`, default `TABLE` |
| Description | optional, max 1000 |
| SQL | required, monospace textarea |

`module` is fixed to `WIDGET` and `enabled` to true. Exposing module would let a
developer create an `INTEGRATION` widget that the gallery never lists, and the
gallery is the only reason this panel exists.

**The preview loop**

- **Run preview** calls dry-run and holds the rows in local state.
- The rows are drawn with `WidgetBody` — the same component the board card and
  the gallery card use. The preview is not a mock-up of the widget; it is the
  widget.
- Changing **Type** re-renders from the rows already in hand, with no second
  request, so a developer can flip bar → line → pie and keep whichever reads
  best.
- Editing the **SQL** clears the preview and disables Save. Otherwise you could
  preview query A and save query B. Editing name, code, description or type does
  not, since none of them change what the query returns.

**Preview states**

| State | Shown | Save |
|---|---|---|
| Nothing run yet | hint text | disabled |
| Running | spinner | disabled |
| Failed | red alert with the real SQL error | disabled |
| Ran, no rows | warning: ran fine, returned no rows; the card will read "No data" until it does | **enabled** |
| Ran, rows | the widget, drawn as its type | enabled |

Zero rows does not block saving. A developer can tell a broken query from one
whose table is simply empty this week, and blocking it would make a correct
widget unsaveable until its data happens to exist.

**Actions**

- **Save widget** — `POST /widgets`, then the new widget joins the drawer's
  current selection exactly as an approved AI draft does, the widget lists are
  invalidated so it appears under Library, and the form resets for the next one.
  "Add selected" still puts it on the board.
- **Discard** — clears the form and the preview. Nothing was saved, so this is
  the "hard delete" case: there is no row and no burnt code.

**Save-time errors.** A duplicate code returns 400 `The code 'x' is already taken
(possibly by a widget that was deleted). Choose another.` — surfaced on the Code
field, not as a toast, because that is the field to fix. Field-level validation
errors from `@Valid` arrive in `fieldErrors` and map onto their fields.

## 6. Data flow

```
NewWidgetPanel
  ├─ useDryRunWidget()   POST /widgets/dry-run     -> rows (local state)
  │     └─ WidgetBody type={type} rows={rows}      -> the live preview
  └─ useCreateWidget()   POST /widgets             -> created widget
        ├─ invalidate ['widgets']                  -> Library tab refreshes
        └─ onAdd(created)                          -> drawer selection
```

`onAdd` takes the same shape the Ask AI tab passes up (`{ id, code, name, type,
module, status }`), so `WidgetGallery` needs no new branch — it already knows how
to hold a selected widget from a tab.

## 7. Files

**Backend** (`D:\HMS\healthconnect`)

- `dto/request/DryRunWidgetRequest.java` — new
- `service/WidgetExecutionService.java` — add `dryRun`
- `controller/WidgetExecutionController.java` — add the endpoint
- `test/.../service/WidgetExecutionServiceTest.java` — extend

**Frontend** (`D:\HMS\healtconnectfe`)

- `features/dashboard/NewWidgetPanel.jsx` — new
- `features/dashboard/widgetsApi.js` — add `dryRunWidget`, `createWidget`
- `features/dashboard/boardsHooks.js` — add `useDryRunWidget`, `useCreateWidget`
- `features/dashboard/WidgetGallery.jsx` — add the tab behind `canCreateWidgets`

No change to `WidgetBody`, `WidgetPreviewCard`, `BoardGrid` or the board save
path. The new widget is an ordinary `WIDGET`-module row from the moment it is
saved.

## 8. Testing

**Backend** — unit tests beside the existing `WidgetExecutionServiceTest`:
a non-SELECT template is rejected before it can run; an empty template is
rejected; a valid template returns its rows; nothing is written to the widget or
execution-log repositories.

**Frontend** — the project has no test runner (`package.json` has `lint` and
`build`, no `test`), so verification is `npm run lint`, `npm run build`, and
driving the real drawer in the browser: a good query previews and saves and lands
on the board; a query with a bad column shows the database's message and cannot
be saved; editing the SQL after a good preview disables Save again; a duplicate
code shows on the Code field.

## 9. Out of scope

- Editing an existing widget. `PUT /widgets/{id}` exists; nothing calls it. A
  separate piece of work.
- Deleting saved hand-built widgets from the gallery. The gallery's delete button
  stays AI-only: hand-built widgets are shared and other boards use them, and
  deleting one is a soft delete that keeps its code reserved.
- The `filters` JSON config. Filterable keys and sortable columns are what make
  an `INTEGRATION` widget useful; a dashboard card does not need them.
- Real auth. The tab hides behind `canCreateWidgets`, which is hardcoded true
  until Spring Security lands.
