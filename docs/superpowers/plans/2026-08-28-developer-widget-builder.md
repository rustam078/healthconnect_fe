# Developer Widget Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give a developer a "New widget" tab in the Add-widget drawer where they write SQL by hand, run it unsaved, see it drawn as its real chart type, and save it to the library only once it renders.

**Architecture:** A new `POST /api/v1/widgets/dry-run` endpoint runs a query through the existing safety guard, template engine and executor without persisting anything. The React panel previews those rows with `WidgetBody` — the same component the board uses — and only then calls the existing `POST /widgets`. Nothing is written before Save, so a rejected query leaves no soft-deleted row holding its `code`.

**Tech Stack:** Spring Boot (Java 21, Lombok, JUnit 5 + Mockito) in `D:\HMS\healthconnect`; React 19 + Vite + antd v6 + TanStack Query in `D:\HMS\healtconnectfe`.

**Spec:** `docs/superpowers/specs/2026-08-28-developer-widget-builder-design.md` (in the frontend repo).

## Global Constraints

- Two repos. Backend paths are relative to `D:\HMS\healthconnect`, frontend paths to `D:\HMS\healtconnectfe`. Every task states which.
- Backend: no new dependencies. Reuse `SqlSafetyGuard`, `SqlTemplateEngine`, `WidgetQueryExecutor`, `WidgetDataResponse`.
- Frontend: no new dependencies. JavaScript, not TypeScript. antd v6 — note `Space` takes `orientation="vertical"`, not `direction`.
- Comments explain **why**, not what, matching the surrounding code. Both codebases are heavily commented in that style; match it.
- The dry-run endpoint returns real database errors on purpose. Do not "fix" this by hiding them.
- The widget is created with `module: 'WIDGET'` and no `filters`. Do not add a module picker or a filters editor.
- Commit after every task, in the repo that task touched.

---

## File Structure

**Backend** (`D:\HMS\healthconnect`)

| File | Responsibility |
|---|---|
| `src/main/java/in/healthconnect/widgetengine/dto/request/DryRunWidgetRequest.java` | **new** — the request body: a SQL template and an optional page size |
| `src/main/java/in/healthconnect/widgetengine/service/WidgetExecutionService.java` | **modify** — add `dryRun`: guard → build → execute, no persistence, real errors |
| `src/main/java/in/healthconnect/widgetengine/controller/WidgetExecutionController.java` | **modify** — add the `POST /api/v1/widgets/dry-run` route |
| `src/test/java/in/healthconnect/widgetengine/service/WidgetExecutionServiceTest.java` | **modify** — three tests for `dryRun` |

**Frontend** (`D:\HMS\healtconnectfe`)

| File | Responsibility |
|---|---|
| `src/features/dashboard/widgetsApi.js` | **modify** — `dryRunWidget`, `createWidget` |
| `src/features/dashboard/boardsHooks.js` | **modify** — `useDryRunWidget`, `useCreateWidget` |
| `src/features/dashboard/NewWidgetPanel.jsx` | **new** — the tab: form, preview loop, save |
| `src/features/dashboard/WidgetGallery.jsx` | **modify** — register the tab behind `canCreateWidgets` |

`WidgetBody`, `WidgetPreviewCard`, `BoardGrid` and the board save path are untouched.

---

## Task 1: Backend — the dry-run service method

**Repo:** `D:\HMS\healthconnect`

**Files:**
- Create: `src/main/java/in/healthconnect/widgetengine/dto/request/DryRunWidgetRequest.java`
- Modify: `src/main/java/in/healthconnect/widgetengine/service/WidgetExecutionService.java`
- Test: `src/test/java/in/healthconnect/widgetengine/service/WidgetExecutionServiceTest.java`

**Interfaces:**
- Consumes: `SqlSafetyGuard.assertSelectOnly(String)`, `SqlTemplateEngine.build(QueryBuildRequest)`, `WidgetQueryExecutor.execute(PreparedQuery, boolean)`, `WidgetDataResponse.of(ExecutionResult, int, int)` — all already exist.
- Produces: `WidgetExecutionService.dryRun(DryRunWidgetRequest) -> WidgetDataResponse`, throwing `IllegalArgumentException` for anything the developer can fix. `DryRunWidgetRequest` has `getSqlTemplate()`, `getPageSize()` and an all-args constructor `(String sqlTemplate, Integer pageSize)`.

- [ ] **Step 1: Create the request DTO**

Create `src/main/java/in/healthconnect/widgetengine/dto/request/DryRunWidgetRequest.java`:

```java
package in.healthconnect.widgetengine.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// What the client sends to RUN a query that is NOT saved as a widget.
//
// There is no code, name or type here on purpose: this asks one question only -
// "does this query run, and what does it return?" Everything else about the widget
// is decided after the answer.
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DryRunWidgetRequest {

    // the query, with the same :name and {{name}} blanks a saved widget may use
    @NotBlank
    private String sqlTemplate;

    // optional; the engine applies its own default (50) and cap (200) when null
    private Integer pageSize;
}
```

- [ ] **Step 2: Write the failing tests**

Add these three tests to `src/test/java/in/healthconnect/widgetengine/service/WidgetExecutionServiceTest.java`, inside the existing class, after `databaseErrorIsLoggedAndHiddenFromClient`:

```java
    @Test
    void dryRunReturnsRowsWithoutSavingAnything() {
        when(executor.execute(any(PreparedQuery.class), anyBoolean()))
                .thenReturn(new ExecutionResult(List.of(Map.of("Doctor", "Dr A")), false));

        WidgetDataResponse response = service.dryRun(
                new DryRunWidgetRequest("SELECT name AS `Doctor` FROM doctors", 20));

        assertEquals(1, response.getRowCount());
        assertEquals("Dr A", response.getRows().get(0).get("Doctor"));
        assertEquals(20, response.getPageSize());
        assertEquals(1, response.getPageNo());

        // The widget does not exist yet: nothing to load, nothing to audit.
        verifyNoInteractions(widgetService);
        verifyNoInteractions(logRepository);
    }

    @Test
    void dryRunRejectsAQueryThatIsNotASelect() {
        assertThrows(IllegalArgumentException.class,
                () -> service.dryRun(new DryRunWidgetRequest("DELETE FROM doctors", 20)));

        // rejected before it could reach the database
        verifyNoInteractions(executor);
    }

    @Test
    void dryRunShowsTheRealDatabaseError() {
        when(executor.execute(any(PreparedQuery.class), anyBoolean()))
                .thenThrow(new RuntimeException("Unknown column 'patinet_id' in 'field list'"));

        IllegalArgumentException thrown = assertThrows(IllegalArgumentException.class,
                () -> service.dryRun(new DryRunWidgetRequest("SELECT patinet_id FROM doctors", 20)));

        // the developer wrote this query - they get to see what is actually wrong with it
        assertTrue(thrown.getMessage().contains("patinet_id"));
        verifyNoInteractions(logRepository);
    }
```

Add the import at the top of the test file, beside the other `dto.request` imports:

```java
import in.healthconnect.widgetengine.dto.request.DryRunWidgetRequest;
```

- [ ] **Step 3: Run the tests to verify they fail**

```bash
./mvnw.cmd test -Dtest=WidgetExecutionServiceTest
```

Expected: compilation failure — `cannot find symbol: method dryRun(DryRunWidgetRequest)`.

- [ ] **Step 4: Implement `dryRun`**

In `src/main/java/in/healthconnect/widgetengine/service/WidgetExecutionService.java`, add two imports:

```java
import in.healthconnect.widgetengine.dto.request.DryRunWidgetRequest;
import org.springframework.core.NestedExceptionUtils;
```

Then add these methods immediately after `buildPreview` (above the `// ---- helpers ----` comment):

```java
    // Run a query that is NOT a saved widget, so a developer can see what it returns
    // before committing it to the library.
    //
    // Same pipeline as execute(), minus the widget. Three deliberate differences:
    //   1. Nothing is loaded - there is no row yet, so there is no enabled check.
    //   2. Nothing is audited - widget_execution_log is keyed by widget, and a developer
    //      pressing "preview" in a form is not a dashboard fetch worth keeping.
    //   3. Errors are NOT hidden. execute() swaps real failures for a generic message so a
    //      dashboard viewer cannot probe the schema; here the caller wrote the query and
    //      needs to be told the column is spelled wrong.
    public WidgetDataResponse dryRun(DryRunWidgetRequest request) {
        safetyGuard.assertSelectOnly(request.getSqlTemplate());

        // No filter rules and no filter values: leftover {{blanks}} become "=" and leftover
        // :names bind to null, which is exactly how an unfiltered saved widget runs.
        PreparedQuery prepared = templateEngine.build(QueryBuildRequest.builder()
                .template(request.getSqlTemplate())
                .pageNo(1)
                .pageSize(request.getPageSize())
                .build());

        try {
            ExecutionResult result = queryExecutor.execute(prepared, true);
            return WidgetDataResponse.of(result, 1, prepared.getPageSize());
        } catch (Exception e) {
            logger.debug("Dry run failed: {}", e.getMessage());
            // IllegalArgumentException, not a bare RuntimeException: the global handler
            // turns it into a 400 with this message, where the catch-all would return a
            // 500 with nothing useful in it.
            throw new IllegalArgumentException(databaseMessage(e));
        }
    }

    // Dig out the database's own words. A Spring DataAccessException wraps the driver's
    // message in a paragraph about the failing statement; the cause is the sentence a
    // developer actually needs.
    private String databaseMessage(Exception e) {
        Throwable cause = NestedExceptionUtils.getMostSpecificCause(e);
        String message = cause.getMessage();
        return (message == null || message.isBlank()) ? "The query could not be run." : shorten(message);
    }
```

- [ ] **Step 5: Run the tests to verify they pass**

```bash
./mvnw.cmd test -Dtest=WidgetExecutionServiceTest
```

Expected: `Tests run: 6, Failures: 0, Errors: 0` — the three existing tests plus the three new ones.

- [ ] **Step 6: Commit**

```bash
git add src/main/java/in/healthconnect/widgetengine/dto/request/DryRunWidgetRequest.java src/main/java/in/healthconnect/widgetengine/service/WidgetExecutionService.java src/test/java/in/healthconnect/widgetengine/service/WidgetExecutionServiceTest.java
git commit -m "feat(widgets): run a query without saving it as a widget"
```

---

## Task 2: Backend — the dry-run endpoint

**Repo:** `D:\HMS\healthconnect`

**Files:**
- Modify: `src/main/java/in/healthconnect/widgetengine/controller/WidgetExecutionController.java`

**Interfaces:**
- Consumes: `WidgetExecutionService.dryRun(DryRunWidgetRequest)` from Task 1.
- Produces: `POST /api/v1/widgets/dry-run`, body `{ "sqlTemplate": string, "pageSize": number? }`, responding with the standard envelope `{ success, message, data: { rows, rowCount, pageNo, pageSize, hasNext } }`.

- [ ] **Step 1: Add the endpoint**

In `src/main/java/in/healthconnect/widgetengine/controller/WidgetExecutionController.java`, add two imports:

```java
import in.healthconnect.widgetengine.dto.request.DryRunWidgetRequest;
import jakarta.validation.Valid;
```

Add this method after `getData` and before `integration`:

```java
    // Run a query that has NOT been saved as a widget yet. Nothing is stored.
    //
    // This is the developer's "does it work?" button when writing a widget by hand:
    // unlike /data it returns the database's real complaint, because the person calling
    // it wrote the query and cannot fix what they cannot see.
    @PostMapping("/api/v1/widgets/dry-run")
    public ResponseEntity<ApiResponse<WidgetDataResponse>> dryRun(
            @RequestBody @Valid DryRunWidgetRequest request) {
        return ResponseEntity.ok(ApiResponse.success(executionService.dryRun(request)));
    }
```

- [ ] **Step 2: Rebuild and restart the backend**

```bash
./mvnw.cmd -q -DskipTests package
```

Expected: `BUILD SUCCESS`. Then restart the running application however you normally do (IDE run configuration, or `./mvnw.cmd spring-boot:run`).

- [ ] **Step 3: Verify the happy path by hand**

```bash
curl -s -X POST http://localhost:8080/api/v1/widgets/dry-run -H "Content-Type: application/json" -d "{\"sqlTemplate\":\"SELECT s.name AS \`Specialty\`, COUNT(DISTINCT d.id) AS \`Doctors\` FROM doctors d JOIN doctor_specialties_map dsm ON dsm.doctor_id = d.id JOIN specialties s ON s.id = dsm.specialty_id WHERE d.is_deleted = false AND s.is_deleted = false GROUP BY s.id, s.name ORDER BY \`Doctors\` DESC\",\"pageSize\":5}"
```

Expected: `"success":true` and a `rows` array of `{ "Specialty": ..., "Doctors": n }` objects.

- [ ] **Step 4: Verify a bad column returns the real error**

```bash
curl -s -X POST http://localhost:8080/api/v1/widgets/dry-run -H "Content-Type: application/json" -d "{\"sqlTemplate\":\"SELECT patinet_id FROM specialties\",\"pageSize\":5}"
```

Expected: HTTP 400, `"success":false`, and a `message` naming the unknown column `patinet_id`. If you get a 500 or a generic message instead, `databaseMessage` is not being reached — check that `dryRun` catches `Exception`, not a narrower type.

- [ ] **Step 5: Verify a write is refused**

```bash
curl -s -X POST http://localhost:8080/api/v1/widgets/dry-run -H "Content-Type: application/json" -d "{\"sqlTemplate\":\"DELETE FROM specialties\"}"
```

Expected: HTTP 400 with `Only read-only SELECT queries are allowed.`

- [ ] **Step 6: Commit**

```bash
git add src/main/java/in/healthconnect/widgetengine/controller/WidgetExecutionController.java
git commit -m "feat(widgets): expose POST /widgets/dry-run"
```

---

## Task 3: Frontend — API functions and hooks

**Repo:** `D:\HMS\healtconnectfe`

**Files:**
- Modify: `src/features/dashboard/widgetsApi.js`
- Modify: `src/features/dashboard/boardsHooks.js`

**Interfaces:**
- Consumes: `POST /api/v1/widgets/dry-run` from Task 2; the existing `POST /api/v1/widgets`.
- Produces:
  - `dryRunWidget({ sqlTemplate, pageSize })` → resolves to `{ rows, rowCount, pageNo, pageSize, hasNext }` (the envelope is unwrapped by `axiosClient`).
  - `createWidget({ code, name, description, type, sqlTemplate })` → resolves to the created `WidgetResponse`: `{ id, code, name, description, module, type, filters, enabled, status, createdAt, updatedAt }`.
  - `useDryRunWidget()` and `useCreateWidget()` — TanStack Query mutations wrapping the two above.

- [ ] **Step 1: Add the API functions**

Append to `src/features/dashboard/widgetsApi.js`:

```js
// Run a query that has NOT been saved yet.
//
// This is what lets the "New widget" tab prove a query works before anything is written:
// a widget rejected at preview time never existed, so there is no soft-deleted row left
// holding its code in the unique index.
export function dryRunWidget({ sqlTemplate, pageSize = 20 }) {
  return axiosClient.post('/widgets/dry-run', { sqlTemplate, pageSize })
}

// Save a hand-written widget. The backend creates it APPROVED, so it appears in the
// gallery immediately - unlike an AI draft, a person already reviewed this one by
// looking at its preview.
export function createWidget({ code, name, description, type, sqlTemplate }) {
  return axiosClient.post('/widgets', {
    code,
    name,
    description,
    type,
    sqlTemplate,
    // Fixed, not a form field: the gallery only ever lists WIDGET and approved PROMPT
    // widgets, so any other module would create something nobody can see.
    module: 'WIDGET',
  })
}
```

- [ ] **Step 2: Add the hooks**

In `src/features/dashboard/boardsHooks.js`, change the widgets import line:

```js
import { getWidgets, getWidgetData, deleteWidget, dryRunWidget, createWidget } from './widgetsApi.js'
```

Then append these two hooks at the end of the file:

```js
// Previewing is a one-shot action, not cached state: the same SQL run twice should hit
// the database twice, because the point is to see what the data looks like NOW.
export function useDryRunWidget() {
  return useMutation({ mutationFn: dryRunWidget })
}

// Creating a widget must invalidate the widget lists, or the new card only shows up in
// the Library tab after a page refresh.
export function useCreateWidget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createWidget,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['widgets'] }),
  })
}
```

- [ ] **Step 3: Verify it compiles**

```bash
npm run lint && npm run build
```

Expected: lint prints no findings; build ends with `✓ built in ...`.

- [ ] **Step 4: Commit**

```bash
git add src/features/dashboard/widgetsApi.js src/features/dashboard/boardsHooks.js
git commit -m "feat(dashboard): api and hooks for dry-run and widget creation"
```

---

## Task 4: Frontend — the New widget tab, form and preview

**Repo:** `D:\HMS\healtconnectfe`

**Files:**
- Create: `src/features/dashboard/NewWidgetPanel.jsx`
- Modify: `src/features/dashboard/WidgetGallery.jsx`

**Interfaces:**
- Consumes: `useDryRunWidget` from Task 3; `WidgetBody` (`{ type, rows, compact }`) unchanged.
- Produces: `NewWidgetPanel` default export, props `{ onAdd }` where `onAdd(widget)` takes the same shape `AskAiPanel` passes up: `{ id, code, name, type, module, status }`. Also exports `toCode(name)` for the slug, so it can be reasoned about on its own.

Save is added in Task 5. This task ends with a tab that previews but cannot save.

- [ ] **Step 1: Create the panel**

Create `src/features/dashboard/NewWidgetPanel.jsx`:

```jsx
import { useState } from 'react'
import { Input, Select, Button, Space, Alert, Spin, Typography, Form, theme } from 'antd'
import { PlayCircleOutlined } from '@ant-design/icons'
import { useDryRunWidget } from './boardsHooks.js'
import WidgetBody from './WidgetBody.jsx'

const { Text } = Typography

const TYPES = ['COUNT', 'TABLE', 'BAR', 'LINE', 'PIE']

// "Active doctors (2026)" -> "active-doctors-2026"
// The backend needs a unique code and nobody enjoys inventing one, so it follows the
// name until the developer edits it by hand.
export function toCode(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 150)
}

// The "New widget" tab of the Add-widget drawer - the developer's way in.
//
// Flow: write SQL -> "Run preview" runs it WITHOUT saving -> the rows are drawn with the
// same component the board uses -> save it once it looks right.
//
// Nothing is written to the database before Save. That is deliberate: a widget saved
// first and deleted after would be SOFT deleted, and its code would stay reserved in the
// unique index forever.
export default function NewWidgetPanel() {
  const { token } = theme.useToken()

  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [codeEdited, setCodeEdited] = useState(false)
  const [type, setType] = useState('TABLE')
  const [description, setDescription] = useState('')
  const [sql, setSql] = useState('')
  const [rows, setRows] = useState(null) // null = nothing previewed yet

  const dryRun = useDryRunWidget()

  const handleName = (value) => {
    setName(value)
    if (!codeEdited) setCode(toCode(value))
  }

  // Any edit to the query throws the preview away. Previewing query A and saving query B
  // is the one mistake this panel exists to prevent.
  const handleSql = (value) => {
    setSql(value)
    if (rows !== null) setRows(null)
    if (dryRun.isError) dryRun.reset()
  }

  const runPreview = () =>
    dryRun.mutate(
      { sqlTemplate: sql, pageSize: 20 },
      { onSuccess: (data) => setRows(data?.rows ?? []) },
    )

  const sqlBoxStyle = {
    fontFamily: 'Consolas, "Courier New", monospace',
    fontSize: 12,
    lineHeight: 1.5,
  }

  return (
    <Form layout="vertical">
      <Text type="secondary">
        Write the query yourself. It runs without being saved, so you can see exactly what
        the card will show before anything reaches the library.
      </Text>

      <Form.Item label="Name" required style={{ marginTop: 16 }}>
        <Input
          value={name}
          onChange={(e) => handleName(e.target.value)}
          placeholder="Doctors per specialty"
          maxLength={200}
        />
      </Form.Item>

      <Form.Item label="Code" required help="Unique. Used to look the widget up later.">
        <Input
          value={code}
          onChange={(e) => {
            setCodeEdited(true)
            setCode(e.target.value)
          }}
          placeholder="doctors-per-specialty"
          maxLength={150}
        />
      </Form.Item>

      <Form.Item label="Type">
        <Select
          value={type}
          onChange={setType}
          options={TYPES.map((t) => ({ label: t, value: t }))}
          style={{ maxWidth: 200 }}
        />
      </Form.Item>

      <Form.Item label="Description">
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What this widget answers (optional)"
          maxLength={1000}
        />
      </Form.Item>

      <Form.Item label="SQL" required>
        <Input.TextArea
          rows={6}
          value={sql}
          onChange={(e) => handleSql(e.target.value)}
          placeholder="SELECT label_column, numeric_column FROM ..."
          style={sqlBoxStyle}
        />
      </Form.Item>

      <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
        <Button
          icon={<PlayCircleOutlined />}
          loading={dryRun.isPending}
          disabled={!sql.trim()}
          onClick={runPreview}
          block
        >
          Run preview
        </Button>

        {dryRun.isError && (
          <Alert
            type="error"
            showIcon
            message="This query didn't run"
            description={dryRun.error?.message}
          />
        )}

        {rows !== null && rows.length === 0 && (
          <Alert
            type="warning"
            showIcon
            message="Ran fine, but returned no rows"
            description="You can still save it - the card will read 'No data' until there are rows."
          />
        )}

        {dryRun.isPending && <Spin />}

        {rows !== null && rows.length > 0 && (
          <div>
            <Text strong>Preview</Text>
            <div
              style={{
                marginTop: 8,
                padding: 12,
                border: `1px solid ${token.colorBorderSecondary}`,
                borderRadius: token.borderRadius,
                height: 260,
                overflow: 'auto',
              }}
            >
              <WidgetBody type={type} rows={rows} />
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Change the type above to see the same rows drawn a different way.
            </Text>
          </div>
        )}
      </Space>
    </Form>
  )
}
```

- [ ] **Step 2: Register the tab**

In `src/features/dashboard/WidgetGallery.jsx`, add the import beside the `AskAiPanel` one:

```jsx
import NewWidgetPanel from './NewWidgetPanel.jsx'
```

Add this constant just below the `const { Text } = Typography` line:

```jsx
// Writing raw SQL is a developer's job, and the tab shows raw database errors to match.
// There is no auth yet, so it is on for everyone; when Spring Security lands this single
// line becomes the role check.
const canCreateWidgets = true
```

Replace the `<Tabs ... />` element at the end of the component with:

```jsx
      <Tabs
        defaultActiveKey="library"
        items={[
          { key: 'library', label: 'Library', children: library },
          {
            key: 'ai',
            label: 'Ask AI',
            children: <AskAiPanel onAdd={addToSelection} />,
          },
          ...(canCreateWidgets
            ? [{ key: 'new', label: 'New widget', children: <NewWidgetPanel /> }]
            : []),
        ]}
      />
```

And add this helper next to `toggle`, so both tabs share one way of putting a widget into the selection:

```jsx
  const addToSelection = (widget) => setSelected((current) => [...current, widget])
```

- [ ] **Step 3: Verify it compiles**

```bash
npm run lint && npm run build
```

Expected: no lint findings, `✓ built in ...`.

- [ ] **Step 4: Verify the preview in the browser**

Start the app, open the Dashboard, click **Edit** then **Add widgets**, and open the **New widget** tab. Paste this into SQL and press **Run preview**:

```sql
SELECT s.name AS `Specialty`, COUNT(DISTINCT d.id) AS `Doctors` FROM doctors d JOIN doctor_specialties_map dsm ON dsm.doctor_id = d.id JOIN specialties s ON s.id = dsm.specialty_id WHERE d.is_deleted = false AND s.is_deleted = false GROUP BY s.id, s.name ORDER BY `Doctors` DESC
```

Check all four:
1. A table of specialties and counts appears.
2. Switching Type to `BAR` redraws it as a bar chart with no second network request (watch the network panel).
3. Typing a character in the SQL box makes the preview disappear.
4. Changing SQL to `SELECT patinet_id FROM specialties` and previewing shows a red alert naming `patinet_id`.

- [ ] **Step 5: Commit**

```bash
git add src/features/dashboard/NewWidgetPanel.jsx src/features/dashboard/WidgetGallery.jsx
git commit -m "feat(dashboard): New widget tab with an unsaved SQL preview"
```

---

## Task 5: Frontend — saving the widget

**Repo:** `D:\HMS\healtconnectfe`

**Files:**
- Modify: `src/features/dashboard/NewWidgetPanel.jsx`
- Modify: `src/features/dashboard/WidgetGallery.jsx`

**Interfaces:**
- Consumes: `useCreateWidget` from Task 3; `addToSelection` from Task 4.
- Produces: `NewWidgetPanel` now takes `onAdd` and calls it with `{ id, code, name, type, module, status }` after a successful save.

- [ ] **Step 1: Add the save path to the panel**

In `src/features/dashboard/NewWidgetPanel.jsx`:

Change the imports to add `App`, the two icons and the create hook:

```jsx
import { Input, Select, Button, Space, Alert, Spin, Typography, Form, theme, App } from 'antd'
import { PlayCircleOutlined, SaveOutlined, ClearOutlined } from '@ant-design/icons'
import { useDryRunWidget, useCreateWidget } from './boardsHooks.js'
```

Change the component signature and add the save state:

```jsx
export default function NewWidgetPanel({ onAdd }) {
  const { token } = theme.useToken()
  const { message } = App.useApp()
```

Add below `const dryRun = useDryRunWidget()`:

```jsx
  const create = useCreateWidget()
  const [codeError, setCodeError] = useState(null)
```

Add these three functions after `runPreview`:

```jsx
  const resetForm = () => {
    setName('')
    setCode('')
    setCodeEdited(false)
    setType('TABLE')
    setDescription('')
    setSql('')
    setRows(null)
    setCodeError(null)
    dryRun.reset()
  }

  // Save is only reachable once the query has actually run. A widget nobody has seen
  // render is exactly what this tab exists to avoid putting in the library.
  const canSave =
    name.trim() !== '' && code.trim() !== '' && sql.trim() !== '' && rows !== null

  const handleSave = () => {
    setCodeError(null)
    create.mutate(
      {
        code: code.trim(),
        name: name.trim(),
        description: description.trim() || undefined,
        type,
        sqlTemplate: sql,
      },
      {
        onSuccess: (created) => {
          onAdd({
            id: created.id,
            code: created.code,
            name: created.name,
            type: created.type,
            module: created.module,
            status: created.status,
          })
          resetForm()
          message.success('Widget saved to the library')
        },
        onError: (e) => {
          // A taken code is the one failure with an obvious home on the form, so it is
          // shown on the field to fix rather than in a toast that covers it.
          const onCode = e.fieldErrors?.code || (/code/i.test(e.message) ? e.message : null)
          if (onCode) setCodeError(onCode)
          else message.error(e.message || 'Could not save the widget')
        },
      },
    )
  }
```

Give the Code field its error state — replace the whole Code `Form.Item` with:

```jsx
      <Form.Item
        label="Code"
        required
        validateStatus={codeError ? 'error' : undefined}
        help={codeError || 'Unique. Used to look the widget up later.'}
      >
        <Input
          value={code}
          onChange={(e) => {
            setCodeEdited(true)
            setCodeError(null)
            setCode(e.target.value)
          }}
          placeholder="doctors-per-specialty"
          maxLength={150}
        />
      </Form.Item>
```

Finally add the two buttons. Replace the single `Run preview` button with:

```jsx
        <Space wrap>
          <Button
            icon={<PlayCircleOutlined />}
            loading={dryRun.isPending}
            disabled={!sql.trim()}
            onClick={runPreview}
          >
            Run preview
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={create.isPending}
            disabled={!canSave}
            onClick={handleSave}
          >
            Save widget
          </Button>
          <Button icon={<ClearOutlined />} onClick={resetForm}>
            Discard
          </Button>
        </Space>
```

- [ ] **Step 2: Pass `onAdd` from the gallery**

In `src/features/dashboard/WidgetGallery.jsx`, change the New widget tab entry to:

```jsx
            ? [{ key: 'new', label: 'New widget', children: <NewWidgetPanel onAdd={addToSelection} /> }]
```

- [ ] **Step 3: Verify it compiles**

```bash
npm run lint && npm run build
```

Expected: no lint findings, `✓ built in ...`.

- [ ] **Step 4: Verify saving in the browser**

In the New widget tab, fill in Name `Doctors per specialty`, leave the auto-filled Code, set Type to `BAR`, paste the specialties query from Task 4 Step 4, and press **Run preview** then **Save widget**.

Check all five:
1. A success toast appears and the form clears.
2. The drawer footer count goes up by one ("1 selected").
3. The Library tab now lists the new widget with a live mini preview.
4. **Add selected** puts it on the board, and **Save** on the board persists it — reload the page and it is still there, drawn as a bar chart.
5. Creating a second widget with the same code shows the "already taken" message under the Code field, not as a toast, and nothing is saved.

- [ ] **Step 5: Verify Save cannot outrun the preview**

Preview a good query, then edit one character of the SQL. **Save widget** must go disabled again. Press **Run preview** and it comes back.

- [ ] **Step 6: Commit**

```bash
git add src/features/dashboard/NewWidgetPanel.jsx src/features/dashboard/WidgetGallery.jsx
git commit -m "feat(dashboard): save a previewed widget to the library"
```

---

## Task 6: Update the spec's status

**Repo:** `D:\HMS\healtconnectfe`

**Files:**
- Modify: `docs/superpowers/specs/2026-08-28-developer-widget-builder-design.md:4`

- [ ] **Step 1: Mark the spec implemented**

Change line 4 from:

```markdown
**Status:** Draft (pending user spec review)
```

to:

```markdown
**Status:** Implemented 2026-08-28
```

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/specs/2026-08-28-developer-widget-builder-design.md
git commit -m "docs: mark the widget builder spec implemented"
```

---

## Self-review notes

Checked against the spec:

- §4 endpoint, placement, pipeline, no log row, verbatim errors → Tasks 1–2.
- §5 fields, auto-slug, fixed module, preview loop, type-switch without refetch, SQL edit invalidating Save, all five preview states, save/discard actions, code error on its field → Tasks 4–5.
- §6 data flow and the `onAdd` shape → Tasks 3–5.
- §7 file list → matches the File Structure table exactly.
- §8 testing → Task 1 (backend units), Tasks 3–5 (lint, build, browser).
- §9 out of scope → nothing in this plan touches widget editing, gallery deletion, filters JSON, or auth beyond the `canCreateWidgets` constant.

Names used consistently across tasks: `dryRun`, `DryRunWidgetRequest`, `dryRunWidget`, `useDryRunWidget`, `createWidget`, `useCreateWidget`, `NewWidgetPanel`, `toCode`, `canCreateWidgets`, `addToSelection`, `canSave`, `resetForm`.
